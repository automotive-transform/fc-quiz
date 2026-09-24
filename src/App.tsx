import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { loadFlashcards, loadQuizzes, loadTopics, filterByTopic } from './services/contentService'
import { calculateQuizScore, isSingleChoiceCorrect, shuffle } from './services/quizService'
import { getFlashcardProgress, saveFlashcardProgress, saveQuizAttempt } from './utils/storage'
import type {
  Flashcard,
  FlashcardProgress,
  LearningStatus,
  QuizAnswerRecord,
  QuizQuestion,
  Topic,
} from './types'

type ContentMode = 'flashcards' | 'quizzes'

function App() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState('can')
  const [contentMode, setContentMode] = useState<ContentMode>('flashcards')
  const [progress, setProgress] = useState<Record<string, FlashcardProgress>>({})
  const [selectedCardIndex, setSelectedCardIndex] = useState(0)
  const [cardFlipped, setCardFlipped] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [questionResult, setQuestionResult] = useState<boolean | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswerRecord[]>([])
  const [latestResult, setLatestResult] = useState<{
    score: number
    total: number
    incorrectQuestionIds: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
   Promise.all([loadTopics(), loadFlashcards(), loadQuizzes()])
      .then(([topicsData, flashcardsData, quizzesData]) => {
        setTopics(topicsData)
        setFlashcards(flashcardsData)
        setQuizzes(quizzesData)
        setSelectedTopicId((current) => {
          if (current && topicsData.some((topic) => topic.id === current)) {
            return current
          }

          return topicsData[0]?.id ?? ''
        })
        setProgress(getFlashcardProgress())
      })
      .catch(() => {
        setError('Dữ liệu khóa học không tải được. Vui lòng kiểm tra các tệp trong content/.')
      })
  }, [])

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === selectedTopicId) ?? topics[0],
    [selectedTopicId, topics],
  )

  const topicFlashcards = useMemo(
    () => filterByTopic(flashcards, selectedTopicId),
    [flashcards, selectedTopicId],
  )

  const topicQuizzes = useMemo(
    () => filterByTopic(quizzes, selectedTopicId),
    [quizzes, selectedTopicId],
  )

  const currentFlashcard = topicFlashcards[selectedCardIndex] ?? null
  const currentQuestion = quizQuestions[quizQuestionIndex] ?? null

  useEffect(() => {
    setSelectedCardIndex(0)
    setCardFlipped(false)
    setQuizStarted(false)
    setQuizFinished(false)
    setQuizQuestionIndex(0)
    setQuizQuestions([])
    setSelectedOptionId(null)
    setAnswered(false)
    setQuestionResult(null)
    setQuizAnswers([])
    setLatestResult(null)
  }, [selectedTopicId])

  useEffect(() => {
    if (contentMode === 'quizzes' && topicQuizzes.length && !quizFinished) {
      startQuiz()
    }
  }, [contentMode, selectedTopicId, topicQuizzes.length])

  const updateFlashcardStatus = (flashcardId: string, status: LearningStatus) => {
    const nextProgress = {
      ...progress,
      [flashcardId]: {
        status,
        lastReviewedAt: new Date().toISOString(),
        reviewCount: (progress[flashcardId]?.reviewCount ?? 0) + 1,
      },
    }

    setProgress(nextProgress)
    saveFlashcardProgress(nextProgress)
  }

  const startQuiz = () => {
    if (!topicQuizzes.length) return

    const orderedQuestions = shuffle(topicQuizzes).slice(0, Math.min(5, topicQuizzes.length))

    setQuizQuestions(orderedQuestions)
    setQuizStarted(true)
    setQuizFinished(false)
    setQuizQuestionIndex(0)
    setSelectedOptionId(null)
    setAnswered(false)
    setQuestionResult(null)
    setQuizAnswers([])
    setLatestResult(null)
  }

  const submitAnswer = () => {
    if (!currentQuestion || !selectedOptionId) return

    const isCorrect = isSingleChoiceCorrect(
      selectedOptionId,
      currentQuestion.correctOptionIds,
    )

    const nextAnswers = [
      ...quizAnswers,
      {
        id: currentQuestion.id,
        selectedOptionId,
        correctOptionIds: currentQuestion.correctOptionIds,
      },
    ]

    setQuizAnswers(nextAnswers)
    setAnswered(true)
    setQuestionResult(isCorrect)

    if (quizQuestionIndex === quizQuestions.length - 1) {
      const result = calculateQuizScore(nextAnswers, quizQuestions)
      setLatestResult(result)
      setQuizStarted(false)
      setQuizFinished(true)
      saveQuizAttempt({
        attemptId: `attempt-${Date.now()}`,
        topicId: selectedTopicId,
        score: result.score,
        total: result.total,
        completedAt: new Date().toISOString(),
        incorrectQuestionIds: result.incorrectQuestionIds,
      })
    }
  }

  const nextQuestion = () => {
    if (!currentQuestion) return

    if (quizQuestionIndex < quizQuestions.length - 1) {
      setQuizQuestionIndex((previous) => previous + 1)
      setSelectedOptionId(null)
      setAnswered(false)
      setQuestionResult(null)
    }
  }

  const incorrectQuestions = latestResult
    ? quizQuestions.filter((question) => latestResult.incorrectQuestionIds.includes(question.id))
    : []

  const firstRelatedFlashcardId = incorrectQuestions.find((question) => question.relatedFlashcardIds?.length)?.relatedFlashcardIds?.[0]

  const openRelatedFlashcard = (relatedFlashcardIds?: string[]) => {
    const targetId = relatedFlashcardIds?.[0]
    if (!targetId) return

    const index = topicFlashcards.findIndex((card) => card.id === targetId)
    if (index < 0) return

    setContentMode('flashcards')
    setSelectedCardIndex(index)
    setCardFlipped(true)
    setQuizStarted(false)
    setQuizFinished(false)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Automotive Transform</p>
          <h1>Flashcards & Quiz</h1>
        </div>

        <div className="topbar-actions">
          <div className="mode-switch" aria-label="Learning mode switch">
            <button
              type="button"
              className={contentMode === 'flashcards' ? 'active' : ''}
              onClick={() => setContentMode('flashcards')}
            >
              Flashcards
            </button>
            <button
              type="button"
              className={contentMode === 'quizzes' ? 'active' : ''}
              onClick={() => setContentMode('quizzes')}
            >
              Quiz
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="notice error">{error}</div>
      ) : null}

      <div className="panel topic-strip">
        <div className="topic-strip-header">
          <p className="eyebrow">Topics</p>
          <span className="topic-count">{topics.length} subjects</span>
        </div>

        <div className="topic-row" role="tablist" aria-label="Topic list">
          {topics.map((topic) => (
            <button
              key={topic.id}
              type="button"
              role="tab"
              aria-selected={selectedTopicId === topic.id}
              className={`topic-chip ${selectedTopicId === topic.id ? 'active' : ''}`}
              onClick={() => setSelectedTopicId(topic.id)}
            >
              <span>{topic.title}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="content-panel">
        {selectedTopic ? (
          <>
            <div className="panel topic-header">
              <div>
                <p className="eyebrow">Selected topic</p>
                <h2>{selectedTopic.title}</h2>
              </div>
              <span className="topic-meta">
                {contentMode === 'flashcards'
                  ? `${topicFlashcards.length} cards`
                  : `${topicQuizzes.length} quizzes`}
              </span>
            </div>

            {contentMode === 'flashcards' ? (
              <div className="panel">
                <div className="section-heading">
                  <h3>Flashcards</h3>
                  <span className="tap-hint">Tap card to flip</span>
                </div>

                {currentFlashcard ? (
                  <>
                    <div
                      className={`flashcard ${cardFlipped ? 'flipped' : ''}`}
                      onClick={() => setCardFlipped((value) => !value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setCardFlipped((value) => !value)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flashcard-inner">
                        <div className="flashcard-face front">
                          <span className="pill">Front</span>
                          <h4>{currentFlashcard.term}</h4>
                          <p>{currentFlashcard.definitionEn}</p>
                        </div>
                        <div className="flashcard-face back">
                          <span className="pill alt">Back</span>
                          <h4>{currentFlashcard.meaningVi}</h4>
                          <p>{currentFlashcard.explanationVi}</p>
                          <ul>
                            {currentFlashcard.relatedTerms?.length ? (
                              currentFlashcard.relatedTerms.map((term) => <li key={term}>{term}</li>)
                            ) : (
                              <li>No related terms</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flashcard-actions">
                      <button type="button" onClick={() => setSelectedCardIndex((index) => Math.max(index - 1, 0))}>
                        Previous
                      </button>
                      <button type="button" onClick={() => setSelectedCardIndex((index) => Math.min(index + 1, topicFlashcards.length - 1))}>
                        Next
                      </button>
                    </div>

                    <div className="status-row">
                      <button type="button" className={progress[currentFlashcard.id]?.status === 'new' ? 'selected' : ''} onClick={() => updateFlashcardStatus(currentFlashcard.id, 'new')}>
                        New
                      </button>
                      <button type="button" className={progress[currentFlashcard.id]?.status === 'learning' ? 'selected' : ''} onClick={() => updateFlashcardStatus(currentFlashcard.id, 'learning')}>
                        Learning
                      </button>
                      <button type="button" className={progress[currentFlashcard.id]?.status === 'known' ? 'selected' : ''} onClick={() => updateFlashcardStatus(currentFlashcard.id, 'known')}>
                        Known
                      </button>
                    </div>

                    <div className="meta-list">
                      <p><strong>Card type:</strong> {currentFlashcard.cardType}</p>
                      <p>
                        <strong>Source:</strong>{' '}
                        {typeof currentFlashcard.source === 'string'
                          ? currentFlashcard.source
                          : currentFlashcard.source?.document || currentFlashcard.source?.section || 'Not specified'}
                      </p>
                      <p><strong>Difficulty:</strong> {currentFlashcard.difficulty ?? 'not set'}</p>
                      <p><strong>Review:</strong> {currentFlashcard.reviewStatus ?? 'draft'}</p>
                    </div>
                  </>
                ) : (
                  <div className="notice">No flashcards are available for this topic yet.</div>
                )}
              </div>
            ) : (
              <div className="panel">
                <div className="section-heading">
                  <h3>Quiz</h3>
                </div>

                {quizStarted && currentQuestion ? (
                  <div className="quiz-box">
                    <p className="quiz-index">
                      Question {quizQuestionIndex + 1} / {quizQuestions.length}
                    </p>
                    <h4>{currentQuestion.questionEn}</h4>
                    {currentQuestion.questionVi ? <p className="question-vi">{currentQuestion.questionVi}</p> : null}

                    <div className="options-list">
                      {currentQuestion.options.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={`option-button ${selectedOptionId === option.id ? 'selected' : ''}`}
                          onClick={() => !answered && setSelectedOptionId(option.id)}
                          disabled={answered}
                        >
                          <span>{option.id.toUpperCase()}</span>
                          {option.text}
                        </button>
                      ))}
                    </div>

                    {!answered ? (
                      <button type="button" className="primary" onClick={submitAnswer} disabled={!selectedOptionId}>
                        Check answer
                      </button>
                    ) : (
                      <>
                        <div className={`result-banner ${questionResult ? 'correct' : 'incorrect'}`}>
                          {questionResult ? 'Correct answer' : 'Incorrect answer'}
                        </div>

                        {questionResult ? (
                          <>
                            <p className="explanation">{currentQuestion.explanationVi}</p>

                            {quizQuestionIndex < quizQuestions.length - 1 ? (
                              <button type="button" className="primary" onClick={nextQuestion}>
                                Next question
                              </button>
                            ) : (
                              <button type="button" className="primary" onClick={() => setQuizFinished(true)}>
                                View result
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            {quizQuestionIndex < quizQuestions.length - 1 ? (
                              <button type="button" className="primary" onClick={nextQuestion}>
                                Next question
                              </button>
                            ) : (
                              <button type="button" className="primary" onClick={() => setQuizFinished(true)}>
                                View result
                              </button>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                ) : null}

                {quizFinished && latestResult ? (
                  <div className="quiz-result-box">
                    <h4>Quiz result</h4>
                    <p className="score-line">
                      {latestResult.score} / {latestResult.total} correct
                    </p>
                    <p>
                      {Math.round((latestResult.score / latestResult.total) * 100) || 0}%
                    </p>

                    <div className="incorrect-list">
                      {incorrectQuestions.length ? (
                        <>
                          {firstRelatedFlashcardId ? (
                            <button
                              type="button"
                              className="link-button"
                              onClick={() => openRelatedFlashcard([firstRelatedFlashcardId])}
                            >
                              Open related flashcard
                            </button>
                          ) : null}
                        </>
                      ) : (
                        <p>Excellent work — no incorrect answers this round.</p>
                      )}
                    </div>

                    <button type="button" className="primary" onClick={startQuiz}>
                      Retake quiz
                    </button>
                  </div>
                ) : null}

                {!quizStarted && !quizFinished && !topicQuizzes.length ? (
                  <div className="notice">No quiz questions are available for this topic yet.</div>
                ) : null}
              </div>
            )}
          </>
        ) : (
          <div className="notice">Choose a topic to start.</div>
        )}
      </main>
    </div>
  )
}

export default App

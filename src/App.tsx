import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { loadFlashcards, loadQuizzes, loadTopics, filterByTopic } from './services/contentService'
import { calculateQuizScore, isSingleChoiceCorrect } from './services/quizService'
import { getFlashcardProgress, saveFlashcardProgress, saveQuizAttempt } from './utils/storage'
import {
  createStudyState,
  getStudySelection,
  getOriginalItemNumber,
  getStudyStateKey,
  getStudyStates,
  resolveStudyState,
  saveStudySelection,
  saveStudyStates,
  type StudyMode,
  type StudyState,
  type StudyStateMap,
} from './utils/studyState'
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
  const [savedSelection] = useState(getStudySelection)
  const [studyStates, setStudyStates] = useState(getStudyStates)
  const [topics, setTopics] = useState<Topic[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([])
  const [contentLoaded, setContentLoaded] = useState(false)
  const [selectedTopicId, setSelectedTopicId] = useState(savedSelection?.topicId ?? 'can')
  const [contentMode, setContentMode] = useState<ContentMode>(savedSelection?.feature ?? 'flashcards')
  const [progress, setProgress] = useState<Record<string, FlashcardProgress>>({})
  const [cardFlipped, setCardFlipped] = useState(false)
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

          if (savedSelection?.topicId && topicsData.some((topic) => topic.id === savedSelection.topicId)) {
            return savedSelection.topicId
          }

          return topicsData[0]?.id ?? ''
        })
        setProgress(getFlashcardProgress())
        setContentLoaded(true)
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

  const activeItems = contentMode === 'flashcards' ? topicFlashcards : topicQuizzes
  const activeItemIds = useMemo(() => activeItems.map((item) => item.id), [activeItems])
  const activeStudyKey = getStudyStateKey(contentMode, selectedTopicId)
  const activeStudyState = useMemo(
    () => resolveStudyState(studyStates[activeStudyKey], selectedTopicId, activeItemIds),
    [studyStates, activeStudyKey, selectedTopicId, activeItemIds],
  )
  const orderedFlashcards = useMemo(() => {
    if (contentMode !== 'flashcards' || activeStudyState.mode !== 'random') return topicFlashcards
    const cardsById = new Map(topicFlashcards.map((card) => [card.id, card]))
    return (activeStudyState.order ?? []).flatMap((id) => {
      const card = cardsById.get(id)
      return card ? [card] : []
    })
  }, [contentMode, activeStudyState, topicFlashcards])
  const orderedQuizzes = useMemo(() => {
    if (contentMode !== 'quizzes' || activeStudyState.mode !== 'random') return topicQuizzes
    const quizzesById = new Map(topicQuizzes.map((question) => [question.id, question]))
    return (activeStudyState.order ?? []).flatMap((id) => {
      const question = quizzesById.get(id)
      return question ? [question] : []
    })
  }, [contentMode, activeStudyState, topicQuizzes])
  const currentFlashcard = orderedFlashcards[activeStudyState.currentIndex] ?? null
  const currentQuestion = orderedQuizzes[activeStudyState.currentIndex] ?? null
  const currentFlashcardNumber = getOriginalItemNumber(activeItemIds, currentFlashcard?.id)
  const currentQuestionNumber = getOriginalItemNumber(activeItemIds, currentQuestion?.id)
  const selectedOptionId = currentQuestion
    ? activeStudyState.answers?.[currentQuestion.id] ?? activeStudyState.selectedOptionId ?? null
    : null
  const answered = currentQuestion ? !!activeStudyState.answers?.[currentQuestion.id] : false
  const questionResult = currentQuestion && answered
    ? isSingleChoiceCorrect(selectedOptionId ?? '', currentQuestion.correctOptionIds)
    : null
  const quizAnswers: QuizAnswerRecord[] = orderedQuizzes.flatMap((question) => {
    const selectedId = activeStudyState.answers?.[question.id]
    return selectedId
      ? [{ id: question.id, selectedOptionId: selectedId, correctOptionIds: question.correctOptionIds }]
      : []
  })
  const latestResult = activeStudyState.completed
    ? calculateQuizScore(quizAnswers, orderedQuizzes)
    : null
  const incorrectQuestions = latestResult
    ? orderedQuizzes.filter((question) => latestResult.incorrectQuestionIds.includes(question.id))
    : []
  const firstRelatedFlashcardId = incorrectQuestions.find((question) => question.relatedFlashcardIds?.length)?.relatedFlashcardIds?.[0]

  const storeStudyState = (state: StudyState) => {
    setStudyStates((previous) => {
      const next: StudyStateMap = { ...previous, [getStudyStateKey(contentMode, selectedTopicId)]: state }
      saveStudyStates(next)
      return next
    })
  }

  useEffect(() => {
    if (!contentLoaded || !selectedTopicId) return
    saveStudySelection({ topicId: selectedTopicId, feature: contentMode })

    const storedState = studyStates[activeStudyKey]
    if (JSON.stringify(storedState) !== JSON.stringify(activeStudyState)) {
      setStudyStates((previous) => {
        const next = { ...previous, [activeStudyKey]: activeStudyState }
        saveStudyStates(next)
        return next
      })
    }
  }, [contentLoaded, selectedTopicId, contentMode, studyStates, activeStudyKey, activeStudyState])

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

  const submitAnswer = () => {
    if (!currentQuestion || !selectedOptionId) return

    storeStudyState({
      ...activeStudyState,
      answers: { ...activeStudyState.answers, [currentQuestion.id]: selectedOptionId },
      selectedOptionId: undefined,
    })
  }

  const nextQuestion = () => {
    if (!answered || activeStudyState.currentIndex >= orderedQuizzes.length - 1) return
    storeStudyState({ ...activeStudyState, currentIndex: activeStudyState.currentIndex + 1, selectedOptionId: undefined })
  }

  const finishQuiz = () => {
    if (!currentQuestion || !answered || activeStudyState.completed) return

    const result = calculateQuizScore(quizAnswers, orderedQuizzes)
    storeStudyState({ ...activeStudyState, completed: true, selectedOptionId: undefined })
    saveQuizAttempt({
      attemptId: `attempt-${Date.now()}`,
      topicId: selectedTopicId,
      score: result.score,
      total: result.total,
      completedAt: new Date().toISOString(),
      incorrectQuestionIds: result.incorrectQuestionIds,
    })
  }

  const updateMode = (mode: StudyMode) => {
    if (mode === activeStudyState.mode) return
    storeStudyState(createStudyState(selectedTopicId, activeItemIds, mode))
    setCardFlipped(false)
  }

  const restartStudy = () => {
    storeStudyState(createStudyState(selectedTopicId, activeItemIds, activeStudyState.mode))
    setCardFlipped(false)
  }

  const previousItem = () => {
    if (activeStudyState.currentIndex <= 0) return
    storeStudyState({ ...activeStudyState, currentIndex: activeStudyState.currentIndex - 1, selectedOptionId: undefined })
    setCardFlipped(false)
  }

  const openRelatedFlashcard = (relatedFlashcardIds?: string[]) => {
    const targetId = relatedFlashcardIds?.[0]
    if (!targetId) return

    const index = orderedFlashcards.findIndex((card) => card.id === targetId)
    if (index < 0) return

    saveStudySelection({ topicId: selectedTopicId, feature: 'flashcards' })
    setContentMode('flashcards')
    const flashcardKey = getStudyStateKey('flashcards', selectedTopicId)
    setStudyStates((previous) => {
      const next = {
        ...previous,
        [flashcardKey]: { ...resolveStudyState(previous[flashcardKey], selectedTopicId, topicFlashcards.map((card) => card.id)), currentIndex: index },
      }
      saveStudyStates(next)
      return next
    })
    setCardFlipped(true)
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

                {topicFlashcards.length ? (
                  <div className="study-toolbar">
                    <div className="study-mode-control">
                      <span>Mode</span>
                      <div className="mode-switch" aria-label="Flashcard study mode">
                        <button type="button" className={activeStudyState.mode === 'one-pass' ? 'active' : ''} onClick={() => updateMode('one-pass')}>One Pass</button>
                        <button type="button" className={activeStudyState.mode === 'random' ? 'active' : ''} onClick={() => updateMode('random')}>Random</button>
                      </div>
                    </div>
                    <strong className="progress-counter">{currentFlashcardNumber} / {topicFlashcards.length}</strong>
                    <button type="button" onClick={restartStudy}>Restart</button>
                  </div>
                ) : null}

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
                        </div>
                        <div className="flashcard-face back">
                          <span className="pill alt">Back</span>
                          <h4>{currentFlashcard.meaningVi}</h4>
                          {currentFlashcard.definitionEn ? <p>{currentFlashcard.definitionEn}</p> : null}
                          <p>{currentFlashcard.explanationVi}</p>
                          {currentFlashcard.relatedTerms?.length ? (
                            <ul>
                              {currentFlashcard.relatedTerms.map((term) => <li key={term}>{term}</li>)}
                            </ul>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flashcard-actions">
                      <button type="button" onClick={previousItem} disabled={activeStudyState.currentIndex === 0}>
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={activeStudyState.currentIndex >= orderedFlashcards.length - 1}
                        onClick={() => {
                          storeStudyState({ ...activeStudyState, currentIndex: activeStudyState.currentIndex + 1 })
                          setCardFlipped(false)
                        }}
                      >
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

                {topicQuizzes.length ? (
                  <div className="study-toolbar">
                    <div className="study-mode-control">
                      <span>Mode</span>
                      <div className="mode-switch" aria-label="Quiz study mode">
                        <button type="button" className={activeStudyState.mode === 'one-pass' ? 'active' : ''} onClick={() => updateMode('one-pass')}>One Pass</button>
                        <button type="button" className={activeStudyState.mode === 'random' ? 'active' : ''} onClick={() => updateMode('random')}>Random</button>
                      </div>
                    </div>
                    <strong className="progress-counter">{currentQuestionNumber} / {topicQuizzes.length}</strong>
                    <button type="button" onClick={restartStudy}>Restart</button>
                  </div>
                ) : null}

                {!activeStudyState.completed && currentQuestion ? (
                  <div className="quiz-box">
                    <h4>{currentQuestion.questionEn}</h4>
                    {currentQuestion.questionVi ? <p className="question-vi">{currentQuestion.questionVi}</p> : null}

                    <div className="options-list">
                      {currentQuestion.options.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={`option-button ${selectedOptionId === option.id ? 'selected' : ''}`}
                          onClick={() => !answered && storeStudyState({ ...activeStudyState, selectedOptionId: option.id })}
                          disabled={answered}
                        >
                          <span>{option.id.toUpperCase()}</span>
                          {option.text}
                        </button>
                      ))}
                    </div>

                    {!answered ? (
                      <>
                        <button type="button" className="primary" onClick={submitAnswer} disabled={!selectedOptionId}>
                          Check answer
                        </button>
                        <div className="quiz-navigation">
                          <button type="button" onClick={previousItem} disabled={activeStudyState.currentIndex === 0}>Previous</button>
                          {activeStudyState.currentIndex < orderedQuizzes.length - 1 ? (
                            <button type="button" className="primary" onClick={nextQuestion} disabled>Next</button>
                          ) : (
                            <button type="button" className="primary" onClick={finishQuiz} disabled>View result</button>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`result-banner ${questionResult ? 'correct' : 'incorrect'}`}>
                          {questionResult ? 'Correct answer' : 'Incorrect answer'}
                        </div>

                        {questionResult ? (
                          <>
                            <p className="explanation">{currentQuestion.explanationVi}</p>

                          </>
                        ) : (
                          <>
                            <p className="correct-answer">
                              Correct answer: {currentQuestion.options
                                .filter((option) => currentQuestion.correctOptionIds.includes(option.id))
                                .map((option) => option.text)
                                .join(', ')}
                            </p>
                            <p className="explanation">{currentQuestion.explanationVi}</p>

                          </>
                        )}
                        <div className="quiz-navigation">
                          <button type="button" onClick={previousItem} disabled={activeStudyState.currentIndex === 0}>Previous</button>
                          {activeStudyState.currentIndex < orderedQuizzes.length - 1 ? (
                            <button type="button" className="primary" onClick={nextQuestion} disabled={!answered}>Next</button>
                          ) : (
                            <button type="button" className="primary" onClick={finishQuiz} disabled={!answered}>View result</button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : null}

                {activeStudyState.completed && latestResult ? (
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

                    <button type="button" className="primary" onClick={restartStudy}>
                      Retake quiz
                    </button>
                  </div>
                ) : null}

                {!topicQuizzes.length ? (
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

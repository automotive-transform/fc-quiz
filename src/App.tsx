import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { loadFlashcards, loadQuizzes, loadTopics, filterByTopic } from './services/contentService'
import { calculateQuizScore, isSingleChoiceCorrect } from './services/quizService'
import {
  getFlashcardProgress,
  getQuizQuestionProgress,
  getWrongQuestionIds,
  recordQuizQuestionResult,
  saveFlashcardProgress,
  saveQuizAttempt,
  type QuizQuestionProgressByTopic,
} from './utils/storage'
import {
  createStudyState,
  getStudySelection,
  getOriginalItemNumber,
  getStudyStateKey,
  getStudyStates,
  resolveQuestionOptionOrders,
  resolveStudyState,
  saveStudySelection,
  saveStudyStates,
  shuffleIds,
  type StudyMode,
  type StudyState,
  type StudyStateMap,
  type WrongOrderMode,
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
  const [selectedTopicId, setSelectedTopicId] = useState(savedSelection?.topicId ?? '')
  const [contentMode, setContentMode] = useState<ContentMode>(savedSelection?.feature ?? 'flashcards')
  const [progress, setProgress] = useState<Record<string, FlashcardProgress>>({})
  const [quizQuestionProgress, setQuizQuestionProgress] = useState<QuizQuestionProgressByTopic>(getQuizQuestionProgress)
  const [cardFlipped, setCardFlipped] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const flashcardRef = useRef<HTMLDivElement>(null)
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)
  const ignoreTapUntilRef = useRef(0)
  const checkedQuestionRef = useRef<string | null>(null)

  useEffect(() => {
    const flashcardElement = flashcardRef.current
    if (!flashcardElement) return

    const preventVerticalScrollForHorizontalSwipe = (event: TouchEvent) => {
      const start = swipeStartRef.current
      const touch = event.touches[0]
      if (!start || !touch) return

      const deltaX = touch.clientX - start.x
      const deltaY = touch.clientY - start.y
      const horizontalIntent = Math.abs(deltaX) > 3 && Math.abs(deltaX) > Math.abs(deltaY) * 0.65
      if (horizontalIntent) {
        event.preventDefault()
        return
      }

      if (Math.abs(deltaY) > 3) {
        const target = event.target instanceof Element ? event.target : null
        const face = target?.closest<HTMLElement>('.flashcard-face')
        if (!face) {
          event.preventDefault()
          return
        }

        const canScrollFace = deltaY < 0
          ? face.scrollTop + face.clientHeight < face.scrollHeight
          : face.scrollTop > 0
        if (!canScrollFace) event.preventDefault()
      }
    }

    flashcardElement.addEventListener('touchmove', preventVerticalScrollForHorizontalSwipe, { passive: false })
    return () => flashcardElement.removeEventListener('touchmove', preventVerticalScrollForHorizontalSwipe)
  }, [])

  useEffect(() => {
   Promise.all([loadTopics(), loadFlashcards(), loadQuizzes()])
      .then(([topicsData, flashcardsData, quizzesData]) => {
        setTopics(topicsData)
        setFlashcards(flashcardsData)
        setQuizzes(quizzesData)
        const questionProgress = getQuizQuestionProgress()
        setQuizQuestionProgress(questionProgress)
        setStudyStates((previous) => {
          const questionsByTopic = new Map<string, QuizQuestion[]>()
          for (const question of quizzesData) {
            const topicQuestions = questionsByTopic.get(question.topicId) ?? []
            topicQuestions.push(question)
            questionsByTopic.set(question.topicId, topicQuestions)
          }

          const next = { ...previous }
          for (const [topicId, questions] of questionsByTopic) {
            const key = getStudyStateKey('quizzes', topicId)
            const storedState = previous[key]
            const itemIds = storedState?.mode === 'wrong'
              ? questions
                .filter((question) => questionProgress[topicId]?.[question.id]?.lastResult === 'wrong')
                .map((question) => question.id)
              : questions.map((question) => question.id)
            const state = resolveStudyState(storedState, topicId, itemIds)
            next[key] = {
              ...state,
              optionOrders: resolveQuestionOptionOrders(
                state.optionOrders,
                questions.map((question) => ({
                  id: question.id,
                  optionIds: question.options.map((option) => option.id),
                })),
              ),
            }
          }

          saveStudyStates(next)
          return next
        })
        setSelectedTopicId((current) => {
          if (current && topicsData.some((topic) => topic.id === current)) {
            return current
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

  const activeStudyKey = getStudyStateKey(contentMode, selectedTopicId)
  const persistedQuizMode = studyStates[activeStudyKey]?.mode ?? 'one-pass'
  const wrongQuestions = useMemo(
    () => {
      const wrongIds = new Set(getWrongQuestionIds(
        selectedTopicId,
        topicQuizzes.map((question) => question.id),
        quizQuestionProgress,
      ))
      return topicQuizzes.filter((question) => wrongIds.has(question.id))
    },
    [topicQuizzes, quizQuestionProgress, selectedTopicId],
  )
  const activeItems = contentMode === 'flashcards'
    ? topicFlashcards
    : persistedQuizMode === 'wrong' ? wrongQuestions : topicQuizzes
  const activeItemIds = useMemo(() => activeItems.map((item) => item.id), [activeItems])
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
    if (contentMode !== 'quizzes') return topicQuizzes
    const availableQuestions = activeStudyState.mode === 'wrong' ? wrongQuestions : topicQuizzes
    const randomOrder = activeStudyState.mode === 'random'
      || (activeStudyState.mode === 'wrong' && activeStudyState.wrongOrderMode === 'random')
    if (!randomOrder) return availableQuestions
    const quizzesById = new Map(availableQuestions.map((question) => [question.id, question]))
    return (activeStudyState.order ?? []).flatMap((id) => {
      const question = quizzesById.get(id)
      return question ? [question] : []
    })
  }, [contentMode, activeStudyState, topicQuizzes, wrongQuestions])
  const currentFlashcard = orderedFlashcards[activeStudyState.currentIndex] ?? null
  const currentQuestion = orderedQuizzes[activeStudyState.currentIndex] ?? null
  const currentQuestionOptions = currentQuestion
    ? (() => {
        const optionsById = new Map(currentQuestion.options.map((option) => [option.id, option]))
        const orderedOptions = (activeStudyState.optionOrders?.[currentQuestion.id] ?? []).flatMap((id) => {
          const option = optionsById.get(id)
          return option ? [option] : []
        })
        return orderedOptions.length === currentQuestion.options.length ? orderedOptions : currentQuestion.options
      })()
    : []
  const currentFlashcardNumber = getOriginalItemNumber(activeItemIds, currentFlashcard?.id)
  const currentQuestionNumber = getOriginalItemNumber(topicQuizzes.map((question) => question.id), currentQuestion?.id)
  const selectedOptionId = currentQuestion
    ? activeStudyState.answers?.[currentQuestion.id] ?? activeStudyState.selectedOptionId ?? null
    : null
  const answered = currentQuestion ? !!activeStudyState.answers?.[currentQuestion.id] : false
  const questionResult = currentQuestion && answered
    ? isSingleChoiceCorrect(selectedOptionId ?? '', currentQuestion.correctOptionIds)
    : null
  const quizAnswers: QuizAnswerRecord[] = orderedQuizzes.flatMap((question) => {
    const selectedId = activeStudyState.answers?.[question.id]
    if (!selectedId && !activeStudyState.completed) return []
    return [{ id: question.id, selectedOptionId: selectedId ?? '', correctOptionIds: question.correctOptionIds }]
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
    if (!currentQuestion || !selectedOptionId || answered) return
    const checkKey = `${selectedTopicId}:${currentQuestion.id}`
    if (checkedQuestionRef.current === checkKey) return
    checkedQuestionRef.current = checkKey

    const result = isSingleChoiceCorrect(selectedOptionId, currentQuestion.correctOptionIds)
      ? 'correct'
      : 'wrong'
    setQuizQuestionProgress(recordQuizQuestionResult(selectedTopicId, currentQuestion.id, result))

    storeStudyState({
      ...activeStudyState,
      answers: { ...activeStudyState.answers, [currentQuestion.id]: selectedOptionId },
      selectedOptionId: undefined,
    })
  }

  const nextQuestion = () => {
    if (!currentQuestion) return
    if (activeStudyState.currentIndex >= orderedQuizzes.length - 1) return
    storeStudyState({ ...activeStudyState, currentIndex: activeStudyState.currentIndex + 1, selectedOptionId: undefined })
  }

  const finishQuiz = () => {
    if (!currentQuestion || activeStudyState.completed) return

    const finalAnswers = orderedQuizzes.map((question) => ({
      id: question.id,
      selectedOptionId: activeStudyState.answers?.[question.id] ?? '',
      correctOptionIds: question.correctOptionIds,
    }))
    const result = calculateQuizScore(finalAnswers, orderedQuizzes)
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
    const itemIds = mode === 'wrong'
      ? wrongQuestions.map((question) => question.id)
      : contentMode === 'quizzes' ? topicQuizzes.map((question) => question.id) : activeItemIds
    const nextState = createStudyState(selectedTopicId, itemIds, mode)
    if (contentMode === 'quizzes') {
      nextState.optionOrders = resolveQuestionOptionOrders(
        activeStudyState.optionOrders,
        topicQuizzes.map((question) => ({ id: question.id, optionIds: question.options.map((option) => option.id) })),
      )
      if (mode === 'wrong') nextState.wrongOrderMode = 'one-pass'
    }
    checkedQuestionRef.current = null
    storeStudyState(nextState)
    setCardFlipped(false)
  }

  const updateWrongOrderMode = (mode: WrongOrderMode) => {
    if (activeStudyState.mode !== 'wrong' || activeStudyState.wrongOrderMode === mode) return
    const wrongIds = wrongQuestions.map((question) => question.id)
    storeStudyState({
      ...createStudyState(selectedTopicId, wrongIds, 'wrong'),
      wrongOrderMode: mode,
      ...(mode === 'random' ? { order: shuffleIds(wrongIds) } : {}),
      optionOrders: activeStudyState.optionOrders,
    })
    checkedQuestionRef.current = null
  }

  const restartStudy = () => {
    const nextState = createStudyState(selectedTopicId, activeItemIds, activeStudyState.mode)
    if (contentMode === 'quizzes') {
      const questionsForOptions = activeStudyState.mode === 'wrong' ? wrongQuestions : topicQuizzes
      nextState.optionOrders = resolveQuestionOptionOrders(
        undefined,
        questionsForOptions.map((question) => ({ id: question.id, optionIds: question.options.map((option) => option.id) })),
      )
      if (activeStudyState.mode === 'wrong') {
        nextState.wrongOrderMode = activeStudyState.wrongOrderMode ?? 'one-pass'
        if (nextState.wrongOrderMode === 'random') nextState.order = shuffleIds(activeItemIds)
      }
    }
    checkedQuestionRef.current = null
    storeStudyState(nextState)
    setCardFlipped(false)
  }

  const previousItem = () => {
    if (activeStudyState.currentIndex <= 0) return
    storeStudyState({ ...activeStudyState, currentIndex: activeStudyState.currentIndex - 1, selectedOptionId: undefined })
    setCardFlipped(false)
  }

  const moveFlashcard = (offset: -1 | 1) => {
    const nextIndex = activeStudyState.currentIndex + offset
    if (nextIndex < 0 || nextIndex >= orderedFlashcards.length) return
    storeStudyState({ ...activeStudyState, currentIndex: nextIndex })
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
                      {currentQuestion ? `${currentQuestionNumber} / ${topicQuizzes.length}` : `0 / ${topicQuizzes.length}`}
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
                    <button type="button" className="icon-button" onClick={restartStudy} aria-label="Restart flashcards" title="Restart">
                      &#x21bb;
                    </button>
                  </div>
                ) : null}

                {currentFlashcard ? (
                  <>
                    <div
                      ref={flashcardRef}
                      className={`flashcard ${cardFlipped ? 'flipped' : ''}`}
                      onTouchStart={(event) => {
                        const touch = event.touches[0]
                        if (touch) swipeStartRef.current = { x: touch.clientX, y: touch.clientY }
                      }}
                      onTouchEnd={(event) => {
                        const start = swipeStartRef.current
                        const touch = event.changedTouches[0]
                        swipeStartRef.current = null
                        if (!start || !touch) return

                        const deltaX = touch.clientX - start.x
                        const deltaY = touch.clientY - start.y
                        if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return

                        ignoreTapUntilRef.current = Date.now() + 500
                        if (deltaX > 0) moveFlashcard(1)
                        else previousItem()
                      }}
                      onTouchCancel={() => { swipeStartRef.current = null }}
                      onClick={() => {
                        if (Date.now() < ignoreTapUntilRef.current) return
                        setCardFlipped((value) => !value)
                      }}
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
                      <button type="button" onClick={() => moveFlashcard(-1)} disabled={activeStudyState.currentIndex === 0}>
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={activeStudyState.currentIndex >= orderedFlashcards.length - 1}
                        onClick={() => moveFlashcard(1)}
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
                        <button type="button" className={activeStudyState.mode === 'wrong' ? 'active' : ''} onClick={() => updateMode('wrong')}>Wrong</button>
                      </div>
                    </div>
                    {activeStudyState.mode === 'wrong' ? (
                      <div className="study-mode-control">
                        <span>Wrong order</span>
                        <div className="mode-switch" aria-label="Wrong question order">
                          <button type="button" className={activeStudyState.wrongOrderMode !== 'random' ? 'active' : ''} onClick={() => updateWrongOrderMode('one-pass')}>One Pass</button>
                          <button type="button" className={activeStudyState.wrongOrderMode === 'random' ? 'active' : ''} onClick={() => updateWrongOrderMode('random')}>Random</button>
                        </div>
                      </div>
                    ) : null}
                    <strong className="progress-counter">
                      {currentQuestion ? `${currentQuestionNumber} / ${orderedQuizzes.length}` : `0 / ${orderedQuizzes.length}`}
                    </strong>
                    <button type="button" className="icon-button" onClick={restartStudy} aria-label="Restart quiz" title="Restart">
                      &#x21bb;
                    </button>
                  </div>
                ) : null}

                {!activeStudyState.completed && currentQuestion ? (
                  <div className="quiz-box">
                    <h4>{currentQuestion.questionEn}</h4>
                    {currentQuestion.questionVi ? <p className="question-vi">{currentQuestion.questionVi}</p> : null}

                    <div className="options-list">
                      {currentQuestionOptions.map((option, optionIndex) => (
                        <button
                          key={option.id}
                          type="button"
                          className={`option-button ${selectedOptionId === option.id ? 'selected' : ''}`}
                          onClick={() => !answered && storeStudyState({ ...activeStudyState, selectedOptionId: option.id })}
                          disabled={answered}
                        >
                          <span>{String.fromCharCode(65 + optionIndex)}</span>
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
                            <button type="button" className="primary" onClick={nextQuestion}>Next</button>
                          ) : (
                            <button type="button" className="primary" onClick={finishQuiz}>View result</button>
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
                                .map((option) => ({ option, position: currentQuestionOptions.findIndex((orderedOption) => orderedOption.id === option.id) }))
                                .filter(({ option }) => currentQuestion.correctOptionIds.includes(option.id))
                                .map(({ option, position }) => `${String.fromCharCode(65 + position)}. ${option.text}`)
                                .join(', ')}
                            </p>
                            <p className="explanation">{currentQuestion.explanationVi}</p>

                          </>
                        )}
                        <div className="quiz-navigation">
                          <button type="button" onClick={previousItem} disabled={activeStudyState.currentIndex === 0}>Previous</button>
                          {activeStudyState.currentIndex < orderedQuizzes.length - 1 ? (
                            <button type="button" className="primary" onClick={nextQuestion}>Next</button>
                          ) : (
                            <button type="button" className="primary" onClick={finishQuiz}>View result</button>
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
                ) : activeStudyState.mode === 'wrong' && !orderedQuizzes.length ? (
                  <div className="notice">No wrong questions to review.</div>
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

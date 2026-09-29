import type { FlashcardProgress, QuizAttempt } from '../types'

const FLASHCARD_STORAGE_KEY = 'atf.flashcardProgress.v1'
const QUIZ_STORAGE_KEY = 'atf.quizAttempts.v1'
const QUIZ_QUESTION_PROGRESS_KEY = 'fcquiz.quizQuestionProgress.v1'

export type QuizAnswerResult = 'correct' | 'wrong'

export interface QuizQuestionProgress {
  correctCount: number
  wrongCount: number
  lastResult: QuizAnswerResult
  lastAnsweredAt: string
}

export type QuizQuestionProgressByTopic = Record<string, Record<string, QuizQuestionProgress>>

interface StoredQuizQuestionProgress {
  version: 1
  topics: QuizQuestionProgressByTopic
}

export function getQuizQuestionProgress(): QuizQuestionProgressByTopic {
  try {
    if (typeof localStorage === 'undefined') return {}
    const raw = localStorage.getItem(QUIZ_QUESTION_PROGRESS_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as Partial<StoredQuizQuestionProgress>
    if (parsed.version !== 1 || !parsed.topics || typeof parsed.topics !== 'object') return {}
    return Object.fromEntries(Object.entries(parsed.topics).flatMap(([topicId, rawTopic]) => {
      if (!rawTopic || typeof rawTopic !== 'object' || Array.isArray(rawTopic)) return []

      const questions = Object.fromEntries(Object.entries(rawTopic).flatMap(([questionId, rawProgress]) => {
        if (!rawProgress || typeof rawProgress !== 'object' || Array.isArray(rawProgress)) return []
        const value = rawProgress as Partial<QuizQuestionProgress>
        const valid = Number.isInteger(value.correctCount)
          && Number.isInteger(value.wrongCount)
          && (value.lastResult === 'correct' || value.lastResult === 'wrong')
          && typeof value.lastAnsweredAt === 'string'
        return valid ? [[questionId, value as QuizQuestionProgress]] : []
      }))

      return [[topicId, questions]]
    }))
  } catch {
    return {}
  }
}

export function getWrongQuestionIds(
  topicId: string,
  questionIds: string[],
  progress = getQuizQuestionProgress(),
): string[] {
  const topicProgress = progress[topicId] ?? {}
  return questionIds.filter((questionId) => topicProgress[questionId]?.lastResult === 'wrong')
}

export function recordQuizQuestionResult(
  topicId: string,
  questionId: string,
  result: QuizAnswerResult,
  answeredAt = new Date().toISOString(),
): QuizQuestionProgressByTopic {
  const topics = getQuizQuestionProgress()
  const topicProgress = topics[topicId] ?? {}
  const previous = topicProgress[questionId]
  const next: QuizQuestionProgress = {
    correctCount: (previous?.correctCount ?? 0) + (result === 'correct' ? 1 : 0),
    wrongCount: (previous?.wrongCount ?? 0) + (result === 'wrong' ? 1 : 0),
    lastResult: result,
    lastAnsweredAt: answeredAt,
  }
  const updated = { ...topics, [topicId]: { ...topicProgress, [questionId]: next } }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(QUIZ_QUESTION_PROGRESS_KEY, JSON.stringify({ version: 1, topics: updated } satisfies StoredQuizQuestionProgress))
    }
  } catch {
    // Keep quiz interaction available when storage is restricted.
  }

  return updated
}

export function getFlashcardProgress(): Record<string, FlashcardProgress> {
  try {
    const raw = localStorage.getItem(FLASHCARD_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, FlashcardProgress>) : {}
  } catch {
    return {}
  }
}

export function saveFlashcardProgress(progress: Record<string, FlashcardProgress>) {
  try {
    localStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Ignore write failures in restricted browsers.
  }
}

export function getQuizAttempts(): QuizAttempt[] {
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as QuizAttempt[]) : []
  } catch {
    return []
  }
}

export function saveQuizAttempt(attempt: QuizAttempt) {
  try {
    const attempts = getQuizAttempts()
    localStorage.setItem(
      QUIZ_STORAGE_KEY,
      JSON.stringify([...attempts, attempt]),
    )
  } catch {
    // Ignore write failures in restricted browsers.
  }
}

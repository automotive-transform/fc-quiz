import type { FlashcardProgress, QuizAttempt } from '../types'

const FLASHCARD_STORAGE_KEY = 'atf.flashcardProgress.v1'
const QUIZ_STORAGE_KEY = 'atf.quizAttempts.v1'

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

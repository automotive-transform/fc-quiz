import type { QuizAnswerRecord, QuizQuestion } from '../types'

export function isSingleChoiceCorrect(
  selectedOptionId: string,
  correctOptionIds: string[] = [],
): boolean {
  return Array.isArray(correctOptionIds)
    && correctOptionIds.length === 1
    && selectedOptionId === correctOptionIds[0]
}

export function calculateQuizScore(
  answers: QuizAnswerRecord[],
  questions: Pick<QuizQuestion, 'id' | 'questionEn' | 'options' | 'explanationVi'>[],
) {
  let score = 0
  const incorrectQuestionIds: string[] = []

  for (const answer of answers) {
    const question = questions.find((item) => item.id === answer.id)
    if (!question) continue

    const isCorrect = isSingleChoiceCorrect(
      answer.selectedOptionId,
      answer.correctOptionIds,
    )

    if (isCorrect) {
      score += 1
    } else {
      incorrectQuestionIds.push(answer.id)
    }
  }

  return {
    score,
    total: answers.length,
    incorrectQuestionIds,
  }
}

export function shuffle<T>(items: T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

import { describe, expect, it } from 'vitest'
import { isSingleChoiceCorrect, calculateQuizScore } from './quizService'

describe('quizService', () => {
  it('accepts a correct single-choice answer', () => {
    expect(isSingleChoiceCorrect('b', ['b'])).toBe(true)
  })

  it('rejects an incorrect single-choice answer', () => {
    expect(isSingleChoiceCorrect('a', ['b'])).toBe(false)
  })

  it('calculates score and incorrectIds', () => {
    const result = calculateQuizScore(
      [
        { id: 'q1', selectedOptionId: 'a', correctOptionIds: ['a'] },
        { id: 'q2', selectedOptionId: 'b', correctOptionIds: ['c'] },
      ],
      [
        { id: 'q1', questionEn: 'Q1', options: [], explanationVi: 'test' },
        { id: 'q2', questionEn: 'Q2', options: [], explanationVi: 'test' },
      ],
    )

    expect(result.score).toBe(1)
    expect(result.total).toBe(2)
    expect(result.incorrectQuestionIds).toEqual(['q2'])
  })
})

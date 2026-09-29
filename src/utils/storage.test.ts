import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getQuizQuestionProgress, getWrongQuestionIds, recordQuizQuestionResult } from './storage'

describe('quiz question progress storage', () => {
  beforeEach(() => {
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('counts each correct or wrong result per topic and question', () => {
    recordQuizQuestionResult('aspice', 'q418', 'wrong', '2026-09-29T09:00:00.000Z')
    recordQuizQuestionResult('aspice', 'q418', 'correct', '2026-09-29T09:01:00.000Z')
    recordQuizQuestionResult('misra-c', 'q418', 'wrong', '2026-09-29T09:02:00.000Z')

    expect(getQuizQuestionProgress()).toEqual({
      aspice: {
        q418: {
          correctCount: 1,
          wrongCount: 1,
          lastResult: 'correct',
          lastAnsweredAt: '2026-09-29T09:01:00.000Z',
        },
      },
      'misra-c': {
        q418: {
          correctCount: 0,
          wrongCount: 1,
          lastResult: 'wrong',
          lastAnsweredAt: '2026-09-29T09:02:00.000Z',
        },
      },
    })
  })

  it('ignores corrupt and unsupported stored state', () => {
    localStorage.setItem('fcquiz.quizQuestionProgress.v1', '{broken')
    expect(getQuizQuestionProgress()).toEqual({})

    localStorage.setItem('fcquiz.quizQuestionProgress.v1', JSON.stringify({ version: 2, topics: {} }))
    expect(getQuizQuestionProgress()).toEqual({})

    localStorage.setItem('fcquiz.quizQuestionProgress.v1', JSON.stringify({
      version: 1,
      topics: { aspice: null, safety: { q1: null } },
    }))
    expect(getWrongQuestionIds('aspice', ['q1'])).toEqual([])
  })

  it('selects only questions whose latest result is wrong in source order', () => {
    recordQuizQuestionResult('aspice', 'q2', 'wrong')
    recordQuizQuestionResult('aspice', 'q3', 'wrong')
    recordQuizQuestionResult('aspice', 'q3', 'correct')

    expect(getWrongQuestionIds('aspice', ['q1', 'q2', 'q3'])).toEqual(['q2'])
  })
})
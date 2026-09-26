import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createStudyState,
  getOriginalItemNumber,
  getStudyStateKey,
  getStudyStates,
  resolveStudyState,
  saveStudyStates,
} from './studyState'

describe('studyState', () => {
  beforeEach(() => {
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      clear: () => values.clear(),
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('isolates state by feature and topic and persists a versioned store', () => {
    const flashcardKey = getStudyStateKey('flashcards', 'aspice')
    const quizKey = getStudyStateKey('quizzes', 'aspice')
    const states = {
      [flashcardKey]: { topicId: 'aspice', mode: 'one-pass' as const, currentIndex: 4 },
      [quizKey]: { topicId: 'aspice', mode: 'random' as const, currentIndex: 2, order: ['q2', 'q1'] },
    }

    saveStudyStates(states)

    expect(getStudyStates()).toEqual(states)
    expect(flashcardKey).not.toBe(quizKey)
  })

  it('keeps a valid random order and clamps an out-of-range index', () => {
    const resolved = resolveStudyState(
      { topicId: 'aspice', mode: 'random', currentIndex: 99, order: ['b', 'a'] },
      'aspice',
      ['a', 'b'],
    )

    expect(resolved.currentIndex).toBe(1)
    expect(resolved.order).toEqual(['b', 'a'])
  })

  it('rebuilds invalid random order after content changes', () => {
    const resolved = resolveStudyState(
      { topicId: 'aspice', mode: 'random', currentIndex: 5, order: ['a', 'b'] },
      'aspice',
      ['a', 'b', 'c'],
    )

    expect(resolved.currentIndex).toBe(2)
    expect(resolved.order).toHaveLength(3)
    expect(new Set(resolved.order).size).toBe(3)
    expect(resolved.order).toEqual(expect.arrayContaining(['a', 'b', 'c']))
  })

  it('starts One Pass without a stored random order', () => {
    expect(createStudyState('aspice', ['a', 'b'])).toEqual({
      topicId: 'aspice',
      mode: 'one-pass',
      currentIndex: 0,
      itemIds: ['a', 'b'],
      answers: {},
    })
  })

  it('falls back to defaults for corrupt or old-schema storage', () => {
    localStorage.setItem('fcquiz.studyState.v1', '{broken')
    expect(getStudyStates()).toEqual({})

    localStorage.setItem('fcquiz.studyState.v1', JSON.stringify({ version: 0, states: { old: {} } }))
    expect(getStudyStates()).toEqual({})
  })

  it('tolerates unavailable localStorage', () => {
    vi.stubGlobal('localStorage', undefined)

    expect(getStudyStates()).toEqual({})
    expect(() => saveStudyStates({})).not.toThrow()
  })

  it('retains only answers for items that still exist', () => {
    const resolved = resolveStudyState(
      {
        topicId: 'aspice',
        mode: 'one-pass',
        currentIndex: 0,
        answers: { a: 'A', removed: 'B' },
        selectedOptionId: 'C',
      },
      'aspice',
      ['a'],
    )

    expect(resolved.answers).toEqual({ a: 'A' })
    expect(resolved.selectedOptionId).toBe('C')
  })

  it('clears completion when the content list changes', () => {
    const resolved = resolveStudyState(
      { topicId: 'aspice', mode: 'one-pass', currentIndex: 0, itemIds: ['a'], completed: true },
      'aspice',
      ['a', 'b'],
    )

    expect(resolved.completed).toBe(false)
    expect(resolved.itemIds).toEqual(['a', 'b'])
  })

  it('calculates the displayed number from the original topic order', () => {
    const originalIds = Array.from({ length: 500 }, (_, index) => `card-${index + 1}`)

    expect(getOriginalItemNumber(originalIds, 'card-418')).toBe(418)
    expect(getOriginalItemNumber(originalIds, 'card-1')).toBe(1)
    expect(getOriginalItemNumber(originalIds, 'missing')).toBe(0)
  })
})
import { describe, expect, it } from 'vitest'
import { normalizeTopicId, normalizeTopicDisplayName, normalizeCollection } from './contentSchema'

describe('content schema normalization', () => {
  it('normalizes mixed-case topic IDs to a canonical lowercase value', () => {
    expect(normalizeTopicId(' CAN ')).toBe('can')
    expect(normalizeTopicId('cAn')).toBe('can')
    expect(normalizeTopicId('misra-c')).toBe('misra-c')
  })

  it('builds display names in uppercase for UI', () => {
    expect(normalizeTopicDisplayName('can')).toBe('CAN')
    expect(normalizeTopicDisplayName('autosar-classic')).toBe('AUTOSAR-CLASSIC')
  })

  it('normalizes items within a collection while preserving content text', () => {
    const items = [
      { id: 'q1', topicId: ' CAN ', questionType: 'single-choice', questionEn: 'What?', options: [], explanationVi: 'A' },
      { id: 'q2', topicId: 'Autosar', questionType: 'single_choice', questionEn: 'Why?', options: [], explanationVi: 'B' },
    ]

    const normalized = normalizeCollection(items)

    expect(normalized[0].topicId).toBe('can')
    expect(normalized[1].topicId).toBe('autosar')
    expect(normalized[0].questionEn).toBe('What?')
  })
})

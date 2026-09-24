export type NormalizedTopicId = string

export function normalizeTopicId(topicId: string): string {
  return String(topicId ?? '').trim().toLowerCase()
}

export function normalizeTopicDisplayName(topicId: string): string {
  const normalized = normalizeTopicId(topicId)
  return normalized.replace(/[_\s]+/g, '-').toUpperCase()
}

type NormalizableItem = Record<string, any> & {
  topicId?: string
  sectionId?: string
}

export function normalizeCollection<T extends NormalizableItem>(items: T[]): T[] {
  return items.map((item) => {
    if (!item || typeof item !== 'object') {
      return item
    }

    const nextItem: T = { ...item }

    if (typeof nextItem.topicId === 'string') {
      nextItem.topicId = normalizeTopicId(nextItem.topicId) as T['topicId']
    }

    if (typeof nextItem.sectionId === 'string') {
      nextItem.sectionId = nextItem.sectionId.trim() as T['sectionId']
    }

    return nextItem
  })
}

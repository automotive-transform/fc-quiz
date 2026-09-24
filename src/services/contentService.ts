import type { Flashcard, QuizQuestion, Topic } from '../types'
import { normalizeCollection, normalizeTopicDisplayName, normalizeTopicId } from '../utils/contentSchema'

function loadDiscoveredJson<T>(folderName: 'all' | 'flashcards' | 'quizzes'): T[] {
  const modules = import.meta.glob('../../content/**/*.json', { eager: true }) as Record<string, { default?: unknown }>

  return Object.entries(modules)
    .filter(([filePath]) => {
      const normalizedPath = filePath.replace(/\\/g, '/')

      if (folderName === 'all') {
        return normalizedPath.includes('/content/')
      }

      return normalizedPath.includes(`/content/${folderName}/`)
    })
    .flatMap(([, moduleValue]) => {
      const value = moduleValue?.default ?? moduleValue
      if (Array.isArray(value)) {
        return value as T[]
      }

      if (value && typeof value === 'object' && Array.isArray((value as { items?: T[] }).items)) {
        return (value as { items: T[] }).items
      }

      return []
    })
}

function loadTopicMetadata(): Record<string, Partial<Topic>> {
  const modules = import.meta.glob('../../content/*.json', { eager: true }) as Record<string, { default?: unknown }>

  const metadataFile = Object.entries(modules).find(([filePath]) => filePath.endsWith('topic-metadata.json'))
  if (!metadataFile) {
    return {}
  }

  const value = metadataFile[1]?.default ?? metadataFile[1]
  const topics = value && typeof value === 'object' && Array.isArray((value as { topics?: unknown[] }).topics)
    ? (value as { topics: Array<{ topicId?: string; nameEn?: string; nameVi?: string; description?: string; order?: number }> }).topics
    : []

  return Object.fromEntries(
    topics.map((topic) => {
      const normalizedId = normalizeTopicId(topic.topicId ?? '')
      return [normalizedId, {
        id: normalizedId,
        title: topic.nameEn ?? normalizeTopicDisplayName(normalizedId),
        description: topic.description,
        order: topic.order,
      }]
    }),
  )
}

export async function loadTopics(): Promise<Topic[]> {
  const topicMap = loadTopicMetadata()
  const discoveredTopics = loadDiscoveredJson<{ topicId?: string }>('all')
    .map((entry) => entry.topicId)
    .filter((topicId): topicId is string => typeof topicId === 'string' && !!topicId)
    .map((topicId) => normalizeTopicId(topicId))
    .filter((topicId, index, list) => list.indexOf(topicId) === index)

  return discoveredTopics.map((topicId, index) => ({
    id: topicId,
    title: topicMap[topicId]?.title ?? normalizeTopicDisplayName(topicId),
    description: topicMap[topicId]?.description ?? '',
    order: topicMap[topicId]?.order ?? index + 1,
  }))
}

export async function loadFlashcards(): Promise<Flashcard[]> {
  const cards = loadDiscoveredJson<Flashcard>('flashcards')
  return normalizeCollection(cards)
}

export async function loadQuizzes(): Promise<QuizQuestion[]> {
  const quizzes = loadDiscoveredJson<QuizQuestion>('quizzes')

  return normalizeCollection(quizzes).map((quiz) => {
    const normalizedCorrectOptionIds = Array.isArray((quiz as QuizQuestion & { correctOptionId?: string }).correctOptionIds)
      ? (quiz as QuizQuestion & { correctOptionIds: string[] }).correctOptionIds
      : typeof (quiz as QuizQuestion & { correctOptionId?: string }).correctOptionId === 'string'
        ? [(quiz as QuizQuestion & { correctOptionId?: string }).correctOptionId as string]
        : []

    return {
      ...quiz,
      correctOptionIds: normalizedCorrectOptionIds,
      correctOptionId: normalizedCorrectOptionIds[0],
      questionType: quiz.questionType === 'single_choice' ? 'single_choice' : 'single-choice',
    }
  })
}

export function filterByTopic<T extends { topicId: string }>(items: T[], topicId: string) {
  return items.filter((item) => normalizeTopicId(item.topicId) === normalizeTopicId(topicId))
}

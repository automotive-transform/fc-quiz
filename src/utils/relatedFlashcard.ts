export function resolveRelatedFlashcardIndex<T extends { id: string }>(
  topicFlashcards: T[],
  relatedFlashcardIds?: string[],
) {
  const targetId = relatedFlashcardIds?.[0]

  if (!targetId) {
    return -1
  }

  return topicFlashcards.findIndex((card) => card.id === targetId)
}

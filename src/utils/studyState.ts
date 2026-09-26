export type StudyFeature = 'flashcards' | 'quizzes'
export type StudyMode = 'one-pass' | 'random'

export interface StudyState {
  topicId: string
  mode: StudyMode
  currentIndex: number
  itemIds?: string[]
  order?: string[]
  answers?: Record<string, string>
  selectedOptionId?: string
  completed?: boolean
}

export type StudyStateMap = Record<string, StudyState>

interface StoredStudyStates {
  version: 1
  states: StudyStateMap
}

interface StudySelection {
  topicId: string
  feature: StudyFeature
}

const STUDY_STATE_KEY = 'fcquiz.studyState.v1'
const STUDY_SELECTION_KEY = 'fcquiz.studySelection.v1'

export function getStudyStateKey(feature: StudyFeature, topicId: string) {
  return `${feature}:${topicId}`
}

export function getOriginalItemNumber(itemIds: string[], currentItemId?: string): number {
  if (!currentItemId) return 0
  const originalIndex = itemIds.indexOf(currentItemId)
  return originalIndex < 0 ? 0 : originalIndex + 1
}

export function getStudyStates(): StudyStateMap {
  try {
    if (typeof localStorage === 'undefined') return {}

    const raw = localStorage.getItem(STUDY_STATE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as Partial<StoredStudyStates>
    if (parsed.version !== 1 || !parsed.states || typeof parsed.states !== 'object') return {}
    return parsed.states
  } catch {
    return {}
  }
}

export function saveStudyStates(states: StudyStateMap) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STUDY_STATE_KEY, JSON.stringify({ version: 1, states } satisfies StoredStudyStates))
  } catch {
    // Keep study usable when storage is unavailable or full.
  }
}

export function getStudySelection(): StudySelection | null {
  try {
    if (typeof localStorage === 'undefined') return null

    const raw = localStorage.getItem(STUDY_SELECTION_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<StudySelection>
    if (typeof parsed.topicId !== 'string' || (parsed.feature !== 'flashcards' && parsed.feature !== 'quizzes')) return null
    return { topicId: parsed.topicId, feature: parsed.feature }
  } catch {
    return null
  }
}

export function saveStudySelection(selection: StudySelection) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STUDY_SELECTION_KEY, JSON.stringify(selection))
  } catch {
    // Selection persistence is best-effort.
  }
}

export function shuffleIds(ids: string[]): string[] {
  const shuffled = [...ids]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

export function createStudyState(
  topicId: string,
  itemIds: string[],
  mode: StudyMode = 'one-pass',
): StudyState {
  return {
    topicId,
    mode,
    currentIndex: 0,
    itemIds: [...itemIds],
    ...(mode === 'random' ? { order: shuffleIds(itemIds) } : {}),
    answers: {},
  }
}

export function resolveStudyState(
  storedState: StudyState | undefined,
  topicId: string,
  itemIds: string[],
): StudyState {
  const validMode: StudyMode = storedState?.mode === 'random' ? 'random' : 'one-pass'
  const maxIndex = Math.max(itemIds.length - 1, 0)
  const currentIndex = typeof storedState?.currentIndex === 'number' && Number.isInteger(storedState.currentIndex)
    ? Math.min(Math.max(storedState.currentIndex, 0), maxIndex)
    : 0
  const validItemIds = new Set(itemIds)
  const sameContent = Array.isArray(storedState?.itemIds)
    && storedState.itemIds.length === itemIds.length
    && storedState.itemIds.every((itemId, index) => itemId === itemIds[index])
  const answers = Object.fromEntries(
    Object.entries(storedState?.answers ?? {}).filter(([itemId, answer]) =>
      validItemIds.has(itemId) && typeof answer === 'string',
    ),
  )

  if (validMode === 'one-pass') {
    return {
      topicId,
      mode: validMode,
      currentIndex,
      itemIds: [...itemIds],
      answers,
      selectedOptionId: typeof storedState?.selectedOptionId === 'string' ? storedState.selectedOptionId : undefined,
      completed: sameContent && storedState?.completed === true,
    }
  }

  const order = storedState?.order
  const validOrder = Array.isArray(order)
    && order.length === itemIds.length
    && new Set(order).size === itemIds.length
    && order.every((itemId) => validItemIds.has(itemId))

  return {
    topicId,
    mode: validMode,
    currentIndex,
    itemIds: [...itemIds],
    order: validOrder ? [...order] : shuffleIds(itemIds),
    answers,
    selectedOptionId: typeof storedState?.selectedOptionId === 'string' ? storedState.selectedOptionId : undefined,
    completed: sameContent && storedState?.completed === true,
  }
}
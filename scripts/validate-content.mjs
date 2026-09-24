import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const contentRoot = path.join(projectRoot, 'content')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function listJsonFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return []
  }

  return fs.readdirSync(dirPath)
    .filter((entry) => entry.endsWith('.json'))
    .sort()
    .map((entry) => path.join(dirPath, entry))
}

function normalizeTopicId(topicId) {
  return String(topicId ?? '').trim().toLowerCase()
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const metadataPath = path.join(contentRoot, 'topic-metadata.json')
const flashcardFiles = listJsonFiles(path.join(contentRoot, 'flashcards'))
const quizFiles = listJsonFiles(path.join(contentRoot, 'quizzes'))

const topicMetadata = fs.existsSync(metadataPath) ? readJson(metadataPath) : { topics: [] }
const metadataTopics = Array.isArray(topicMetadata.topics) ? topicMetadata.topics : []

const flashcards = flashcardFiles.flatMap((filePath) => {
  const parsed = readJson(filePath)
  return Array.isArray(parsed) ? parsed : parsed.items ?? []
})

const quizzes = quizFiles.flatMap((filePath) => {
  const parsed = readJson(filePath)
  return Array.isArray(parsed) ? parsed : parsed.items ?? []
})

const metadataNormalizedTopics = metadataTopics.map((topic) => ({
  ...topic,
  id: normalizeTopicId(topic.topicId ?? topic.id ?? ''),
  title: topic.nameEn ?? topic.title ?? 'TOPIC',
}))

const discoveredTopicIds = [...new Set([
  ...flashcards.map((card) => normalizeTopicId(card.topicId)),
  ...quizzes.map((quiz) => normalizeTopicId(quiz.topicId)),
])]

const topics = metadataNormalizedTopics.concat(
  discoveredTopicIds
    .filter((topicId) => !metadataNormalizedTopics.some((topic) => topic.id === topicId))
    .map((topicId) => ({ id: topicId, title: topicId.toUpperCase() })),
)

const topicIds = new Set(topics.map((topic) => normalizeTopicId(topic.id)))
const flashcardIds = new Set(flashcards.map((card) => card.id))
const quizIds = new Set(quizzes.map((quiz) => quiz.id))

for (const topic of topics) {
  assert(topic.id, `Missing required field: topic.id`)
  assert(topic.title, `Missing required field: topic.title`)
}

for (const card of flashcards) {
  assert(card.id, `Missing required field: flashcard.id`)
  assert(card.topicId, `Missing required field: flashcard.topicId`)
  assert(topicIds.has(normalizeTopicId(card.topicId)), `Invalid topicId in flashcard: ${card.id}`)
  assert(card.cardType, `Missing required field: flashcard.cardType`)
  assert(
    ['single_word', 'technical_term', 'phrase', 'abbreviation', 'concept', 'comparison', 'single-word', 'technical-term'].includes(card.cardType),
    `Unsupported cardType: ${card.cardType}`,
  )
  assert(card.term, `Missing required field: flashcard.term`)
  assert(card.explanationVi, `Missing required field: flashcard.explanationVi`)
  if (flashcardIds.size !== flashcards.length) {
    throw new Error('Duplicate flashcard ID detected.')
  }
}

for (const quiz of quizzes) {
  assert(quiz.id, `Missing required field: quiz.id`)
  assert(quiz.topicId, `Missing required field: quiz.topicId`)
  assert(topicIds.has(normalizeTopicId(quiz.topicId)), `Invalid topicId in quiz: ${quiz.id}`)
  assert(['single-choice', 'single_choice'].includes(quiz.questionType), `Unsupported questionType: ${quiz.questionType}`)
  assert(quiz.questionEn, `Missing required field: quiz.questionEn`)
  assert(Array.isArray(quiz.options) && quiz.options.length >= 2, `Quiz must have at least two options: ${quiz.id}`)
  const optionIds = quiz.options.map((option) => option.id)
  assert(new Set(optionIds).size === optionIds.length, `Duplicate option IDs in quiz: ${quiz.id}`)

  const correctIds = Array.isArray(quiz.correctOptionIds)
    ? quiz.correctOptionIds
    : quiz.correctOptionId
      ? [quiz.correctOptionId]
      : []

  assert(Array.isArray(correctIds) && correctIds.length === 1, `Single-choice quiz must have exactly one correct option: ${quiz.id}`)
  assert(correctIds.every((optionId) => optionIds.includes(optionId)), `Invalid correct option id in quiz: ${quiz.id}`)
  assert(quiz.explanationVi, `Missing required field: quiz.explanationVi`)

  if (quiz.relatedFlashcardIds?.length) {
    for (const relatedId of quiz.relatedFlashcardIds) {
      assert(flashcardIds.has(relatedId), `Invalid relatedFlashcardId in quiz ${quiz.id}: ${relatedId}`)
    }
  }

  if (quizIds.size !== quizzes.length) {
    throw new Error('Duplicate quiz ID detected.')
  }
}

console.log('Content validation passed.')
console.log(`Topics: ${topics.length}, Flashcards: ${flashcards.length}, Quizzes: ${quizzes.length}`)

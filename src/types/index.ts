export type Difficulty = 'easy' | 'medium' | 'hard'
export type ReviewStatus = 'draft' | 'reviewed' | 'approved'
export type LearningStatus = 'new' | 'learning' | 'known'
export type FlashcardType =
  | 'single_word'
  | 'technical_term'
  | 'phrase'
  | 'abbreviation'
  | 'concept'
  | 'comparison'
  | 'single-word'
  | 'technical-term'

export interface SourceReference {
  type: 'chatgpt_project' | 'personal_notes' | 'technical_document' | 'standard' | 'contributor_explanation' | 'external_reference'
  document?: string
  section?: string
  reference?: string
}

export interface Topic {
  id: string
  title: string
  description?: string
  order?: number
  tags?: string[]
}

export interface TopicContent extends Topic {
  reviewStatus?: ReviewStatus
}

export interface Flashcard {
  id: string
  topicId: string
  sectionId?: string
  cardType: FlashcardType
  term: string
  meaningVi?: string
  definitionEn?: string
  descriptionEn?: string
  meaningEn?: string
  explanationVi: string
  exampleEn?: string
  exampleVi?: string
  relatedTerms?: string[]
  relatedFlashcardIds?: string[]
  tags?: string[]
  difficulty?: Difficulty
  source: SourceReference | string
  reviewStatus?: ReviewStatus
}

export interface QuizOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  topicId: string
  sectionId?: string
  questionType: 'single-choice' | 'single_choice'
  questionEn: string
  questionVi?: string
  options: QuizOption[]
  correctOptionIds: string[]
  correctOptionId?: string
  explanationVi: string
  difficulty?: Difficulty
  relatedFlashcardIds?: string[]
  source: SourceReference | string
  reviewStatus?: ReviewStatus
}

export interface FlashcardProgress {
  status: LearningStatus
  lastReviewedAt?: string
  reviewCount?: number
}

export interface QuizAttempt {
  attemptId: string
  topicId: string
  score: number
  total: number
  completedAt: string
  incorrectQuestionIds: string[]
}

export interface QuizAnswerRecord {
  id: string
  selectedOptionId: string
  correctOptionIds: string[]
}

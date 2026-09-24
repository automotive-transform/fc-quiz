# AUT​​OMOTIVE TRANSFORM FLASHCARD APP
# 03 — DETAIL DESIGN

## 1. Suggested Project Structure

```text
automotive-transform-flashcards/
├── public/
│   └── data/
│       ├── topics.json
│       ├── flashcards.json
│       └── quizzes.json
├── content-source/
│   ├── CAN/
│   ├── AUTOSAR/
│   ├── MISRA-C/
│   ├── ISO-26262/
│   └── ASPICE/
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── flashcards/
│   │   └── quiz/
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── TopicPage.tsx
│   │   ├── FlashcardPage.tsx
│   │   └── QuizPage.tsx
│   ├── services/
│   │   ├── contentService.ts
│   │   ├── progressService.ts
│   │   └── quizService.ts
│   ├── types/
│   │   ├── topic.ts
│   │   ├── flashcard.ts
│   │   └── quiz.ts
│   ├── utils/
│   │   ├── storage.ts
│   │   └── validation.ts
│   ├── App.tsx
│   └── main.tsx
├── scripts/
│   └── validate-data.mjs
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 2. TypeScript Models

### 2.1 Topic

```ts
export interface Topic {
  id: string;
  title: string;
  description?: string;
  order?: number;
  tags?: string[];
}
```

### 2.2 Flashcard

```ts
export type Difficulty = "easy" | "medium" | "hard";
export type ReviewStatus = "draft" | "reviewed" | "approved";
export type LearningStatus = "new" | "learning" | "known";

export interface Flashcard {
  id: string;
  topicId: string;
  term: string;
  meaningVi: string;
  definitionEn: string;
  explanationVi: string;
  exampleEn?: string;
  exampleVi?: string;
  relatedTerms?: string[];
  relatedFlashcardIds?: string[];
  tags?: string[];
  difficulty: Difficulty;
  source: string;
  reviewStatus: ReviewStatus;
}
```

### 2.3 Quiz

```ts
export type QuestionType =
  | "single-choice"
  | "true-false"
  | "multiple-choice";

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  topicId: string;
  questionType: QuestionType;
  questionEn: string;
  questionVi?: string;
  options: QuizOption[];
  correctOptionIds: string[];
  explanationVi: string;
  difficulty: Difficulty;
  relatedFlashcardIds?: string[];
  source: string;
  reviewStatus: ReviewStatus;
}
```

For MVP, only `single-choice` should be enabled.

## 3. JSON Examples

### 3.1 Flashcard Example

```json
{
  "id": "fc-can-001",
  "topicId": "can",
  "term": "Differential Signaling",
  "meaningVi": "Truyền tín hiệu vi sai",
  "definitionEn": "A signaling method that represents information using the voltage difference between two wires.",
  "explanationVi": "CAN uses CANH and CANL. Noise affecting both wires similarly can be rejected by differential measurement.",
  "exampleEn": "CAN uses differential signaling to improve noise immunity.",
  "relatedTerms": ["CANH", "CANL", "EMI"],
  "tags": ["CAN", "Physical Layer"],
  "difficulty": "medium",
  "source": "content-source/CAN/CAN-Overview.md",
  "reviewStatus": "approved"
}
```

### 3.2 Quiz Example

```json
{
  "id": "quiz-can-001",
  "topicId": "can",
  "questionType": "single-choice",
  "questionEn": "What is the main benefit of differential signaling in CAN?",
  "questionVi": "Lợi ích chính của truyền tín hiệu vi sai trong CAN là gì?",
  "options": [
    { "id": "a", "text": "Improved noise rejection" },
    { "id": "b", "text": "Higher battery voltage" },
    { "id": "c", "text": "Elimination of all wiring" },
    { "id": "d", "text": "Automatic encryption" }
  ],
  "correctOptionIds": ["a"],
  "explanationVi": "Differential signaling helps reject common-mode noise affecting both wires.",
  "difficulty": "easy",
  "relatedFlashcardIds": ["fc-can-001"],
  "source": "content-source/CAN/CAN-Overview.md",
  "reviewStatus": "approved"
}
```

## 4. Flashcard Interaction Design

### 4.1 Initial State

- Show front side.
- Display term and optional short prompt.
- Hide explanation until the learner flips the card.

### 4.2 Back Side

Display:

- Vietnamese meaning.
- English definition.
- Vietnamese explanation.
- Example.
- Related terms.

### 4.3 Controls

- Flip.
- Previous.
- Next.
- Mark as New.
- Mark as Learning.
- Mark as Known.
- Exit session.

### 4.4 Progress Behavior

When the learner changes a card status:

1. Update React state.
2. Persist the status to LocalStorage.
3. Update the topic/session progress indicator.
4. Do not send data to a server.

## 5. Quiz Interaction Design

### 5.1 Quiz Start

- Select topic.
- Select question count, if implemented.
- Load approved questions for that topic.
- Randomize question order locally.
- Randomize options only if the correct-option mapping remains valid.

### 5.2 Answer Flow

1. Display question and options.
2. Learner selects one option.
3. Disable or lock the answer after submission.
4. Show correct/incorrect result.
5. Show explanation.
6. Continue to next question.

### 5.3 Result Screen

Display:

- Score.
- Total questions.
- Percentage.
- Correct count.
- Incorrect count.
- List of incorrect questions.
- Link to related flashcards when available.
- Restart quiz button.

### 5.4 Answer Checking

```ts
export function isSingleChoiceCorrect(
  selectedOptionId: string,
  correctOptionIds: string[]
): boolean {
  return (
    correctOptionIds.length === 1 &&
    selectedOptionId === correctOptionIds[0]
  );
}
```

## 6. LocalStorage Service

Suggested API:

```ts
export function getFlashcardProgress(): Record<string, FlashcardProgress>;
export function saveFlashcardProgress(
  progress: Record<string, FlashcardProgress>
): void;

export function getQuizAttempts(): QuizAttempt[];
export function saveQuizAttempt(attempt: QuizAttempt): void;
```

Storage access should be wrapped in `try/catch` so the application can continue in a read-only mode if browser storage is unavailable.

## 7. Validation Rules

The validation script should check:

- Valid JSON syntax.
- Required fields.
- Unique IDs.
- Valid `topicId` references.
- Valid `difficulty` values.
- Valid `reviewStatus` values.
- Quiz option IDs are unique within each question.
- `correctOptionIds` reference existing options.
- `single-choice` questions have exactly one correct option.
- Related flashcard IDs exist.
- No empty question text.
- No empty flashcard term.
- Optional policy: only `approved` content is deployable.

## 8. Error Handling

The UI should show understandable messages for:

- Failed JSON loading.
- Unknown topic.
- Empty topic content.
- Invalid quiz question.
- LocalStorage read/write failure.
- Missing related flashcard.

The application should not crash because one optional relationship is missing.

## 9. Testing Strategy

### Unit Tests

- Answer checking.
- Score calculation.
- LocalStorage serialization/deserialization.
- Filtering by topic.
- Validation rules.

### Manual Tests

- Desktop Chrome/Edge/Safari.
- iOS Safari.
- Touch controls.
- Browser refresh after progress changes.
- Empty topic.
- Invalid JSON in development.
- Quiz with all correct and all incorrect answers.
- Navigation from incorrect quiz answer to flashcard.

## 10. Implementation Order

1. Create Vite + React + TypeScript project.
2. Add topic JSON and topic list.
3. Implement flashcard viewer.
4. Implement LocalStorage progress.
5. Add quiz JSON model.
6. Implement single-choice quiz.
7. Implement results and incorrect-answer review.
8. Add JSON validation script.
9. Add GitHub Actions.
10. Deploy and test on PC and iOS Safari.

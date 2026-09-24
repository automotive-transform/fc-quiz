# AUT​​OMOTIVE TRANSFORM FLASHCARD APP
# 02 — ARCHITECTURE DESIGN

## 1. Architecture Overview

The application uses a static frontend architecture:

- Frontend: React + TypeScript + Vite.
- Content: JSON files committed to GitHub.
- Local learner state: browser LocalStorage.
- Deployment: GitHub Actions + static hosting.
- No backend and no online database for MVP.

```text
                    ┌──────────────────────────┐
                    │       GitHub Repo         │
                    │  Source notes + JSON      │
                    │  React/TS source code     │
                    └────────────┬─────────────┘
                                 │ git push
                                 ▼
                    ┌──────────────────────────┐
                    │      GitHub Actions       │
                    │ validate → build → deploy │
                    └────────────┬─────────────┘
                                 ▼
                    ┌──────────────────────────┐
                    │      Static Website      │
                    │      PC + iOS Safari      │
                    └────────────┬─────────────┘
                                 │
                 ┌───────────────┴────────────────┐
                 ▼                                ▼
       ┌──────────────────┐             ┌──────────────────┐
       │ JSON Content     │             │ LocalStorage     │
       │ Topics            │             │ Flashcard state  │
       │ Flashcards        │             │ Quiz history     │
       │ Quizzes           │             │ Local settings   │
       └──────────────────┘             └──────────────────┘
```

## 2. Main Modules

### 2.1 Presentation Layer

Suggested components:

- `AppShell`
- `Header`
- `TopicList`
- `TopicCard`
- `FlashcardPage`
- `FlashcardViewer`
- `FlashcardControls`
- `FlashcardProgress`
- `QuizPage`
- `QuizQuestion`
- `QuizOption`
- `QuizProgress`
- `QuizResult`
- `IncorrectAnswerReview`

### 2.2 Page/Route Layer

Suggested routes:

- `/`
- `/topics`
- `/topics/:topicId`
- `/topics/:topicId/flashcards`
- `/topics/:topicId/quiz`
- `/quiz/:quizSessionId/result` — optional; local state may also be used instead.

Do not create separate top-level routes for Comparison or Practice Test in MVP.

### 2.3 Data Layer

Suggested files:

```text
public/data/topics.json
public/data/flashcards.json
public/data/quizzes.json
```

For larger content sets, split by topic:

```text
public/data/topics/can.json
public/data/flashcards/can.json
public/data/quizzes/can.json
```

The initial implementation can use one file per entity type to reduce complexity.

### 2.4 Service Layer

Suggested services:

- `contentService.ts`
  - Load topics.
  - Load flashcards.
  - Load quizzes.
  - Filter content by topic.
- `progressService.ts`
  - Read and write LocalStorage.
  - Save flashcard learning state.
  - Save quiz attempts.
- `quizService.ts`
  - Select questions.
  - Check answers.
  - Calculate score.
  - Produce incorrect-answer review data.
- `validationService.ts`
  - Runtime-safe validation for loaded content where appropriate.

### 2.5 State Management

MVP recommendation:

- React `useState` and `useReducer`.
- Avoid Redux or another state library initially.
- Use URL parameters for selected topic.
- Use LocalStorage for persistent learner state.

## 3. Data Ownership

| Data | Location | Shared? |
|---|---|---|
| Topics | GitHub JSON | Yes |
| Flashcards | GitHub JSON | Yes |
| Quiz questions | GitHub JSON | Yes |
| Flashcard progress | Browser LocalStorage | No |
| Quiz attempts | Browser LocalStorage | No |
| Login/account data | Not implemented | No |

## 4. LocalStorage Design

Suggested keys:

```text
atf.flashcardProgress.v1
atf.quizAttempts.v1
atf.settings.v1
```

Example flashcard progress:

```json
{
  "fc-can-001": {
    "status": "known",
    "lastReviewedAt": "2026-09-24T10:00:00.000Z",
    "reviewCount": 3
  }
}
```

Example quiz attempt:

```json
{
  "attemptId": "attempt-20260924-001",
  "topicId": "can",
  "score": 8,
  "total": 10,
  "completedAt": "2026-09-24T10:15:00.000Z",
  "incorrectQuestionIds": ["quiz-can-003"]
}
```

LocalStorage is not a secure storage mechanism and should not be used for sensitive information.

## 5. Content Relationships

```text
Topic
 ├── Flashcards
 └── Quiz Questions
        └── relatedFlashcardIds → Flashcards
```

A quiz question may reference one or more flashcards. The application should gracefully handle missing optional relationships and should report invalid references during validation.

## 6. Deployment Architecture

Recommended initial flow:

1. Developer edits source notes or JSON locally.
2. Developer runs validation locally.
3. Developer commits and pushes to GitHub.
4. GitHub Actions runs:
   - Install dependencies.
   - Validate content.
   - Run TypeScript/build checks.
   - Build Vite application.
   - Deploy static output.

Example pipeline:

```text
git push
   │
   ▼
validate-data.mjs
   │
   ├── fail → stop deployment
   │
   ▼
npm run build
   │
   ├── fail → stop deployment
   │
   ▼
deploy static files
```

## 7. Security and Limitations

- Public JSON can be inspected in the browser.
- Correct quiz answers are not secret.
- The MVP is for learning, not secure examinations.
- No personal progress is stored centrally.
- Any user can reset LocalStorage by clearing browser data.

## 8. Architecture Decisions

| Decision | Reason |
|---|---|
| React + TypeScript + Vite | Simple, popular, maintainable |
| JSON content | Easy to edit, version, review, and deploy |
| LocalStorage | No account or database required |
| GitHub Actions | Automatic validation and deployment |
| Flashcards + Quiz only | Focused UX and lower implementation cost |
| No Docker initially | Avoid unnecessary setup complexity |

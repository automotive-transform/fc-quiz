# AUT​​OMOTIVE TRANSFORM FLASHCARD APP
# 01 — SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

## 1. Document Information

- Project: Automotive Transform Flashcard App
- Version: 2.0
- Scope: Flashcards + Quiz only
- Target platforms: PC browser and iOS Safari
- Primary users: Individual learner and study group
- Cost target: 0đ/month using free-tier/static hosting services

## 2. Product Vision

The application helps learners study English vocabulary and technical concepts in Automotive Engineering through two core learning modes:

1. Flashcards — learn terminology and concepts.
2. Quiz — check understanding through topic-based questions.

The application should remain simple, fast, low-cost, and easy to maintain.

## 3. Scope

### 3.1 In Scope

- Topic/category browsing.
- Flashcards by topic.
- English and Vietnamese learning content.
- Definitions, explanations, examples, related terms, and source traceability.
- Card flipping.
- Learner-local progress using browser LocalStorage.
- Quiz questions by topic.
- Multiple-choice questions as the initial quiz type.
- Answer checking and explanations.
- Quiz score and result summary.
- Review of incorrect answers.
- Navigation from quiz mistakes to related flashcards.
- JSON-based content stored in GitHub.
- Local content creation/editing.
- JSON validation before deployment.
- GitHub Actions build and deployment.

### 3.2 Out of Scope for MVP

- Separate Comparison menu or module.
- Separate Practice Test menu or module.
- User accounts and login.
- Cloud-based learner progress.
- Online database.
- Server-side authentication.
- Paid hosting or paid AI API requirement.
- Competitive leaderboard.
- Secure examination mode.
- Anti-cheating protection.
- Real-time collaboration.
- Native Android/iOS application.

### 3.3 Future Optional Enhancements

These are not separate top-level features in the MVP:

- Comparison-style flashcards.
- True/False questions.
- Multiple-answer questions.
- Scenario-based Automotive questions.
- Spaced repetition scheduling.
- Import/export of local progress.
- PWA installation.
- Optional backend or RAG service.

## 4. Functional Requirements

### FR-01 — Topic List

The system shall display available Automotive topics, for example:

- CAN
- AUTOSAR
- MISRA-C
- ISO 26262
- ASPICE
- ADAS
- UDS/OBD-II/XCP

Each topic shall have a stable `topicId`, title, description, and optional ordering metadata.

### FR-02 — Flashcard Browsing

The learner shall be able to:

- Select a topic.
- Start a flashcard session.
- Move to the next and previous card.
- Flip a card.
- See the term, English definition, Vietnamese meaning, explanation, and example when available.
- See related terms and source information when available.

### FR-03 — Flashcard Progress

The learner shall be able to mark a card as:

- `new`
- `learning`
- `known`

Progress shall be stored in browser LocalStorage and shall be specific to the current browser/device.

The system shall not require an account or online progress database.

### FR-04 — Quiz by Topic

The learner shall be able to:

- Select a topic.
- Start a quiz.
- Answer multiple-choice questions.
- Move through questions.
- Submit an answer.
- See whether the answer is correct.
- Read an explanation after answering.
- See the final score and number of correct answers.
- Review incorrect answers.
- Open related flashcards where a relationship is defined.

### FR-05 — Quiz Question Model

The initial supported question type shall be:

- `single-choice`

The data model shall allow future extension to:

- `true-false`
- `multiple-choice`

Each question shall contain a single unambiguous correct answer for `single-choice` questions.

### FR-06 — Content Traceability

Each flashcard and quiz question should retain source information, such as:

- Source file.
- Source section.
- Optional source line or source reference.
- Review status.

The application shall display source information only when useful to the learner; internal validation metadata may remain hidden.

### FR-07 — Content Review Status

Content shall use the following lifecycle:

- `draft`: generated or edited but not approved.
- `reviewed`: checked by a human or reviewer.
- `approved`: ready for public deployment.

The deployment validation script shall be able to reject or warn about content that is not approved, according to the configured project policy.

### FR-08 — Local Content Workflow

Content editors shall be able to:

1. Store source study notes in Markdown or text.
2. Ask an AI tool to generate draft JSON.
3. Review technical accuracy and language.
4. Correct or enrich the JSON.
5. Run validation.
6. Commit the approved JSON to GitHub.
7. Trigger automated build and deployment.

### FR-09 — Search and Filtering

MVP recommendation:

- Topic filtering is required.
- Full-text search is optional and may be added after the core flow works.
- Difficulty filtering is optional.

### FR-10 — Responsive UI

The application shall support:

- Desktop browser.
- Mobile browser.
- iOS Safari.

The UI shall be usable with touch interaction and shall not depend on hover-only behavior.

## 5. Non-Functional Requirements

### NFR-01 — Cost

The MVP should operate with free services:

- GitHub repository.
- GitHub Actions within available free limits.
- Static hosting such as GitHub Pages or another free static host.
- No mandatory paid backend or database.

### NFR-02 — Performance

- Initial page should load quickly on a normal mobile connection.
- JSON files should be split logically if they become large.
- Images and unnecessary dependencies should be minimized.

### NFR-03 — Maintainability

- React + TypeScript + Vite.
- Clear separation between components, data, services, types, and utilities.
- Stable IDs for topics, flashcards, and quiz questions.
- Automated JSON validation.

### NFR-04 — Reliability

- Invalid JSON structure shall fail validation before deployment.
- Missing references such as an invalid `topicId` or `relatedFlashcardId` shall be reported.
- Duplicate IDs shall be reported.

### NFR-05 — Privacy

- No learner account is required.
- Progress remains in the learner's browser LocalStorage.
- No learner progress is uploaded by the MVP.
- Public JSON content must not contain private personal information.

### NFR-06 — Accessibility

- Buttons shall have meaningful labels.
- Keyboard navigation should be supported on desktop.
- Color shall not be the only indicator of correctness or progress.
- Text contrast should be readable on mobile and desktop.

## 6. Content Requirements

### 6.1 Flashcard Fields

Required or recommended fields:

- `id`
- `topicId`
- `term`
- `meaningVi`
- `definitionEn`
- `explanationVi`
- `exampleEn`
- `relatedTerms`
- `tags`
- `difficulty`
- `source`
- `reviewStatus`

Optional fields:

- `pronunciation`
- `exampleVi`
- `commonMistakes`
- `relatedFlashcardIds`
- `comparisonNotes`

### 6.2 Quiz Fields

Required or recommended fields:

- `id`
- `topicId`
- `questionType`
- `questionEn`
- `questionVi`
- `options`
- `correctOptionIds`
- `explanationVi`
- `difficulty`
- `relatedFlashcardIds`
- `source`
- `reviewStatus`

### 6.3 Content Quality Rules

- One main concept per flashcard.
- Questions must be answerable from the source material.
- Distractors must be plausible but clearly incorrect under the stated question.
- Avoid unsupported technical claims.
- Preserve source wording when precision matters.
- Avoid duplicate or nearly duplicate cards unless they serve different learning objectives.
- Review all generated content before marking it `approved`.

## 7. Acceptance Criteria

The MVP is acceptable when:

1. A learner can select a topic and study flashcards.
2. A learner can flip cards and move between cards.
3. Flashcard progress persists after refreshing the browser.
4. A learner can select a topic and complete a multiple-choice quiz.
5. The system shows score, explanations, and incorrect answers.
6. Quiz questions can link to related flashcards.
7. Invalid JSON is detected before deployment.
8. The application works on desktop and iOS Safari.
9. No login or online database is required.
10. The repository contains clear instructions for adding new topics, flashcards, and quiz questions.

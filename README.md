# Automotive Transform Flashcard App

## Create Flashcard and Quiz JSON Files

Content files are discovered automatically from the `content/` directory. Use the
following folders:

- `content/flashcards/` for flashcard JSON files.
- `content/quizzes/` for quiz JSON files.
- `content/topic-metadata.json` for optional topic names, descriptions, and ordering.

### Create a Flashcard File

1. Create a `.json` file under `content/flashcards/`.
2. Set the top-level `contentType` to `flashcards` and store entries in `items`.
3. Give every item a unique `id` and a lowercase `topicId`.
4. Include the supported `cardType`, English definition, Vietnamese explanation, and
  source metadata when available.
5. Set `reviewStatus` to `draft` until the content has been reviewed.

Example filename: `content/flashcards/can-physical-layer.json`.
The complete schemas, AI prompts, review checklist, and JSON examples are maintained
in [04_AI_JSON_GENERATION_PROMPTS.md](04_AI_JSON_GENERATION_PROMPTS.md).

### Create a Quiz File

1. Create a `.json` file under `content/quizzes/`.
2. Set the top-level `contentType` to `quizzes` and store questions in `items`.
3. Give every question a unique `id` and a lowercase `topicId`.
4. Use `questionType: "single_choice"`, at least two options, and exactly one
  `correctOptionId`.
5. Add `relatedFlashcardIds` when a question should link to a flashcard.
6. Set `reviewStatus` to `draft` until the content has been reviewed.

The complete schemas, AI prompts, review checklist, and JSON examples are maintained
in [04_AI_JSON_GENERATION_PROMPTS.md](04_AI_JSON_GENERATION_PROMPTS.md).

After adding or changing content, run:

```bash
npm run validate:content
npm test
npm run build
```
OR 
```bash
npm run validate:content && npm test && npm run build
```

The build automatically discovers new JSON files. No React code or manual topic
registration is required.

A React + TypeScript + Vite app for automotive learning. The app teaches flashcards and quiz questions from JSON content files in the repository and auto-discovers content by folder and metadata.

## Current architecture

This project uses a content-first discovery model instead of the older hardcoded public/data setup.

```text
automotive-transform-flashcards/
├── README.md
├── 04_AI_JSON_GENERATION_PROMPTS.md
├── .github/
│   └── workflows/
│       └── deploy.yml
├── content/
│   ├── topic-metadata.json
│   ├── flashcards/
│   │   ├── can-core.json
│   │   └── autosar-and-safety.json
│   └── quizzes/
│       ├── can-quiz-set.json
│       └── other-topics.json
├── content-source/
├── designs/
│   ├── 02_ARCHITECTURE_DESIGN.md
│   └── 03_DETAIL_DESIGN.md
├── docs/
│   ├── 04_AI_JSON_GENERATION_PROMPTS.md
│   └── CONTRIBUTING.md
├── requirements/
│   ├── 01_REQUIREMENTS.md
│   └── 05_REQUIREMENTS_ADVANCED_SHARED_WORKSPACE.md
├── scripts/
│   └── validate-content.mjs
├── src/
│   ├── App.tsx
│   ├── services/
│   ├── utils/
│   └── types/
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── public/
└── dist/
```

## Content model

- Content is stored under `content/`.
- Folders determine the primary type: `flashcards` or `quizzes`.
- File names are free-form and do not determine topic.
- Topic IDs are normalized to lowercase, for example `Can`, `CAN`, and `cAn` all become `can`.
- UI display names are derived or enriched from metadata and rendered in uppercase.
- Topic metadata can be optional; missing metadata does not break discovery.

## Topic normalization rules

The app canonicalizes topic IDs as follows:

```ts
normalizeTopicId('Can') === 'can'
normalizeTopicId('CAN') === 'can'
normalizeTopicId('cAn') === 'can'
```

This prevents duplicate topic entries caused by mixed-case variations.

## JSON schema

### Flashcards

```json
{
  "schemaVersion": "1.0",
  "contentType": "flashcards",
  "items": [
    {
      "id": "can-term-001",
      "topicId": "can",
      "sectionId": "physical-layer",
      "cardType": "technical_term",
      "term": "Differential Signaling",
      "definitionEn": "A signaling method that uses the voltage difference between two conductors to represent data.",
      "explanationVi": "Trong CAN, tín hiệu được truyền trên hai dây CANH và CANL.",
      "source": {
        "type": "technical_document",
        "document": "CAN Overview",
        "section": "Physical layer"
      },
      "reviewStatus": "approved"
    }
  ]
}
```

### Quizzes

```json
{
  "schemaVersion": "1.0",
  "contentType": "quizzes",
  "items": [
    {
      "id": "quiz-can-001",
      "topicId": "can",
      "questionType": "single_choice",
      "questionEn": "What is the main advantage of differential signaling in CAN?",
      "options": [
        { "id": "A", "text": "Improved noise rejection" },
        { "id": "B", "text": "Higher battery voltage" }
      ],
      "correctOptionId": "A",
      "explanationVi": "Differential signaling helps reduce common-mode noise.",
      "relatedFlashcardIds": ["can-term-001"]
    }
  ]
}
```

## Validation and workflow

Use the validation script before shipping content changes:

```bash
node scripts/validate-content.mjs
```

Common app commands:

```bash
npm install
npm test
npm run build
npm run dev -- --host 0.0.0.0 --port 5173
```

## Prompt pack

AI content generation guidance is in [04_AI_JSON_GENERATION_PROMPTS.md](04_AI_JSON_GENERATION_PROMPTS.md). It describes the discovery-based prompt flow for:

- generating flashcard files
- generating quiz files
- generating topic metadata
- reviewing/correcting JSON
- validating output against the project schema

## Notes

- The app is intentionally designed to be content-driven and contributor-friendly.
- New topics and files can be added without updating the React app manually.
- Legacy `public/data` content is not the source of truth anymore.

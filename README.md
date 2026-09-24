# Automotive Transform Flashcard App

A React + TypeScript + Vite app for automotive learning. The app teaches flashcards and quiz questions from JSON content files in the repository and auto-discovers content by folder and metadata.

## Current architecture

This project uses a content-first discovery model instead of the older hardcoded public/data setup.

```text
automotive-transform-flashcards/
├── README.md
├── 01_REQUIREMENTS.md
├── 02_ARCHITECTURE_DESIGN.md
├── 03_DETAIL_DESIGN.md
├── 04_AI_JSON_GENERATION_PROMPTS.md
├── 05_REQUIREMENTS_ADVANCED_SHARED_WORKSPACE.md
├── content/
│   ├── topic-metadata.json
│   ├── flashcards/
│   │   ├── can-core.json
│   │   └── autosar-and-safety.json
│   └── quizzes/
│       ├── can-quiz-set.json
│       └── other-topics.json
├── content-source/
├── scripts/
│   └── validate-content.mjs
├── src/
│   ├── App.tsx
│   ├── services/
│   ├── utils/
│   └── types/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── dist/
└── public/
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

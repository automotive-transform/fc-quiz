# Automotive Transform Flashcard App
# 04 — AI Prompt Pack for JSON Content Generation

## 1. Purpose

This file is the working prompt pack for generating automotive flashcard and quiz JSON for the discovery-based content model.

The project now follows the architecture:

- folder-based content discovery
- auto-detected `contentType` by folder name
- file names are free-form and not required to contain topic or section
- `topicId` is canonicalized and normalized automatically
- topic display name is uppercase in the UI
- optional metadata file can enrich display names and ordering
- validation is performed at build time

Use these prompts as the canonical reference for AI-assisted content creation in this model.

## 2. Core Rules for All Generation Tasks

Apply these rules to every generation task:

- Follow the supplied source material closely.
- Do not invent facts outside the source.
- Preserve core English terminology exactly where appropriate.
- Write Vietnamese explanations in clear, memorable language.
- Keep each item focused on one concept or learning objective.
- Use stable, unique IDs.
- Keep `topicId` in canonical lowercase form, e.g. `can`, `misra-c`, `autosar`.
- Do not lowercase content fields such as `term`, `definitionEn`, `questionEn`, or `explanationVi`.
- Use supported `cardType` values:
  - `single_word`
  - `technical_term`
  - `phrase`
  - `abbreviation`
  - `concept`
  - `comparison`
- Accept legacy aliases only if the runtime still needs backward compatibility.
- Return valid JSON only.
- Do not wrap JSON in Markdown fences.
- Set `reviewStatus` to `draft` unless the item is reviewed.
- Include source traceability when available.
- For ambiguous or low-confidence content, skip the item or flag it for review.

## 3. Suggested Topics

Use one of the existing topic IDs below whenever the source material matches. The
topic ID must be lowercase and must match `content/topic-metadata.json` exactly.

| `topicId` | Suggested scope |
| --- | --- |
| `aspice` | Automotive SPICE process assessment and engineering practices |
| `safety` | Functional safety, ISO 26262, HARA, and ASIL |
| `autosar` | AUTOSAR Classic/Adaptive, RTE, and BSW |
| `can` | CAN protocol, frames, signaling, and communication |
| `eth` | Automotive Ethernet and in-vehicle networking |
| `misra-c` | MISRA C rules, compliant coding, and static analysis |
| `testing` | Automotive software testing, verification, and validation |
| `tools` | Automotive engineering, simulation, debugging, and analysis tools |
| `templates` | Reusable engineering and documentation templates |
| `traceability` | Requirements traceability and verification coverage |
| `cyber` | Automotive cybersecurity and ISO/SAE 21434 |
| `adas` | ADAS, perception, sensor fusion, and driver assistance |
| `connected` | Connected vehicles, telematics, and vehicle-to-cloud communication |
| `ee-arch` | Automotive electrical/electronic architecture and ECU domains |
| `xev` | Electric, hybrid, and electrified vehicle powertrains |
| `sdv` | Software-defined vehicle architecture and updates |
| `linux` | Automotive and embedded Linux platforms |
| `diagnostics` | OBD-II, UDS, DTCs, and automotive diagnostics |

If the source does not match an existing topic, do not invent a new topic ID in the
generated content. Flag it for review or update `topic-metadata.json` separately.

## 4. Required Folder Structure

```text
content/
├── flashcards/
│   ├── random-a.json
│   ├── can-notes.json
│   ├── contributor-b.json
│   └── new-topic.json
│
└── quizzes/
    ├── quiz-a.json
    ├── can-test.json
    └── contributor-b.json
```

Rules:

- Folder decides the primary content type.
- File names are free-form and do not identify topic.
- A file may contain multiple topics and/or multiple `cardType` values.
- Contributors do not need to register topics manually.
- Topic and section metadata come from item fields and optional metadata files.

## 5. Prompt — Generate Flashcard File(s)

```text
You are an Automotive Engineering educator and technical flashcard designer.

Task:
Generate one or more flashcard JSON objects for the Automotive Transform project using the auto-discovery content model.

Requirements:
- Use `contentType: "flashcards"` at the top level.
- Use `items` as the array of flashcards.
- The file name may be any valid filename; it does not determine topic.
- Each item must have a unique `id`.
- Each item must include a normalized lowercase `topicId`.
- Choose `topicId` from this suggested list: `aspice`, `safety`, `autosar`, `can`, `eth`,
  `misra-c`, `testing`, `tools`, `templates`, `traceability`, `cyber`, `adas`,
  `connected`, `ee-arch`, `xev`, `sdv`, `linux`, `diagnostics`.
- Prefer the topic whose scope best matches the source. Do not invent a new topic ID.
- `sectionId` is optional but supported when applicable.
- Use one of these `cardType` values only:
  single_word, technical_term, phrase, abbreviation, concept, comparison
- Keep `term`, `definitionEn`, `explanationVi`, and `questionEn` as natural content text; do not lowercase them.
- Preserve English technical terms accurately.
- Provide Vietnamese explanations in simple, memorable language.
- Include `source` metadata if available.
- Keep the content factual and faithful to the provided source.
- Do not invent unsupported content.
- Set `reviewStatus` to `draft` unless reviewed.

Schema:
{
  "schemaVersion": "1.0",
  "contentType": "flashcards",
  "items": [
    {
      "id": "can-physical-single-word-001",
      "topicId": "can",
      "sectionId": "physical-layer",
      "cardType": "single_word",
      "term": "Detect",
      "definitionEn": "To discover or identify something.",
      "explanationVi": "Phát hiện hoặc nhận diện một điều gì đó.",
      "source": {
        "type": "technical_document",
        "document": "CAN Overview",
        "section": "Physical layer",
        "reference": "content-source/CAN/CAN-overview.md"
      },
      "reviewStatus": "draft"
    }
  ]
}

Source data:
[PASTE SOURCE DATA HERE]

Return JSON only.
```

## 6. Prompt — Generate Quiz File(s)

```text
You are an Automotive Engineering quiz designer.

Task:
Generate one or more quiz JSON objects for the Automotive Transform project using the auto-discovery content model.

Requirements:
- Use `contentType: "quizzes"` at the top level.
- Use `items` as the array of quiz questions.
- Each item must have a unique `id`.
- Each item must include a normalized lowercase `topicId`.
- Choose `topicId` from this suggested list: `aspice`, `safety`, `autosar`, `can`, `eth`,
  `misra-c`, `testing`, `tools`, `templates`, `traceability`, `cyber`, `adas`,
  `connected`, `ee-arch`, `xev`, `sdv`, `linux`, `diagnostics`.
- Prefer the topic whose scope best matches the source. Do not invent a new topic ID.
- `sectionId` is optional but supported when applicable.
- Use `questionType` as `single_choice` in the new schema, or `single-choice` for legacy compatibility.
- Each question must have at least 2 options and exactly one correct answer.
- Keep option IDs as uppercase letters such as A, B, C, D if preferred.
- `correctOptionId` is the preferred field for the new schema; `correctOptionIds` is accepted for backward compatibility.
- Keep `questionEn`, `explanationVi`, and option text natural and factual.
- Link related flashcards when possible.
- Preserve the source and review status.

Schema:
{
  "schemaVersion": "1.0",
  "contentType": "quizzes",
  "items": [
    {
      "id": "can-physical-quiz-001",
      "topicId": "can",
      "sectionId": "physical-layer",
      "questionType": "single_choice",
      "questionEn": "What is the purpose of differential signaling?",
      "options": [
        { "id": "A", "text": "Reduce common-mode noise" },
        { "id": "B", "text": "Increase cable length without limits" },
        { "id": "C", "text": "Remove the need for a receiver" }
      ],
      "correctOptionId": "A",
      "explanationVi": "Differential signaling giúp tăng khả năng chống nhiễu.",
      "source": {
        "type": "technical_document",
        "document": "CAN Overview",
        "section": "Physical layer",
        "reference": "content-source/CAN/CAN-overview.md"
      },
      "reviewStatus": "draft"
    }
  ]
}

Source data:
[PASTE SOURCE DATA HERE]

Return JSON only.
```

## 7. Prompt — Generate Topic Metadata File (Optional)

```text
You are an Automotive Engineering content catalog manager.

Task:
Create a `topic-metadata.json` file that enriches display names and ordering for discovered topics.

Requirements:
- File may contain a top-level `schemaVersion` and `topics` array.
- Each topic entry must contain a normalized lowercase `topicId`.
- Include `nameEn` and `nameVi` when available.
- Keep `displayName` uppercase for UI, or derive it automatically from `topicId`.
- `description` is optional.
- `order` is optional.
- Topic metadata is optional; missing metadata must not break content discovery.

Schema:
{
  "schemaVersion": "1.0",
  "topics": [
    {
      "topicId": "can",
      "nameEn": "CAN",
      "nameVi": "GIAO THỨC CAN",
      "description": "Controller Area Network fundamentals.",
      "order": 1
    }
  ]
}

Source data:
[PASTE SOURCE DATA HERE]

Return JSON only.
```

## 8. Prompt — Review and Correct JSON

```text
You are a senior Automotive Engineering reviewer.

Review the supplied content against the source material and the project schema.

Check:
- Valid JSON structure.
- Valid `contentType`.
- Topic IDs are normalized to lowercase.
- `cardType` values are supported.
- `questionType` is supported.
- No duplicate IDs across the collection.
- One correct answer per single-choice question.
- Topic references are valid.
- Source metadata is valid.
- No unsupported claims.
- Section IDs and topic metadata are optional and do not break discovery.

Return:
{
  "correctedItems": [],
  "reviewIssues": [],
  "approvalRecommendation": "approved|reviewed|needs-review"
}

Source data:
[PASTE SOURCE DATA]

Content JSON:
```
[PASTE JSON]
```

## 9. Recommended Workflow

1. Choose the topic.
2. Draft or update source notes.
3. Generate 10–20 flashcards.
4. Review and clean the generated output.
5. Generate quiz items from reviewed flashcards and source content.
6. Validate JSON with the local script.
7. Mark reviewed items as `approved` only after manual inspection.
8. Commit changes to GitHub.

## 10. Validation Checklist

Before content is accepted:

- [ ] JSON syntax is valid.
- [ ] `cardType` is supported.
- [ ] `source` is present and structured.
- [ ] IDs are unique.
- [ ] Topic IDs are valid.
- [ ] Quiz has exactly one correct answer.
- [ ] Related flashcard references are valid.
- [ ] Explanation is understandable in Vietnamese.
- [ ] No unsupported technical statement was introduced.

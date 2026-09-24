# Automotive Transform Flashcard App
# 04 — AI Prompt Pack for JSON Content Generation

## 1. Purpose

This file is the working prompt pack for generating topic, flashcard, and quiz JSON that matches the current app and the advanced shared-content model.

The current schema expects:

- `cardType` on each flashcard
- object-based `source` metadata
- structured quiz options and `correctOptionIds`
- a lightweight validation pass before content is considered usable
- separate documentation and content workspaces, not one mixed folder

Use these prompts as the canonical reference for AI-assisted content creation.

## 2. Global Instruction Set

Apply these rules to every generation task:

- Follow the supplied source material closely.
- Do not invent facts outside the source.
- Preserve core English terminology.
- Write Vietnamese explanations in clear, memorable language.
- Keep each item focused on one concept or learning objective.
- Use stable, unique IDs.
- Use the supported `cardType` values:
  - `single-word`
  - `technical-term`
  - `phrase`
  - `abbreviation`
  - `concept`
  - `comparison`
- Use object-based `source` metadata when available.
- Return valid JSON only.
- Do not wrap JSON in Markdown fences.
- Set `reviewStatus` to `draft` unless the item has been reviewed.
- Include source traceability.
- For ambiguous or low-confidence content, skip the item or flag it for review.

## 3. Prompt — Generate Topics JSON

```text
You are an Automotive Engineering content designer.

Task:
Convert the supplied source data into a JSON array of topic objects for the Automotive Transform Flashcard project.

Requirements:
- Create one topic per major subject.
- Use stable lowercase kebab-case IDs.
- Keep titles concise.
- Preserve the scope of the source.
- Do not invent topics missing from the source.
- Keep `reviewStatus` as `draft` unless reviewed.

Schema:
[
  {
    "id": "can",
    "title": "CAN",
    "description": "Short description",
    "order": 1,
    "tags": ["automotive", "communication"],
    "reviewStatus": "draft"
  }
]

Source data:
[PASTE SOURCE DATA HERE]

Return JSON only.
```

## 4. Prompt — Generate Flashcards from Source Markdown

```text
You are an Automotive Engineering educator and technical flashcard designer.

Task:
Convert the supplied source material into Automotive Transform flashcards.

Requirements:
- Each flashcard must map to one focused concept.
- Use a valid `cardType` from this list: single-word, technical-term, phrase, abbreviation, concept, comparison.
- Use `topicId` matching the requested topic.
- Use `source` as an object with `type`, `document`, `section`, and optional `reference`.
- Preserve technical terms in English.
- Provide Vietnamese explanation in simple, memorable language.
- Include at least one English field such as `definitionEn`, `meaningEn`, or `descriptionEn`.
- Keep the content faithful to the source.
- Set `reviewStatus` to `draft`.
- Prefer 10–20 cards per batch.
- Skip vague or unsupported items.

Schema:
[
  {
    "id": "can-term-001",
    "topicId": "can",
    "cardType": "technical-term",
    "term": "Differential Signaling",
    "meaningVi": "Truyền tín hiệu vi sai",
    "definitionEn": "Accurate English definition",
    "explanationVi": "Easy Vietnamese explanation",
    "exampleEn": "Optional English example",
    "relatedTerms": ["CANH", "CANL"],
    "tags": ["CAN", "physical layer"],
    "difficulty": "easy",
    "source": {
      "type": "technical_document",
      "document": "CAN Overview",
      "section": "Physical layer",
      "reference": "content-source/CAN/CAN-overview.md"
    },
    "reviewStatus": "draft"
  }
]

Topic ID:
[PASTE TOPIC ID]

Source file:
[PASTE SOURCE FILE PATH]

Source data:
[PASTE SOURCE DATA HERE]

Return JSON only.
```

## 5. Prompt — Generate Comparison Cards

```text
Create comparison-oriented flashcards from the supplied source.

Rules:
- Use `cardType`: `comparison`.
- Store each comparison as a flashcard, not as a separate module.
- Focus on one clear distinction per card.
- State the comparison criteria explicitly.
- Use only distinctions supported by the source.
- Set `reviewStatus` to `draft`.

Schema:
[
  {
    "id": "can-comparison-001",
    "topicId": "can",
    "cardType": "comparison",
    "term": "CANH vs CANL",
    "meaningVi": "So sánh CANH và CANL",
    "definitionEn": "Comparison of the two signal conductors in differential signaling.",
    "explanationVi": "So sánh theo mục đích, đường truyền và cách nhận biết mức logic.",
    "exampleEn": "Optional example",
    "relatedTerms": ["CANH", "CANL", "differential signaling"],
    "tags": ["comparison"],
    "difficulty": "medium",
    "source": {
      "type": "technical_document",
      "document": "CAN Overview",
      "section": "Physical layer",
      "reference": "content-source/CAN/CAN-overview.md"
    },
    "reviewStatus": "draft"
  }
]

Source data:
[PASTE SOURCE DATA HERE]

Return JSON only.
```

## 6. Prompt — Generate Single-Choice Quiz JSON

```text
You are an Automotive Engineering quiz designer.

Task:
Generate single-choice quiz questions from the supplied source data.

Requirements:
- Each question has exactly four options.
- Exactly one option is correct.
- Use `questionType` equal to `single-choice`.
- Use `correctOptionIds` as an array with one value.
- Keep option IDs as lowercase letters like `a`, `b`, `c`, `d`.
- `source` must be an object with `type`, `document`, `section`, and optional `reference`.
- Link to relevant flashcards through `relatedFlashcardIds` when possible.
- Set `reviewStatus` to `draft`.
- Do not use trick wording.

Schema:
[
  {
    "id": "quiz-can-001",
    "topicId": "can",
    "questionType": "single-choice",
    "questionEn": "Question in English",
    "questionVi": "Vietnamese translation",
    "options": [
      { "id": "a", "text": "Option A" },
      { "id": "b", "text": "Option B" },
      { "id": "c", "text": "Option C" },
      { "id": "d", "text": "Option D" }
    ],
    "correctOptionIds": ["a"],
    "explanationVi": "Why the answer is correct",
    "difficulty": "easy",
    "relatedFlashcardIds": ["can-term-001"],
    "source": {
      "type": "technical_document",
      "document": "CAN Overview",
      "section": "Physical layer",
      "reference": "content-source/CAN/CAN-overview.md"
    },
    "reviewStatus": "draft"
  }
]

Topic ID:
[PASTE TOPIC ID]

Source data:
[PASTE SOURCE DATA HERE]

Return JSON only.
```

## 7. Prompt — Review and Correct JSON

```text
You are a senior Automotive Engineering reviewer.

Review the supplied content against the source material and the project schema.

Check:
- Technical accuracy.
- Valid `cardType` values.
- Valid `source` object format.
- Unique IDs.
- Valid topic references.
- Exactly one correct answer in single-choice quiz questions.
- Supported option IDs and references.
- Clear Vietnamese explanations.
- No unsupported claims.

Return:
{
  "correctedItems": [],
  "reviewIssues": [],
  "approvalRecommendation": "approved|reviewed|needs-review"
}

Source data:
[PASTE SOURCE DATA]

Content JSON:
[PASTE JSON]
```

## 8. Recommended Workflow

1. Choose the topic.
2. Draft or update source notes.
3. Generate 10–20 flashcards.
4. Review and clean the generated output.
5. Generate quiz items from reviewed flashcards and source content.
6. Validate JSON with the local script.
7. Mark reviewed items as `approved` only after manual inspection.
8. Commit changes to GitHub.

## 9. Validation Checklist

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

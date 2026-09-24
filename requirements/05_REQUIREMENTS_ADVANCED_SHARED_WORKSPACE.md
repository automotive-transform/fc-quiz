# Automotive Transform Flashcard App
# Advanced Requirements — Shared GitHub Content Workspace

**Document type:** Advanced Product + Content Management Requirements  
**Version:** 1.0  
**Date:** 2026-09-24  
**Status:** Proposed baseline

---

## 1. Purpose

This document defines the advanced requirements for expanding the Automotive Transform Flashcard App so that:

1. Flashcards support both English vocabulary and Automotive technical learning.
2. New flashcard types can be added without redesigning the entire application.
3. Multiple contributors can add or update content through a shared GitHub repository.
4. Content creation remains simple and fast.
5. JSON content does not require a complex approval or certification workflow.
6. Basic automated validation prevents structural errors before deployment.
7. Requirements, designs, source material, application code, and content data remain clearly separated.

The system is intended for a free or near-zero-cost learning application running on desktop browsers and iOS Safari.

## 2. Product Vision

The application combines:

- English vocabulary learning
- Automotive terminology learning
- Technical concept learning
- Technical comparison learning
- Multiple-choice quizzes
- Local learner progress

The intended learning sequence is:

```text
Single Word → Phrase / Collocation → Technical Term → Abbreviation → Concept → Comparison → Quiz
```

The application must not force every learning item into the same format. A simple English word and a complex Automotive concept need different fields and presentation styles.

## 3. Scope

### 3.1 In scope

- Flashcard management
- Multiple flashcard types
- Topic-based content organization
- Shared GitHub repository
- Contributor workflow
- JSON-based content
- Lightweight validation
- Quiz content
- LocalStorage-based learning progress
- Static web deployment
- Requirements and design documentation
- Source traceability
- Duplicate detection
- Content indexing

### 3.2 Out of scope for the first version

- User accounts
- Login and authentication
- Online learner profiles
- Shared learner progress
- Backend database
- Complex content approval state machine
- Mandatory approval for every JSON item
- Paid AI API dependency
- Real-time collaborative editing
- Automatic technical certification of content
- Automatic guarantee of technical correctness

## 4. Product Principles

### PR-01 — Content creation first

A contributor should be able to create a new Flashcard or Quiz item quickly without completing a long administrative workflow.

### PR-02 — GitHub as the content source of truth

The GitHub repository stores requirements, designs, source materials, Flashcards, Quizzes, validation scripts, and application code.

### PR-03 — Lightweight validation, not complex approval

The system shall validate structural correctness, but it shall not require:

```text
draft → reviewed → approved
```

as a mandatory state machine.

A contributor may create content directly. Optional human review can be performed when useful, especially for safety-critical or highly specialized topics, but it is not a required JSON gate.

### PR-04 — Separate content from application code

Contributors who only create learning content should not need to modify React or TypeScript code.

### PR-05 — Expandable data model

The schema must support additional fields and card types in the future without breaking existing content.

### PR-06 — Source traceability

Each content item should identify its source or origin. Source traceability is for context and maintenance, not for creating a complex approval process.

## 5. Users and Roles

### 5.1 Learner

A learner can browse topics, study Flashcards, filter Flashcards, answer Quizzes, review incorrect answers, and store personal progress locally. A learner does not need a GitHub account or application account.

### 5.2 Contributor

A contributor can add Flashcards, add Quizzes, update existing content, add source references, run lightweight validation, and commit or push content. Depending on repository permissions, the contributor may edit directly, use a branch, or open a pull request.

### 5.3 Maintainer

A maintainer manages repository structure, documentation, build configuration, deployment, validation scripts, content consistency, and optional review or cleanup. The maintainer is not required to manually approve every JSON item.

## 6. Flashcard Type Requirements

The system shall support the following initial Flashcard types.

### FC-01 — Single Word

A single English word.

Examples:

- Detect
- Robust
- Transmit
- Receive
- Fault
- Hazard
- Exposure
- Verify

Recommended fields:

- `term`
- `partOfSpeech`
- `pronunciation`
- `definitionEn`
- `explanationVi`
- `wordFamily`
- `synonyms`
- `antonyms`
- `collocations`
- `exampleEn`
- `exampleVi`

The card should explain the normal English meaning and, when relevant, the Automotive context.

### FC-02 — Technical Term

A specialized Automotive or engineering term.

Examples:

- Functional Safety
- Differential Signaling
- Static Analysis
- Error Detection
- Common Mode Noise

Recommended fields:

- `term`
- `definitionEn`
- `explanationVi`
- `technicalContext`
- `exampleEn`
- `exampleVi`
- `relatedTerms`

### FC-03 — Phrase

A phrase or commonly used expression.

Examples:

- Noise immunity
- Risk reduction
- Error detection
- Bus access
- Fail-safe mechanism

Recommended fields:

- `term`
- `meaningEn`
- `explanationVi`
- `collocations`
- `exampleEn`
- `exampleVi`

### FC-04 — Abbreviation

An acronym or abbreviated technical term.

Examples:

- CAN
- ECU
- ASIL
- RTE
- CRC
- ACK
- BSW
- SWC

Recommended fields:

- `term`
- `fullForm`
- `definitionEn`
- `explanationVi`
- `technicalContext`
- `relatedTerms`

### FC-05 — Concept

A technical idea or mechanism.

Examples:

- CAN Arbitration
- ASIL Decomposition
- RTE Communication
- Differential Signaling
- Bit Stuffing

Recommended fields:

- `term`
- `definitionEn`
- `explanationVi`
- `howItWorks`
- `keyPoints`
- `exampleEn`
- `relatedTerms`

### FC-06 — Comparison

A card that compares two or more related items.

Examples:

- CAN vs LIN
- AUTOSAR Classic vs Adaptive
- Verification vs Validation
- FMEA vs FTA
- CPU vs GPU vs NPU

Recommended fields:

- `term`
- `comparisonItems`
- `comparisonTable`
- `explanationVi`
- `keyDifferences`
- `whenToUse`
- `relatedTerms`

Comparison is a Flashcard type, not a separate top-level application module.

## 7. Future-Extensible Flashcard Types

The data model should allow future types such as:

- `grammar_pattern`
- `collocation`
- `fill_in_blank`
- `scenario`
- `code_example`
- `diagram`
- `troubleshooting`
- `question_answer`
- `process_sequence`

Adding a new type should normally require updating the supported type list, defining optional fields, adding or updating the UI renderer, adding test data, and updating documentation. Existing card types must continue to work.

## 8. Common Flashcard Data Requirements

### 8.1 Required fields

Each Flashcard should contain:

- `id`
- `topicId`
- `cardType`
- `term`
- `explanationVi`
- `source`

At least one English learning field should be present:

- `definitionEn`
- `meaningEn`
- `descriptionEn`
- `questionPrompt`

### 8.2 Recommended fields

- `exampleEn`
- `exampleVi`
- `relatedTerms`
- `tags`
- `notes`
- `difficulty`
- `languageLevel`
- `createdBy`
- `createdAt`
- `updatedAt`

These fields should be optional unless the application specifically needs them.

### 8.3 Stable IDs

IDs should be unique, stable after publication, descriptive, and safe to reference from Quiz items.

Examples:

```text
can-word-001
can-term-001
can-phrase-001
can-abbreviation-001
can-concept-001
can-comparison-001
can-quiz-001
```

Contributors should not change an existing ID merely to improve its wording.

## 9. Source Requirements

Each item should include a source object or source string.

Recommended structure:

```json
{
  "source": {
    "type": "chatgpt_project",
    "document": "CAN - Overview",
    "section": "Physical Layer",
    "reference": "Optional source location"
  }
}
```

Possible source types include:

- `chatgpt_project`
- `personal_notes`
- `technical_document`
- `standard`
- `contributor_explanation`
- `external_reference`

The source field supports traceability, duplicate avoidance, maintenance, and investigation. It does not create a mandatory approval gate.

## 10. Quiz Requirements

### 10.1 Initial quiz format

The first version shall support single-choice quizzes.

Each quiz should contain:

- `id`
- `topicId`
- `questionType`
- `questionEn` or `questionVi`
- `options`
- `correctOptionId`
- `explanationVi`
- `source`

Recommended optional fields:

- `flashcardId`
- `difficulty`
- `tags`
- `questionContext`
- `relatedTerms`

### 10.2 Quiz rules

Validation should check that:

- At least two options exist.
- Option IDs are unique.
- `correctOptionId` matches one option.
- The quiz has a valid `topicId`.
- A referenced `flashcardId` exists when supplied.

Validation should not claim to determine technical correctness. That requires human judgment or an optional review process.

## 11. Workspace Organization

```text
automotive-transform-flashcards/
├── README.md
├── requirements/
│   ├── 01_PRODUCT_REQUIREMENTS.md
│   ├── 02_FUNCTIONAL_REQUIREMENTS.md
│   ├── 03_CONTENT_REQUIREMENTS.md
│   └── 04_REQUIREMENTS_ADVANCED_SHARED_WORKSPACE.md
├── designs/
│   ├── 01_SYSTEM_ARCHITECTURE.md
│   ├── 02_APPLICATION_DESIGN.md
│   ├── 03_DATA_MODEL_AND_JSON_SCHEMA.md
│   ├── 04_UI_UX_DESIGN.md
│   └── 05_CONTENT_WORKFLOW.md
├── content/
│   ├── source/
│   │   ├── CAN/
│   │   ├── AUTOSAR/
│   │   ├── MISRA-C/
│   │   ├── ISO-26262/
│   │   ├── ASPICE/
│   │   └── ADAS/
│   ├── flashcards/
│   └── quizzes/
├── public/
│   └── data/
├── scripts/
├── src/
├── docs/
└── .github/
    └── workflows/
```

`requirements/` describes what the product must do. `designs/` describes how it is implemented. `content/` contains source material and authored JSON. `docs/` contains contributor instructions. `scripts/` contains automated checks and content build utilities.

## 12. Shared GitHub Contribution Model

### 12.1 Main principle

The repository should allow multiple people to add content without requiring them to understand the entire application codebase.

A contributor who adds a CAN vocabulary card should normally modify only the relevant topic JSON and, optionally, a source file.

### 12.2 Recommended workflow

```text
Choose topic
    ↓
Search existing content
    ↓
Create or update JSON
    ↓
Run lightweight validation
    ↓
Commit changes
    ↓
Push to GitHub
    ↓
Build and deploy
```

### 12.3 Branch and pull request flexibility

The repository may support direct editing by trusted contributors, a shared content branch, feature branches, or pull requests. The project should not require a complex approval process for every JSON contribution.

Repository permissions may still protect application code and deployment configuration separately from content files.

### 12.4 Contributor responsibilities

A contributor should:

- Use the correct topic file.
- Use a unique ID.
- Select a supported `cardType`.
- Provide clear English and Vietnamese explanations.
- Add source information.
- Avoid duplicate cards.
- Run validation before pushing.

## 13. Validation Requirements

Validation is structural and operational, not a complex approval system.

### 13.1 Required automated checks

The validation process should check:

1. JSON syntax.
2. Required fields.
3. Supported `cardType` values.
4. Duplicate IDs.
5. Valid topic IDs.
6. Quiz option structure.
7. Valid quiz answer references.
8. Valid referenced Flashcard IDs when provided.
9. Basic data type consistency.

### 13.2 Optional checks

The project may later add duplicate term detection, similarity detection, missing translation detection, empty example detection, orphaned quiz detection, topic coverage reports, and broken source reference detection.

These checks should initially report warnings rather than block every contribution unless the error would break the build.

### 13.3 No mandatory approval field

The application must not require:

```json
{
  "status": "approved"
}
```

for a card to be displayed. An optional status field may exist for personal organization, but it must not be a mandatory deployment gate.

## 14. GitHub Actions Requirements

### 14.1 Validation workflow

The validation workflow should install dependencies, parse JSON content, run structural checks, report errors, and stop the build only for blocking structural errors.

### 14.2 Deployment workflow

The deployment workflow should run validation, build the web application, and publish the static output if validation succeeds.

### 14.3 Error messages

Errors should be understandable to non-programmer contributors, for example:

```text
Missing required field: topicId
Duplicate ID: can-word-001
Unsupported cardType: vocabulary_word
Invalid correctOptionId: E
```

## 15. Content Quality Guidance

The project should distinguish between structural quality and learning quality.

### 15.1 Structural quality

Can be checked automatically:

- Valid JSON
- Required fields
- Unique IDs
- Correct references
- Supported values

### 15.2 Learning quality

Usually requires human judgment:

- Technical accuracy
- Clear explanation
- Appropriate difficulty
- Useful examples
- Unambiguous quiz answers
- Correct Vietnamese translation
- Correct Automotive context

The system should not pretend that structural validation guarantees technical accuracy.

Optional informal review is encouraged for ISO 26262, ASPICE, safety-related concepts, ECU behavior, Automotive standards, and diagnostic or functional safety content. Optional review must not become a mandatory approval workflow for all JSON content.

## 16. Non-Functional Requirements

- The application should work on desktop browsers and iOS Safari.
- Content must be separated from application code.
- New card types and optional fields should be addable without rewriting existing JSON.
- Content should remain usable as plain JSON outside the application.
- The initial solution should use free or already available tools where practical.
- Learner progress should remain local to the browser.
- Contributors should understand repository structure and validation errors.

## 17. Acceptance Criteria

The requirements are considered implemented when:

1. The application supports all six initial Flashcard types.
2. Single-word cards can include part of speech and vocabulary-specific fields.
3. Technical terms and concepts can include technical explanations.
4. Comparison cards can represent differences between multiple items.
5. Quiz items can reference Flashcards.
6. Content is separated from requirements and design documents.
7. Contributors can add content by editing topic-level JSON files.
8. A contributor guide explains the basic workflow.
9. JSON validation detects structural errors.
10. No mandatory approval state is required.
11. The repository supports multiple contributors through GitHub permissions, branches, or direct editing.
12. Existing content remains compatible when optional fields are absent.
13. The application can be built and deployed without a backend database.
14. Learner progress remains local to the browser.

## 18. Recommended Implementation Order

### Phase 1 — Foundation

- Finalize repository structure.
- Define supported card types.
- Define the common JSON schema.
- Create contributor documentation.
- Implement JSON syntax and required-field validation.

### Phase 2 — Content expansion

- Add single-word cards.
- Add technical terms.
- Add phrases.
- Add abbreviations.
- Add concepts.
- Add comparison cards.
- Add topic-level quiz files.

### Phase 3 — Application support

- Add card type filtering.
- Add search.
- Add card type-specific rendering.
- Add related Flashcard links from quizzes.
- Add LocalStorage progress.

### Phase 4 — Collaboration improvements

- Add duplicate detection.
- Add reference validation.
- Add content index generation.
- Add optional warnings and reports.
- Improve GitHub Actions messages.

## 19. Final Decision

The project will use a simple shared-content model:

- GitHub is the shared workspace and source of truth.
- Contributors can create JSON directly.
- No complex approval workflow is required.
- Automated validation checks structure and references.
- Optional human review remains possible but is not mandatory.
- Flashcards support single words as well as technical and conceptual learning items.
- Requirements, designs, content, scripts, and contributor documentation are stored in separate directories.
- The system is designed to grow from a personal learning tool into a shared Automotive learning knowledge base.

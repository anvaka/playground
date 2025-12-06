# Chinese Flashcards

A **Vue 3 + Vite web app** for creating, studying, and managing Chinese language flashcards. It combines:

1. **Local Dictionary Lookup** — Parses CC-CEDICT (Chinese-English dictionary) and IDS (character decomposition) data files to provide instant word lookups
2. **AI-Powered Card Generation** — Uses LLMs (via `@anvaka/vue-llm`) to generate rich flashcard content including meaning, examples, memory stories, and image prompts
3. **Study Mode** — Flip cards (front: character + pinyin + hint → back: meaning, components, examples, mnemonic story)

## Architecture

```
User Input → SearchBar → Dictionary Lookup → LLM Generation → Card Storage
                                ↓
                        Display CardView / TriviaCardView
```

## Key Components

| File | Purpose |
|------|---------|
| `App.vue` | Orchestrates search, card display, navigation, and study mode |
| `SearchBar.vue` | Auto-complete search across Chinese, pinyin, and English |
| `CardView.vue` | Displays vocabulary/phrase cards with flip animation |
| `TriviaCardView.vue` | Q&A format for language/culture questions |
| `BaseCard.vue` | Reusable flip-card container with edit mode |

## Services

| Service | Responsibility |
|---------|----------------|
| `dictionary.js` | Parses CEDICT + IDS files; searches by Chinese/pinyin/English; ranks by character frequency |
| `llm.js` | Builds prompts for vocabulary, phrase, and trivia cards; validates LLM JSON responses |
| `storage.js` | localStorage CRUD for cards; backup/restore; placeholder for Google Sheets sync |
| `imageGen.js` | Image generation (DALL-E/Stability) and IndexedDB storage |

## Data Flow

1. **Search** — User types → debounced dictionary search → results ranked by match quality + character frequency
2. **Select/Create** — Clicking a result either opens an existing saved card or creates a stub for a new one
3. **Generate** — "Generate with AI" sends dictionary context to LLM → receives structured JSON (pinyin, meaning, components, examples, memory story, image prompt)
4. **Study** — Cards are shown one at a time; click to flip; arrow keys or shuffle to navigate

## Card Types

- **Vocabulary** — Single character/word with standard flashcard fields
- **Phrase** — Chinese sentence/expression with word-by-word breakdown  
- **Trivia** — Q&A about Chinese language/culture/etymology

## Storage

- **localStorage** — Primary storage for all cards
- **Google Sheets** — Planned integration (placeholders exist)
- **IndexedDB** — For generated images

## Key Features

- Smart search auto-detects Chinese vs pinyin vs English
- Results prioritized by exact match → prefix match → partial match, then by character frequency
- Freeform queries (no dictionary match) trigger AI to determine card type automatically
- Cards can be shuffled for random study order
- Keyboard navigation (arrows, Escape)

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

# Project Plan: Chinese Flashcard Generator (Simplified)

## 1. Overview
- **Stack:** Vue 3 + Vite, vanilla JS, minimal CSS
- **Philosophy:** No state management libraries, no CSS frameworks. Just clean, readable code.
- **Storage:** Google Sheets (card data) + Google Drive (images). LocalStorage as fallback/cache.

## 2. Core Features

### A. Create Flashcard
1. User enters a word (Chinese or English)
2. App looks up CEDICT + IDS data locally
3. LLM generates card content using your prompt template
4. User reviews/edits, then saves

### B. Browse & Study
1. Load saved cards from Google Sheets
2. **Study Mode:** Show front, click to reveal back (simple flip)
3. **Browse Mode:** List view of all cards with search/filter

### C. Future-Ready
- Checkbox selection for printing (structure in place, implement later)

## 3. Simplified Architecture

```
flash-cards/
├── index.html          # Single page app entry
├── src/
│   ├── main.js         # App initialization
│   ├── App.vue         # Root component (simple)
│   ├── components/
│   │   ├── SearchBar.vue
│   │   ├── FlashCard.vue      # Front/back flip card
│   │   ├── CardEditor.vue     # Edit before saving
│   │   ├── CardList.vue       # Browse saved cards
│   │   ├── StudyMode.vue      # Practice flashcards
│   │   └── Settings.vue       # API keys modal
│   ├── services/
│   │   ├── dictionary.js      # Parse & search CEDICT/IDS
│   │   ├── llm.js             # OpenAI/Anthropic calls
│   │   ├── imageGen.js        # DALL-E/Stability calls
│   │   └── storage.js         # Google Sheets/Drive + localStorage
│   └── style.css              # Minimal, clean styles
├── public/
│   └── data/
│       ├── cedict.txt
│       └── ids.txt
└── vite.config.js
```

## 4. Data Structures

### Flashcard Object
```js
{
  id: "uuid-here",
  created: "2025-11-26T...",
  
  // Front
  character: "杯",
  pinyin: "bēi",
  microClue: "drink holder",
  imageUrl: null,  // filled when generated
  
  // Back
  meaning: "cup; trophy cup; classifier for glasses/cups of liquid",
  components: "木 (wood) + 不 (not) — a wooden vessel you can't do without",
  examples: [
    { zh: "一杯水", pinyin: "yī bēi shuǐ", en: "a glass of water" },
    { zh: "干杯！", pinyin: "gān bēi!", en: "Cheers!" }
  ],
  memoryStory: "A wooden (木) cup you absolutely can NOT (不) live without...",
  
  // Meta
  imagePrompt: "A glowing glass cup on a futuristic bar counter...",
  rawDictEntry: "杯 [bei1] /cup/trophy cup/...",
  rawIdsEntry: "杯 ⿰木不"
}
```

### Google Sheet Structure
| id | created | character | pinyin | microClue | imageUrl | meaning | components | examples (JSON) | memoryStory | imagePrompt |

## 5. LLM Prompt Template

```
You are a Chinese language learning assistant creating a flashcard for: "{word}"

DICTIONARY DEFINITION:
{cedictEntry || "Not found in dictionary"}

COMPONENT BREAKDOWN:
{idsEntry || "Not available"}

Generate a flashcard with the following sections:

**FRONT (keep concise):**
- Character: {word}
- Pinyin: [provide accurate pinyin with tone marks]
- Micro-clue: [3-6 words max that hint at meaning without giving it away completely]

**BACK:**
- Meaning: [full English definition, clear and comprehensive]
- Components: [explain the radicals/components and their meanings - use the CHISE data provided above if available]
- Examples: [2-3 example sentences in Chinese with pinyin and English translations]
- Memory story: [create a short, funny or shocking micro-story to help remember components, meaning and tone]

**IMAGE PROMPT:**
[Describe a simple, clear image that visually represents the word's meaning. No text in image. Focus on concrete, memorable visual elements. Keep under 50 words. Sci-fi futuristic style with networks is a plus]

Respond with valid JSON matching this schema:
{
  "pinyin": "...",
  "microClue": "...",
  "meaning": "...",
  "components": "...",
  "examples": [{"zh": "...", "pinyin": "...", "en": "..."}],
  "memoryStory": "...",
  "imagePrompt": "..."
}
```

## 6. UI Flow

```
┌─────────────────────────────────────────────┐
│  [Settings ⚙️]              Chinese Cards   │
├─────────────────────────────────────────────┤
│                                             │
│    ┌─────────────────────────────────────┐  │
│    │  🔍 Enter word (中文/English)       │  │
│    └─────────────────────────────────────┘  │
│                                             │
│    [Create New]    [Browse Cards]   [Study] │
│                                             │
└─────────────────────────────────────────────┘
```

**Create Flow:**
1. Enter word → Show dictionary matches (if any)
2. Click "Generate" → Loading spinner → Show card preview
3. Edit any field inline if needed
4. "Generate Image" button (optional, costs $)
5. "Save to Google" button

**Study Flow:**
1. Shows cards one at a time (front only)
2. Click card to flip and reveal back
3. "Next" / "Previous" navigation
4. Simple — no spaced repetition (keep it minimal)

**Browse Flow:**
1. Grid/list of all saved cards
2. Search box to filter
3. Click card to view full details
4. Checkbox for future "print selection" feature

## 7. Implementation Phases

### Phase 1: Foundation
1. Vite + Vue 3 project setup (minimal config)
2. Dictionary service: parse CEDICT and IDS files
3. Basic search functionality
4. Minimal CSS styling

### Phase 2: LLM Integration
1. Settings component (API key storage in localStorage)
2. LLM service with your prompt template
3. Card generation flow
4. CardEditor component for review/edit

### Phase 3: Storage & Retrieval
1. Google OAuth setup (client-side)
2. Save cards to Google Sheets
3. Load cards from Google Sheets
4. LocalStorage cache for offline access

### Phase 4: Study & Browse
1. CardList component (browse all cards)
2. StudyMode component (flip through cards)
3. Search/filter functionality

### Phase 5: Images (Optional/On-demand)
1. Image generation service
2. Upload to Google Drive
3. Link image URL in sheet

---

## 8. Key Simplifications from Original Plan

| Removed | Reason |
|---------|--------|
| Web Worker for dictionary | Files are small enough, async fetch + simple parse is fine |
| Pinia/Vuex | Just use Vue's reactive() and pass props |
| TypeScript | Plain JS keeps it simpler |
| Tailwind | Minimal custom CSS (~100 lines) |
| Zod validation | Simple manual checks for LLM response |

---

## 9. Files to Create (in order)

1. `vite.config.js` — minimal config
2. `index.html` — app shell
3. `src/style.css` — clean, minimal styles
4. `src/services/dictionary.js` — CEDICT/IDS parser
5. `src/services/llm.js` — LLM API calls
6. `src/services/storage.js` — Google + localStorage
7. `src/services/imageGen.js` — Image generation
8. `src/components/Settings.vue`
9. `src/components/SearchBar.vue`
10. `src/components/FlashCard.vue`
11. `src/components/CardEditor.vue`
12. `src/components/CardList.vue`
13. `src/components/StudyMode.vue`
14. `src/App.vue` — ties it together
15. `src/main.js` — bootstrap

---

## 10. Getting Started

To begin implementation, tell an agent:

> "Execute Phase 1 of the Flashcard plan in PLAN.md"

This will set up the project foundation with dictionary parsing.

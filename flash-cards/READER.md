# Reader Feature Design Document

## Problem Statement

The flashcard app currently teaches vocabulary in isolation. Users learn individual characters and words, but lack a bridge to practical reading. The **Reader** feature addresses this by allowing users to:

1. Paste any text (English or Chinese)
2. Have it adapted to their proficiency level
3. Read it with interactive word-by-word annotations
4. Save interesting words to their flashcard collection

This transforms passive vocabulary memorization into active, contextual learning.

---

## Core Concept

### What the Reader Does

1. **User pastes text** – any source: news articles, Project Gutenberg, personal notes, etc.
2. **Picks target proficiency level** – Beginner (HSK 1-2), Intermediate (HSK 3-4), Advanced (HSK 5-6), or Natural (no constraints)
3. **App chunks text into pages** – ~300 characters per page, breaking at sentence boundaries
4. **Each page is translated/adapted on-demand** – only when user navigates to it (saves API costs)
5. **Text is segmented into clickable words** – using `pinyin-pro` library (lazy-loaded)
6. **User taps any word** – sees mini-card with pinyin and meaning
7. **One-tap save** – adds word to user's collection, tagged with book name

### Key Design Decisions

| Decision | Reasoning |
|----------|-----------|
| **IndexedDB storage** | Books can be large; localStorage is limited to ~5MB |
| **Page-based chunking** | Never overwhelm LLM; natural reading flow; easy progress tracking |
| **Lazy translation** | Only process the page being viewed; saves API costs |
| **Store offsets, not copies** | Pages reference source text via `start`/`end`; reconstruction is trivial |
| **Ruby tags for pinyin** | Native browser support, accessible, hideable via CSS |
| **Wrap ruby in clickable spans** | Enables word-level click/tap targeting |
| **Tag saved words with book name** | Easy filtering: "show all words from 小王子" |

---

## User Flow
┌─────────────────────────────────────────────┐
│  DeckBrowser now shows:                     │
│                                             │
│  [Your Cards] [HSK Decks] [Games] [Reader]  │
└─────────────────────────────────────────────┘
                      ↓ click Reader
┌─────────────────────────────────────────────┐
│  Reader Home                                │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ + New Book                          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  My Books:                                  │
│  [小王子 - Chapter 1] [Page 3/12] [HSK2]    │
│  [Tech Article]       [Page 1/5]  [HSK3]    │
└─────────────────────────────────────────────┘
                      ↓ click "New Book"
┌─────────────────────────────────────────────┐
│  Create New Book                            │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Paste your text here...             │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Target Level: [HSK 1] [HSK 2] [Natural]    │
│                                             │
│  [Generate Story Instead...]                │
│                                             │
│  [Create Book]                              │
└─────────────────────────────────────────────┘
                      ↓ reading view
┌─────────────────────────────────────────────┐
│  ← Back          小王子 Chapter 1    2/12 → │
├─────────────────────────────────────────────┤
│                                             │
│  小王子住在一个很小的星球上。               │
│  ───────                                    │
│     ↑ clickable word                        │
│                                             │
│  ┌─────────────────────┐                   │
│  │ 星球 xīng qiú       │ ← floating card   │
│  │ planet, celestial   │                   │
│  │ [Add] [Full Card]   │                   │
│  └─────────────────────┘                   │
│                                             │
│  [Show Pinyin] [Show Original]              │
└─────────────────────────────────────────────┘
## Proficiency Levels

| Level ID | Label | Description |
|----------|-------|-------------|
| `hsk1-2` | Beginner | ~300 words vocabulary, simple sentences |
| `hsk3-4` | Intermediate | ~1200 words, can use some idioms |
| `hsk5-6` | Advanced | ~2500+ words, natural but clear |
| `natural` | No Adjustment | Translate naturally (EN→ZH) or skip LLM entirely (ZH→ZH, just segment) |

---

## Data Model

### Book Object (stored in IndexedDB)

```js
{
  id: "uuid-string",
  created: "2025-12-03T10:30:00.000Z",
  title: "小王子 Chapter 1",           // User-editable, auto-generated from first line if empty
  sourceText: "Full original text...", // The complete pasted text
  sourceLanguage: "en" | "zh",         // Detected or user-specified
  targetLevel: "hsk1-2" | "hsk3-4" | "hsk5-6" | "natural",
  pages: [
    {
      start: 0,                        // Character offset in sourceText (inclusive)
      end: 312,                        // Character offset (exclusive)
      translated: null,                // Filled when page is first viewed
      segments: null                   // Filled after translation, array of word objects
    },
    {
      start: 312,
      end: 598,
      translated: "小王子住在一个很小的星球上...",
      segments: [
        { text: "小王子", pinyin: "xiǎo wáng zǐ" },
        { text: "住", pinyin: "zhù" },
        { text: "在", pinyin: "zài" },
        // ... more segments (meanings looked up from CEDICT at render time)
      ]
    }
  ],
  currentPage: 0                       // Reading progress (0-indexed)
}
```

### Segment Object

```js
{
  text: "星球",           // The Chinese word/character
  pinyin: "xīng qiú"     // Pinyin with tone marks
  // Note: meaning is looked up from CEDICT at render time, not stored
}
```

### Saved Card Tagging

When a word is saved from the Reader, it gets tagged:

```js
{
  ...cardData,
  tags: ['user', 'reader', 'book:小王子 Chapter 1'],
  sourceBookId: 'book-uuid-123'  // Optional: for "show all words from this book"
}
```

---

## Page Chunking Algorithm

**Target**: ~300 Chinese characters per page (or ~200 English words for source text)

**Constraints**:
- Never break mid-sentence
- Store offsets to reconstruct from source

**Algorithm**:

```js
const SENTENCE_ENDINGS = /[。！？.!?\n]+/g
const TARGET_PAGE_SIZE = 300  // characters for Chinese, words for English

function chunkIntoPages(text, isEnglish = false) {
  const pages = []
  
  // Split into sentences
  const sentences = []
  let lastEnd = 0
  
  for (const match of text.matchAll(SENTENCE_ENDINGS)) {
    const sentenceEnd = match.index + match[0].length
    sentences.push({
      text: text.slice(lastEnd, sentenceEnd),
      start: lastEnd,
      end: sentenceEnd
    })
    lastEnd = sentenceEnd
  }
  
  // Don't forget trailing text without sentence ending
  if (lastEnd < text.length) {
    sentences.push({
      text: text.slice(lastEnd),
      start: lastEnd,
      end: text.length
    })
  }
  
  // Group sentences into pages
  let currentPage = { start: 0, end: 0 }
  let currentSize = 0
  
  for (const sentence of sentences) {
    const sentenceSize = isEnglish 
      ? sentence.text.split(/\s+/).length  // word count
      : sentence.text.length               // character count
    
    if (currentSize + sentenceSize > TARGET_PAGE_SIZE && currentSize > 0) {
      // Start new page
      pages.push(currentPage)
      currentPage = { start: sentence.start, end: sentence.end }
      currentSize = sentenceSize
    } else {
      // Add to current page
      currentPage.end = sentence.end
      currentSize += sentenceSize
    }
  }
  
  // Don't forget last page
  if (currentPage.end > currentPage.start) {
    pages.push(currentPage)
  }
  
  // Add null fields for translation results
  return pages.map(p => ({
    ...p,
    translated: null,
    segments: null
  }))
}
```

---

## LLM Prompt Template

```xml
You are translating text for a Chinese language learner at {level} level.

<previousContext>
{Previous page's last 2 sentences, or empty if first page}
</previousContext>

<textToTranslate>
{Current page text from sourceText.slice(page.start, page.end)}
</textToTranslate>

<nextContext>
{Next page's first 2 sentences, or empty if last page}
</nextContext>

Guidelines for {level}:
- hsk1-2 (Beginner): Use only basic vocabulary (~300 most common words). Simple sentence structures. Short sentences.
- hsk3-4 (Intermediate): Intermediate vocabulary is acceptable. Can use common idioms with enough context.
- hsk5-6 (Advanced): Natural Chinese, but avoid obscure literary expressions or classical Chinese.
- natural: Translate naturally without vocabulary constraints. Prioritize accuracy and fluency.

IMPORTANT: Translate ONLY the text within <textToTranslate> tags. Use the context tags only for understanding flow and consistency.

Return the Chinese translation only, no explanations or tags.
```

---

## Segmentation with pinyin-pro

The `pinyin-pro` library handles Chinese word segmentation and pinyin annotation.

**Why lazy load**: The library requires loading a dictionary (`@pinyin-pro/data/complete`), which is substantial. We only load it when the Reader is first used.

**Lazy loading** (only load when Reader is used):

```js
let segmentFn = null

async function loadSegmenter() {
  if (segmentFn) return segmentFn
  
  const [{ segment, addDict }, CompleteDict] = await Promise.all([
    import('pinyin-pro'),
    import('@pinyin-pro/data/complete').then(m => m.default)
  ])
  
  addDict(CompleteDict)
  segmentFn = segment
  return segmentFn
}
```

**Segmentation function**:

The `segment()` function returns an array of objects with `origin` (character) and `result` (pinyin):

```js
// segment('小明') returns:
// [
//   { origin: "小", result: "xiǎo" },
//   { origin: "明", result: "míng" }
// ]
```

We transform this to our simpler format and look up meanings from CEDICT at render time (not stored):

```js
async function segmentText(chineseText) {
  const segment = await loadSegmenter()
  
  // Get word-segmented array with pinyin
  const result = segment(chineseText)
  
  // Transform to our format: just text and pinyin
  // Meanings are looked up from CEDICT at render time, not stored
  return result.map(item => ({
    text: item.origin,
    pinyin: item.result
  }))
}
```

**Why not store meanings**: We already have CEDICT loaded in the dictionary service. Looking up meanings at render time:
- Keeps stored data smaller
- Ensures definitions stay up-to-date if dictionary is updated
- Reuses existing `lookupChinese()` and `formatDefinitions()` functions

---

## UI Rendering with Ruby Tags

### HTML Structure

Each word is wrapped in a clickable span containing a ruby element:

```html
<div class="reading-text" :class="{ 'hide-pinyin': !showPinyin }">
  <span class="word" data-index="0">
    <ruby>小王子<rt>xiǎo wáng zǐ</rt></ruby>
  </span>
  <span class="word" data-index="1">
    <ruby>住<rt>zhù</rt></ruby>
  </span>
  <span class="word" data-index="2">
    <ruby>在<rt>zài</rt></ruby>
  </span>
  <!-- ... -->
</div>
```

### Rendering Function

```js
function renderSegments(segments) {
  return segments.map((seg, i) => 
    `<span class="word" data-index="${i}">` +
      `<ruby>${escapeHtml(seg.text)}<rt>${escapeHtml(seg.pinyin)}</rt></ruby>` +
    `</span>`
  ).join('')
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
```

### CSS for Interactivity

```css
.reading-text {
  font-size: 1.4rem;
  line-height: 2.5;  /* Extra space for ruby annotations */
  text-align: justify;
}

.word {
  cursor: pointer;
  border-radius: 2px;
  padding: 0 1px;
  transition: background 0.15s;
}

.word:hover {
  background: rgba(102, 126, 234, 0.1);  /* primary color with transparency */
}

.word.active {
  background: rgba(102, 126, 234, 0.2);
}

/* Toggle pinyin visibility */
.hide-pinyin rt {
  visibility: hidden;
}

/* Ruby styling */
ruby {
  ruby-align: center;
}

rt {
  font-size: 0.5em;
  color: var(--text-muted);
}
```

### Click Handling with Event Delegation

```vue
<template>
  <div 
    class="reading-text" 
    :class="{ 'hide-pinyin': !showPinyin }"
    v-html="renderedText"
    @click="handleWordClick"
  />
  
  <!-- Mini-card tooltip -->
  <div 
    v-if="activeWord" 
    class="mini-card"
    :style="miniCardPosition"
  >
    <div class="mini-card-char">{{ activeWord.text }}</div>
    <div class="mini-card-pinyin">{{ activeWord.pinyin }}</div>
    <div class="mini-card-meaning">{{ activeWord.meaning }}</div>
    <div class="mini-card-actions">
      <button @click="addToCollection(activeWord)">+ Add</button>
      <button @click="openFullCard(activeWord)">Details</button>
    </div>
  </div>
</template>

<script setup>
function handleWordClick(e) {
  const wordEl = e.target.closest('.word')
  if (!wordEl) {
    activeWord.value = null
    return
  }
  
  const index = parseInt(wordEl.dataset.index)
  const segment = currentPage.value.segments[index]
  
  // Position tooltip near the clicked word
  const rect = wordEl.getBoundingClientRect()
  miniCardPosition.value = {
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`
  }
  
  activeWord.value = segment
}
</script>
```

---

## IndexedDB Storage Service

### File: `src/services/books.js`

```js
const DB_NAME = 'flashcards-reader'
const DB_VERSION = 1
const STORE_NAME = 'books'

let db = null

async function openDB() {
  if (db) return db
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }
    
    request.onupgradeneeded = (e) => {
      const database = e.target.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

export async function saveBook(book) {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(book)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(book)
  })
}

export async function getBook(id) {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || null)
  })
}

export async function getAllBooks() {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

export async function deleteBook(id) {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export function generateBookId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
```

---

## Component Structure

```
src/
├── components/
│   └── reader/
│       ├── ReaderHome.vue       # List books, "New Book" button
│       ├── BookCreator.vue      # Paste text, pick level, create book
│       ├── ReadingView.vue      # Main reading interface
│       └── MiniCard.vue         # Word tooltip component
├── composables/
│   └── useReader.js             # Book state, page navigation, translation
└── services/
    └── books.js                 # IndexedDB operations
```

---

## User Flow

```
┌─────────────────────────────────────────────────────────────┐
│  DeckBrowser (home)                                         │
│                                                             │
│  [Your Cards]  [HSK Decks]  [Games]  [Reader] ← NEW         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ click Reader
┌─────────────────────────────────────────────────────────────┐
│  ReaderHome                                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  + New Book                                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  My Books:                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📖 小王子 Chapter 1     Page 3/12    HSK 1-2        │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📖 Tech Article         Page 1/5     HSK 3-4        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ click "+ New Book"
┌─────────────────────────────────────────────────────────────┐
│  BookCreator                                                │
│                                                             │
│  Title (optional):                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ The Little Prince                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Paste your text:                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ The little prince lived on a tiny planet...         │   │
│  │                                                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Target Level:                                              │
│  (•) Beginner (HSK 1-2)                                    │
│  ( ) Intermediate (HSK 3-4)                                │
│  ( ) Advanced (HSK 5-6)                                    │
│  ( ) Natural (no adjustment)                               │
│                                                             │
│  [Cancel]                              [Create Book]        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ click "Create Book"
┌─────────────────────────────────────────────────────────────┐
│  ReadingView                                                │
│                                                             │
│  ← Back        The Little Prince              1/12 →       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   xiǎo wáng zǐ  zhù   zài   yí gè  hěn xiǎo de xīng qiú   │
│     小王子      住    在    一个    很小的    星球         │
│                 ─────                                       │
│                   ↑ user taps here                         │
│                                                             │
│  ┌────────────────────────┐                                │
│  │ 住  zhù                │ ← mini-card tooltip            │
│  │ to live; to stay       │                                │
│  │                        │                                │
│  │ [+ Add]  [Details]     │                                │
│  └────────────────────────┘                                │
│                                                             │
│  每天他都要给火山清理。                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Show Pinyin: ON]    [Show Original: OFF]                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Core Infrastructure
1. Create `src/services/books.js` – IndexedDB CRUD operations
2. Create `src/composables/useReader.js` – book state management
3. Add page chunking logic

### Phase 2: UI Components  
4. Create `src/components/reader/ReaderHome.vue` – book list
5. Create `src/components/reader/BookCreator.vue` – new book form
6. Create `src/components/reader/ReadingView.vue` – reading interface
7. Create `src/components/reader/MiniCard.vue` – word tooltip

### Phase 3: Integration
8. Add "Reader" tile to `DeckBrowser.vue`
9. Add reader routes to `App.vue`
10. Implement translation with LLM (reuse existing `@anvaka/vue-llm`)
11. Implement segmentation with `pinyin-pro` (lazy load)

### Phase 4: Polish
12. Add "Save to collection" with book tagging
13. Add "Show Original" toggle
14. Add reading progress persistence
15. Handle edge cases (empty text, LLM errors, etc.)

---

## Dependencies

**Existing (already in project)**:
- Vue 3
- `@anvaka/vue-llm` – LLM provider management
- Dictionary service (`src/services/dictionary.js`)

**New (to add)**:
- `pinyin-pro` – Chinese segmentation and pinyin annotation (lazy-loaded)
- `@pinyin-pro/data` – Dictionary data for accurate segmentation (lazy-loaded)

```bash
npm install pinyin-pro @pinyin-pro/data
```

---

## Open Questions / Future Enhancements

1. **Generate content**: "Write a story about [topic] at HSK 2 level" – LLM generates practice material
2. **Import from URL**: Paste a link → fetch content → create book
3. **Sentence-by-sentence mode**: Translate one sentence at a time for more interactive experience
4. **Mixed difficulty mode**: "HSK 2 but keep 10% harder words for challenge"
5. **Audio playback**: Read the page aloud with TTS
6. **Export book**: Download translated book as PDF/text
7. **Shared books**: Share books with other users via export/import

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| LLM translation fails | Show error, offer retry button, keep original text visible |
| Segmentation fails | Fall back to character-by-character display |
| IndexedDB unavailable | Fall back to in-memory storage with warning |
| Empty text pasted | Disable "Create Book" button, show hint |
| Very long text (>50 pages) | Warn user, suggest splitting into chapters |

---

## Performance Considerations

1. **Lazy translation**: Only translate pages when viewed
2. **Lazy loading pinyin-pro**: ~100KB, only load when Reader is first opened
3. **Debounce saves**: Don't save to IndexedDB on every keystroke
4. **Virtual scrolling**: Not needed for ~300 char pages, but consider for future
5. **Cache dictionary lookups**: Already implemented in dictionary service

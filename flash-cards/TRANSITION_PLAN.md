# Transition Plan: Markdown-Based Card System

This document outlines the plan to transition from the current JSON-structured flashcard system to a markdown-based format. The new design prioritizes streaming LLM output, user editability, flexible content structure, and a chat-based interaction model.

## Current State Summary

### Storage
- Cards stored in localStorage as JSON objects (`flashcards_saved_cards` key)
- Images stored in IndexedDB (`flashcards-images` database)
- Card structure: rigid schema with fields like `character`, `pinyin`, `meaning`, `examples`, `memoryStory`, etc.
- Three card types: `vocabulary`, `phrase`, `trivia` - each with slightly different required fields

### Card Generation
- LLM prompts in `src/services/llm.js` request JSON responses
- `buildPrompt()` for dictionary-matched words, `buildFreeformPrompt()` for freeform input
- Response parsed with `parseResponse()`, validated with `validateCardData()`
- Common failure: JSON parse errors when LLM produces malformed output

### Card Rendering
- `CardView.vue` handles vocabulary/phrase cards with edit panel
- `TriviaCardView.vue` handles trivia cards (read-only)
- `BaseCard.vue` provides flip animation, image display, action bar
- Edit mode: form-based with individual input fields per property
- No ability to partially regenerate or chat about card content

### Image Handling
- Single image per card, stored by card ID in IndexedDB
- Generated via OpenAI gpt-image-1 API
- `imagePrompt` field stores the prompt text
- `imageUrl` field unused (legacy), actual data in IndexedDB

---

## Target Design

### Card Format: Markdown
Cards become markdown documents with structural conventions:

```markdown
#Front
跑步 (pǎo bù)

##Hint
*legs moving, heart pumping*

#Back
![A person sprinting through a futuristic city](card://abc123/img/1)

## Examples
- 我每天早上跑步。(Wǒ měitiān zǎoshang pǎobù.) — I run every morning.

## Related
- 走路 (zǒulù) — to walk

## Meaning
to run; to jog

{{components:跑步}}
```

### Key Changes

1. **Content as markdown string** instead of structured JSON fields
2. **Multiple images** supported via `card://cardId/img/N` URLs
3. **Streaming-friendly** - content renders as it arrives
4. **User-editable** - raw markdown editor available
5. **Progressive reveal** handled by viewer preferences, not content structure
6. **Components auto-expanded** from local dictionary at render time
7. **Chat system** for conversational refinement without affecting card content

---

## Implementation Phases

### Phase 1: Core Markdown Card Infrastructure ✅ COMPLETE

**Goal**: Replace JSON card storage with markdown format, basic rendering.

**Status**: Completed December 2024

**What was built**:
- `src/services/markdownStorage.js` - New card storage with markdown content
- `src/services/cardMarkdown.js` - Markdown parsing/rendering using `marked` library
- `src/components/MarkdownCardEditor.vue` - GitHub-style Write/Preview editor
- `src/composables/useMarkdownCardGeneration.js` - Streaming LLM generation
- Updated `src/App.vue` - Simplified UI focused on card creation/editing

**Key decisions**:
- No flip animation needed - this is a card design view, not SRS review
- Used `marked` library for markdown rendering
- GitHub-style Write/Preview tabs for editing
- Auto-save after regeneration
- Streaming display using vue-llm `client.stream()` callback API

#### 1.1 Storage Changes (`src/services/markdownStorage.js`) ✅

Current card structure:
```javascript
{
  id, created, type, tags,
  character, pinyin, microClue, imageUrl, translation,
  meaning, components, examples, relatedWords, memoryStory,
  imagePrompt, rawDictEntry, rawIdsEntry
}
```

New card structure:
```javascript
{
  id: string,
  created: string,
  tags: string[],
  content: string,  // markdown content
  character: string // kept for indexing/search (extracted from #Front)
}
```

Tasks:
- Create `createMarkdownCard(content, metadata)` function ✅
- Create `parseCardFront(markdown)` to extract character/pinyin for indexing ✅
- Update `saveCard()` to handle new format ✅
- Update `getLocalCards()`, `searchCards()` to work with markdown content ✅
- Keep `getCardByCharacter()` working via the `character` index field ✅

#### 1.2 Markdown Parser (`src/services/cardMarkdown.js`) ✅

Functions implemented:
- `parseCardSections(markdown)` - returns `{ front, hint, back, examples, related, meaning }` ✅
- `extractFrontInfo(frontSection)` - returns `{ character, pinyin }` ✅
- `renderMarkdown(markdown)` - renders to HTML using `marked` library ✅
- `buildCardTemplate(character, dictLookup)` - pre-fills from dictionary ✅
- `buildMarkdownPrompt()` / `buildFreeformMarkdownPrompt()` - LLM prompts ✅

Deferred to Phase 2:
- `extractImages(markdown)` - for `card://` URL scheme
- `expandComponents(markdown, dictionary)` - for `{{components:X}}` syntax

#### 1.3 Card Editor (`src/components/MarkdownCardEditor.vue`) ✅

Built as card design/editing view (not SRS review):
- GitHub-style Write/Preview tabs
- Streaming content display during generation
- Character and pinyin extracted from content for header
- Audio playback button
- Regenerate and Save actions
- No flip animation needed (design view, not review)

Template structure:
```vue
<template>
  <div class="card" :class="{ flipped }">
    <div class="card-front">
      <!-- Render #Front section -->
      <!-- ##Hint collapsible -->
    </div>
    <div class="card-back">
      <!-- Render #Back section (images first) -->
      <!-- ## Examples, ## Related, ## Meaning -->
      <!-- {{components:X}} expansion -->
    </div>
  </div>
</template>
```

#### 1.4 Edit Mode ✅

- Write/Preview tabs (GitHub-style) ✅
- Raw markdown editing in textarea ✅
- Save parses markdown to extract `character` for indexing ✅
- Cursor positioned at top when opening ✅
- Future enhancement: paste image handling (Phase 2)

#### 1.5 LLM Prompt Changes (`src/services/cardMarkdown.js`) ✅

Implemented `buildMarkdownPrompt()` and `buildFreeformMarkdownPrompt()` with structure:
- `# Front` - character (pinyin)
- `## Hint` - brief hint
- `# Back`
- `## Image` - image prompt description
- `## Examples` - example sentences
- `## Related` - related words
- `## Meaning` - full definition
- `## Components` - character breakdown

#### 1.6 Generation Flow (`src/composables/useMarkdownCardGeneration.js`) ✅

Implemented streaming markdown generation:
- Uses `client.stream(options, callback)` with `chunk.fullContent` ✅
- Streams directly into card content ✅
- No JSON validation needed ✅
- Auto-save on regenerate completion ✅
- Dictionary pre-fill via `buildCardTemplate()` ✅

---

### Phase 2: Image System

**Goal**: Support multiple images, paste-to-upload, `card://` URL scheme.

#### 2.1 URL Scheme

Format: `card://[cardId]/[type]/[index]`

Types:
- `img/1`, `img/2`, etc. - stored images
- `generate/1` - pending generation, shows prompt + button

Examples:
- `card://abc123/img/1` - first stored image for card abc123
- `card://abc123/generate/2` - second image, not yet generated

External URLs (https://) pass through unchanged.

#### 2.2 Image Storage Updates (`src/services/imageGen.js`)

Current: one image per card, keyed by `cardId`
New: multiple images, keyed by `cardId/index`

Update IndexedDB schema:
```javascript
{
  key: 'abc123/1',  // cardId/index
  data: base64,
  savedAt: timestamp
}
```

Functions to add/update:
- `saveCardImage(cardId, index, base64Data)`
- `getCardImage(cardId, index)`
- `deleteCardImages(cardId)` - delete all images for a card
- `getNextImageIndex(cardId)` - for new image uploads

#### 2.3 Image URL Resolver (`src/services/cardImages.js` - new file)

```javascript
export function resolveImageUrl(url, cardId) {
  if (url.startsWith('card://')) {
    const parsed = parseCardUrl(url)
    if (parsed.type === 'img') {
      return getCardImage(parsed.cardId || cardId, parsed.index)
    }
    if (parsed.type === 'generate') {
      return { pending: true, prompt: extractPromptFromAlt(url) }
    }
  }
  return url // external URL
}
```

#### 2.4 Markdown Image Renderer

In `MarkdownCard.vue`, custom rendering for images:
- Parse `![alt](url)` syntax
- For `card://generate/*`: show prompt text + "Generate" button
- For `card://img/*`: load from IndexedDB and display
- For external URLs: display directly

#### 2.5 Paste-to-Upload in Editor

When user pastes an image in markdown editor:
1. Intercept paste event
2. Extract image data from clipboard
3. Upload to IndexedDB with next available index
4. Insert `![pasted image](card://cardId/img/N)` at cursor position

---

### Phase 3: Progressive Reveal System

**Goal**: Let users control what they see during review without changing card content.

#### 3.1 User Preferences (`src/services/preferences.js` - new file)

```javascript
const PREFS_KEY = 'flashcards_display_prefs'

export function getDisplayPrefs() {
  return {
    hideEnglish: false,
    hidePinyin: false,
    hideHint: true,   // collapsed by default
    hideMeaning: true // collapsed by default
  }
}

export function setDisplayPref(key, value) { ... }
```

#### 3.2 Pattern Detection

In markdown renderer, detect patterns for granular reveal:
- `Chinese (pinyin) — English` pattern in Examples/Related sections
- Wrap each part in spans with data attributes
- CSS + JS controls visibility based on preferences

Example rendered HTML:
```html
<div class="example-line" data-reveal="english">
  <span class="zh">我每天跑步</span>
  <span class="pinyin">(Wǒ měitiān pǎobù)</span>
  <span class="en reveal-target">— I run every day</span>
</div>
```

#### 3.3 Reveal Controls UI

- Per-section toggle: "Show English" / "Hide English"
- Tap-to-reveal on individual items
- Global preferences in Settings
- Preferences persist across sessions

#### 3.4 Collapsible Sections

Sections like `##Hint` and `## Meaning`:
- Render with collapsed state by default (based on prefs)
- Show "Tap to reveal" indicator
- Remember expanded state within session

---

### Phase 4: Chat System

**Goal**: Conversational card refinement with tool access.

#### 4.1 Chat Storage (`src/services/chatStorage.js` - new file)

Separate from card storage. Schema:
```javascript
{
  id: string,
  cardId: string,
  created: string,
  messages: [
    { role: 'user' | 'assistant', content: string, timestamp: string }
  ]
}
```

Functions:
- `createChatThread(cardId)` - returns new thread ID
- `getChatThreads(cardId)` - returns all threads for a card
- `addMessage(threadId, role, content)`
- `getThread(threadId)`
- `deleteThread(threadId)`

Store in localStorage under `flashcards_chat_threads`.

#### 4.2 Chat UI Component (`src/components/CardChat.vue` - new file)

Displayed below card view:
- Text input for user messages
- Message history display
- "History" button to browse past threads
- Thread selector/loader

#### 4.3 Tool Definitions

LLM can invoke tools via function calling or structured output:

```javascript
const cardTools = [
  {
    name: 'editCard',
    description: 'Modify a section of the current card',
    parameters: {
      section: 'string (front|hint|examples|related|meaning|image)',
      newContent: 'string (markdown content for that section)'
    }
  },
  {
    name: 'generateImage',
    description: 'Generate an image from a prompt',
    parameters: {
      prompt: 'string',
      index: 'number (which image slot)'
    }
  },
  {
    name: 'createCard',
    description: 'Create a new flashcard',
    parameters: {
      word: 'string (Chinese word or phrase)'
    }
  },
  {
    name: 'lookupDictionary',
    description: 'Look up a word in the dictionary',
    parameters: {
      word: 'string'
    }
  }
]
```

#### 4.4 Tool Execution

When LLM returns a tool call:
1. Parse the tool invocation
2. Execute the corresponding function
3. Update card/UI as needed
4. Add result to chat context
5. Continue conversation if needed

#### 4.5 Chat Context

System prompt for card chat:
```
You are helping the user refine their Chinese flashcard.

Current card content:
[card markdown here]

Available tools: editCard, generateImage, createCard, lookupDictionary

When the user asks to change something, use the appropriate tool.
When they ask questions, answer conversationally.
```

---

### Phase 5: Personalization Flow

**Goal**: Encourage personal connections before card generation.

#### 5.1 Generation UI Update

When user selects a word from dictionary (before generation):

1. Show dictionary definition + components (from local data, no LLM)
2. Display personalization prompt:
   > "What does this word mean to you? A memory, situation, or association helps it stick."
3. Optional text input for personal note
4. "Generate Card" button

#### 5.2 Prompt Integration

Personal note passed to LLM prompt:
```javascript
buildMarkdownPrompt(word, dictContext, personalNote)
```

LLM uses it to:
- Tailor example sentences
- Influence image prompt
- Make memory hooks relevant

The personal note may or may not appear verbatim in the card - LLM decides.

#### 5.3 Skipping Personalization

- Input is optional
- "Skip" or just clicking "Generate" works without personal note
- Gentle UI nudge but no friction for users who prefer speed

---

## Migration Notes

### No Migration Needed

The app is not deployed. Existing localStorage data can be cleared. No backward compatibility required.

### Files to Delete

After transition is complete:
- Old card type logic in `storage.js` (vocabulary/phrase/trivia branching)
- `TriviaCardView.vue` (trivia becomes just another markdown card)
- JSON validation in `llm.js`

### Files to Significantly Rewrite

- `src/services/storage.js` - new card structure
- `src/services/llm.js` - markdown prompts
- `src/composables/useCardGeneration.js` - streaming flow
- `src/components/CardView.vue` - becomes `MarkdownCard.vue`

### Files to Create

- `src/services/cardMarkdown.js` - markdown parsing utilities
- `src/services/cardImages.js` - image URL resolution
- `src/services/chatStorage.js` - chat thread storage
- `src/services/preferences.js` - display preferences
- `src/components/MarkdownCard.vue` - new card renderer
- `src/components/CardChat.vue` - chat interface

### Components Module

The `{{components:X}}` syntax requires:
- Parser to detect the pattern
- Dictionary lookup integration (`lookupChinese` from dictionary.js)
- Formatter to render component breakdown
- Expansion happens at render time, not storage time

---

## Testing Considerations

### Unit Tests Needed

- Markdown section parsing
- Front info extraction (character, pinyin)
- Image URL parsing and resolution
- Component syntax expansion
- Pattern detection for progressive reveal

### Integration Tests

- Card creation flow with streaming
- Image paste and upload
- Chat tool execution
- Cross-card navigation via `card://` links

### Manual Testing Scenarios

1. Create card from dictionary search
2. Create card with personal note
3. Edit card markdown directly
4. Paste external image
5. Generate image from prompt
6. Use chat to modify card section
7. Progressive reveal during review
8. Navigate between cards via related word links

---

## Open Questions for Future Consideration

1. **Card linking**: When user clicks `[word](card://word)`, should it:
   - Navigate to existing card if present?
   - Offer to create if not present?
   - Show inline preview?

2. **Chat attachment support**: Future ability to attach images/files to chat context. Deferred.

3. **Sync/backup**: Current export/import is JSON. Markdown cards may need different approach.

4. **Search**: Full-text search across markdown content vs. just `character` field indexing.

5. **HSK deck integration**: HSK cards currently have their own structure. Need to decide if they become markdown too or remain separate.

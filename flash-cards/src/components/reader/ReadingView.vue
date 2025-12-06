<template>
  <div class="reading-view">
    <!-- Header -->
    <div class="reading-header">
      <button class="btn btn-small" @click="$emit('back')">← Back</button>
      <div class="reading-title">{{ book.title }}</div>
      <div class="reading-nav">
        <button 
          class="nav-btn" 
          @click="$emit('prevPage')"
          :disabled="currentPageIndex === 0"
        >‹</button>
        <span class="page-indicator">{{ currentPageIndex + 1 }} / {{ totalPages }}</span>
        <button 
          class="nav-btn" 
          @click="$emit('nextPage')"
          :disabled="currentPageIndex === totalPages - 1"
        >›</button>
      </div>
    </div>
    
    <!-- Reading Content -->
    <div class="reading-content">
      <!-- Loading State - show skeleton blocks -->
      <div v-if="translating" class="reading-text">
        <div class="sentence-block skeleton-block" v-for="n in 3" :key="n">
          <div class="skeleton-line skeleton-pinyin"></div>
          <div class="skeleton-line skeleton-hanzi"></div>
        </div>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="reading-error">
        <p>{{ error }}</p>
        <button class="btn btn-small" @click="$emit('retry')">Retry</button>
      </div>
      
      <!-- Translated Text -->
      <div 
        v-else-if="page?.segments"
        class="reading-text"
        ref="readingTextRef"
      >
        <!-- Always use sentence blocks for clean layout -->
        <template v-if="sentenceBlocks.length">
          <div 
            v-for="(block, idx) in sentenceBlocks" 
            :key="idx" 
            class="sentence-block"
          >
            <div class="chinese-line">
              <template v-for="(seg, segIdx) in block.segments" :key="segIdx">
                <span 
                  v-if="!isPunctuation(seg.text)"
                  class="word-group"
                >
                  <span v-if="showPinyin" class="word-pinyin">{{ seg.pinyin }}</span>
                  <span 
                    class="word"
                    :data-block-index="idx"
                    :data-segment-index="segIdx"
                    @click="handleWordClick($event, idx, segIdx)"
                  >{{ seg.text }}</span>
                </span>
                <span v-else class="punct">{{ seg.text }}</span>
              </template>
            </div>
            <!-- Show skeleton for English while back-translating -->
            <div v-if="showEnglish && block.en" class="english-line">{{ block.en }}</div>
            <div v-else-if="showEnglish && backTranslating" class="skeleton-line skeleton-english"></div>
            <button 
              class="speak-btn" 
              @click.stop="speakSentence(block)"
              title="Read aloud"
            ><svg class="speak-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg></button>
          </div>
        </template>
        <!-- Fallback for pages without sentence structure -->
        <template v-else>
          <div class="sentence-block">
            <div class="chinese-line">
              <template v-for="(seg, segIdx) in page.segments" :key="segIdx">
                <span 
                  v-if="!isPunctuation(seg.text)"
                  class="word-group"
                >
                  <span v-if="showPinyin" class="word-pinyin">{{ seg.pinyin }}</span>
                  <span 
                    class="word"
                    :data-segment-index="segIdx"
                    @click="handleWordClick($event, null, segIdx)"
                  >{{ seg.text }}</span>
                </span>
                <span v-else class="punct">{{ seg.text }}</span>
              </template>
            </div>
          </div>
        </template>
      </div>
      
      <!-- Waiting for translation -->
      <div v-else class="reading-placeholder">
        <p>Ready to translate</p>
        <button class="btn btn-primary" @click="$emit('translate')">Translate Page</button>
      </div>
    </div>
    
    <!-- Mini Card Tooltip -->
    <Teleport to="body">
      <div 
        v-if="activeWord" 
        class="mini-card"
        :style="miniCardStyle"
        @click.stop
      >
        <div class="mini-card-header">
          <span class="mini-card-char">{{ activeWord.text }}</span>
          <span class="mini-card-pinyin">{{ activeWord.pinyin }}</span>
          <button class="mini-card-close" @click="closeMiniCard">×</button>
        </div>
        <div class="mini-card-meaning">{{ activeWord.meaning || 'Loading...' }}</div>
        
        <!-- Feedback message -->
        <div v-if="addWordFeedback" class="mini-card-feedback" :class="addWordFeedback.type">
          {{ addWordFeedback.message }}
        </div>
        
        <div v-else class="mini-card-actions">
          <button class="btn btn-small btn-primary" @click="handleAddToCollection">
            + Add to Cards
          </button>
          <button class="btn btn-small" @click="handleOpenDetails">
            Look up
          </button>
        </div>
      </div>
    </Teleport>
    
    <!-- Footer Controls -->
    <div class="reading-footer">
      <button 
        class="toggle-pill" 
        :class="{ active: showPinyin }"
        @click="showPinyin = !showPinyin"
      >
        <span class="toggle-pill-indicator"></span>
        <span class="toggle-pill-label">Show Pinyin</span>
      </button>
      <button 
        class="toggle-pill" 
        :class="{ active: showEnglish }"
        @click="showEnglish = !showEnglish; handleShowEnglishChange()"
      >
        <span class="toggle-pill-indicator"></span>
        <span class="toggle-pill-label">Show English</span>
      </button>
      <button 
        class="toggle-pill" 
        :class="{ active: showOriginal }"
        @click="showOriginal = !showOriginal"
      >
        <span class="toggle-pill-indicator"></span>
        <span class="toggle-pill-label">Show Original</span>
      </button>
    </div>
    
    <!-- Loading indicator for back-translation -->
    <div v-if="showEnglish && backTranslating" class="back-translation-loading">
      <span class="loading-dot"></span> Loading English translations...
    </div>
    
    <!-- Back-translation error -->
    <div v-if="showEnglish && backTranslationError" class="back-translation-error">
      <p>{{ backTranslationError }}</p>
      <button class="btn btn-small" @click="$emit('retryBackTranslation')">Retry</button>
    </div>
    
    <!-- Original Text (collapsible) -->
    <div v-if="showOriginal" class="original-text">
      <h4>Original Text</h4>
      <p>{{ originalText }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { getSegmentMeaning, getTextPinyin, isInDictionary } from '../../composables/useReader.js'
import { speak } from '../../services/speech.js'

const props = defineProps({
  book: {
    type: Object,
    required: true
  },
  page: {
    type: Object,
    default: null
  },
  currentPageIndex: {
    type: Number,
    default: 0
  },
  totalPages: {
    type: Number,
    default: 0
  },
  originalText: {
    type: String,
    default: ''
  },
  translating: {
    type: Boolean,
    default: false
  },
  backTranslating: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  backTranslationError: {
    type: String,
    default: null
  },
  onAddWord: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['back', 'prevPage', 'nextPage', 'translate', 'retry', 'openWord', 'miniCardChange', 'backTranslate', 'retryBackTranslation', 'settingsChange'])

// Initialize from book's saved display settings
const showPinyin = ref(props.book.displaySettings?.showPinyin ?? true)
const showEnglish = ref(props.book.displaySettings?.showEnglish ?? false)
const showOriginal = ref(props.book.displaySettings?.showOriginal ?? false)
const activeWord = ref(null)
const miniCardPosition = ref({ x: 0, y: 0 })
const addWordFeedback = ref(null)  // { type: 'success' | 'error', message: string }

// Notify parent when mini-card state changes (for Escape key handling)
watch(activeWord, (val) => {
  emit('miniCardChange', !!val)
  // Clear feedback when mini-card closes or changes
  if (!val) addWordFeedback.value = null
})

// Persist display settings when changed
watch([showPinyin, showEnglish, showOriginal], () => {
  emit('settingsChange', {
    showPinyin: showPinyin.value,
    showEnglish: showEnglish.value,
    showOriginal: showOriginal.value
  })
})

// Check if a segment is punctuation (no pinyin needed, no click interaction)
function isPunctuation(text) {
  return /^[\s，。！？、；：""''（）《》【】\-—…·,.!?;:'"()\[\]{}<>]+$/.test(text)
}

// Build sentence blocks for display
// Uses backTranslation if available (has sentence boundaries), otherwise groups by punctuation
const sentenceBlocks = computed(() => {
  // If we have back-translation with sentence structure, use it
  if (props.page?.backTranslation && Array.isArray(props.page.backTranslation)) {
    return props.page.backTranslation.map(pair => ({
      segments: pair.segments || [],
      pinyin: (pair.segments || []).map(s => s.pinyin || '').join(' ').replace(/\s+/g, ' ').trim(),
      en: pair.en || ''
    }))
  }
  
  // Otherwise, split by sentence-ending punctuation
  if (!props.page?.segments) return []
  
  const blocks = []
  let currentSegments = []
  
  // Track if we just saw sentence-ending punctuation (to include trailing quotes)
  let justEndedSentence = false
  
  for (const seg of props.page.segments) {
    const isClosingQuote = /^["'」』]+$/.test(seg.text)
    
    // If we just ended a sentence and this is a closing quote, add it to previous block
    if (justEndedSentence && isClosingQuote && blocks.length > 0) {
      blocks[blocks.length - 1].segments.push(seg)
      continue
    }
    
    currentSegments.push(seg)
    justEndedSentence = false
    
    // Split on sentence-ending punctuation
    if (/[。！？\n]/.test(seg.text)) {
      blocks.push({
        segments: currentSegments,
        pinyin: currentSegments.map(s => s.pinyin || '').join(' ').replace(/\s+/g, ' ').trim(),
        en: ''
      })
      currentSegments = []
      justEndedSentence = true
    }
  }
  
  // Don't forget remaining segments
  if (currentSegments.length) {
    blocks.push({
      segments: currentSegments,
      pinyin: currentSegments.map(s => s.pinyin || '').join(' ').replace(/\s+/g, ' ').trim(),
      en: ''
    })
  }
  
  // Filter out blocks that contain only whitespace/newlines/punctuation
  const punctuationOnly = /^[\s，。！？、；：""''（）《》【】\-—…·,.!?;:'"()\[\]{}<>\n]+$/
  return blocks.filter(block => {
    return block.segments.some(seg => !punctuationOnly.test(seg.text))
  })
})

// Position mini-card near clicked word
const miniCardStyle = computed(() => {
  const { x, y } = miniCardPosition.value
  
  // Keep within viewport
  const maxX = window.innerWidth - 280
  const maxY = window.innerHeight - 200
  
  return {
    position: 'fixed',
    left: `${Math.min(x, maxX)}px`,
    top: `${Math.min(y, maxY)}px`,
    zIndex: 1000
  }
})

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Ref to reading text container for selection handling
const readingTextRef = ref(null)

// Show mini-card for given text at position
async function showMiniCardForText(text, pinyin, rect) {
  miniCardPosition.value = {
    x: rect.left,
    y: rect.bottom + 8
  }
  
  activeWord.value = { text, pinyin: pinyin || '', meaning: '' }
  
  const meaning = await getSegmentMeaning(text)
  if (activeWord.value?.text === text) {
    activeWord.value.meaning = meaning || 'No definition found'
    // If we didn't have pinyin, try to get it
    if (!activeWord.value.pinyin) {
      activeWord.value.pinyin = await getTextPinyin(text)
    }
  }
}

// Handle click on a word - look up the full segment
async function handleWordClick(e, blockIndex, segmentIndex) {
  // Ignore if user is selecting text
  const selection = window.getSelection()
  if (selection && selection.toString().trim()) {
    return
  }
  
  e.stopPropagation()
  const wordEl = e.target.closest('.word')
  if (!wordEl) return
  
  // Find the segment
  let segment = null
  if (blockIndex !== null) {
    segment = sentenceBlocks.value[blockIndex]?.segments?.[segmentIndex]
  } else {
    segment = props.page.segments[segmentIndex]
  }
  
  if (!segment) return
  
  const rect = wordEl.getBoundingClientRect()
  await showMiniCardForText(segment.text, segment.pinyin, rect)
}

// Extract only Chinese characters from text (filter out pinyin)
function extractChineseOnly(text) {
  return text.replace(/[^\u4e00-\u9fff]/g, '')
}

// Handle text selection - show mini-card for selected Chinese text
function handleSelectionChange() {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) return
  
  const rawText = selection.toString().trim()
  if (!rawText) return
  
  // Extract only Chinese characters (filters out pinyin that gets included)
  const selectedText = extractChineseOnly(rawText)
  if (!selectedText) return
  
  // Check if selection is within our reading text
  if (!readingTextRef.value) return
  const anchorNode = selection.anchorNode
  if (!readingTextRef.value.contains(anchorNode)) return
  
  // Get position from selection range
  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  
  showMiniCardForText(selectedText, '', rect)
  
  // Clear selection after showing the card
  selection.removeAllRanges()
}

function handleAddToCollection() {
  if (!activeWord.value || !props.onAddWord) return
  
  const result = props.onAddWord({
    text: activeWord.value.text,
    pinyin: activeWord.value.pinyin,
    meaning: activeWord.value.meaning,
    bookTitle: props.book.title,
    bookId: props.book.id
  })
  
  if (result.success) {
    addWordFeedback.value = { type: 'success', message: 'Added to your cards!' }
    // Auto-close after showing success
    setTimeout(() => {
      activeWord.value = null
    }, 1200)
  } else if (result.reason === 'exists') {
    addWordFeedback.value = { type: 'error', message: 'Already in your collection' }
  }
}

function handleOpenDetails() {
  if (activeWord.value) {
    emit('openWord', activeWord.value.text)
    activeWord.value = null  // Close mini-card when opening search
  }
}

function closeMiniCard() {
  activeWord.value = null
  addWordFeedback.value = null
}

// Speak all Chinese text in a sentence block
function speakSentence(block) {
  const text = block.segments.map(s => s.text).join('')
  speak(text)
}

// Request back-translation when toggle enabled
function handleShowEnglishChange() {
  if (showEnglish.value && props.page?.translated && !props.page?.backTranslation) {
    emit('backTranslate')
  }
}

// Close mini-card on click outside
function handleClickOutside(e) {
  if (activeWord.value && !e.target.closest('.mini-card') && !e.target.closest('.word')) {
    activeWord.value = null
  }
}

// Handle mouseup to detect end of selection
function handleMouseUp() {
  // Small delay to let selection finalize
  setTimeout(handleSelectionChange, 10)
}

// Close on Escape, navigate with arrows
function handleKeyDown(e) {
  // Ignore keyboard shortcuts when user is typing in an input field
  const isInputFocused = document.activeElement?.tagName === 'INPUT' || 
                         document.activeElement?.tagName === 'TEXTAREA' ||
                         document.activeElement?.isContentEditable
  
  if (e.key === 'Escape') {
    if (activeWord.value) {
      activeWord.value = null
      e.stopPropagation()  // Prevent App.vue from also handling Escape
      return
    }
  }
  if (isInputFocused) return
  
  if (e.key === 'ArrowLeft') {
    emit('prevPage')
  }
  if (e.key === 'ArrowRight') {
    emit('nextPage')
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('mouseup', handleMouseUp)
})

// Auto-translate when page changes
watch(() => [props.page, props.currentPageIndex], () => {
  if (props.page && !props.page.segments && !props.translating) {
    emit('translate')
  }
}, { immediate: true })

// Auto-request back-translation when page is translated and showEnglish is on
watch(() => [props.page?.translated, props.page?.backTranslation], () => {
  if (showEnglish.value && props.page?.translated && !props.page?.backTranslation && !props.backTranslating) {
    emit('backTranslate')
  }
}, { immediate: true })
</script>

<style scoped>
.reading-view {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.reading-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  margin-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border);
}

.reading-title {
  flex: 1;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reading-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.nav-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 1.2rem;
  color: var(--text);
  transition: border-color 0.15s ease;
}

.nav-btn:hover:not(:disabled) {
  border-color: var(--primary);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-indicator {
  font-size: 0.85rem;
  color: var(--text-muted);
  min-width: 60px;
  text-align: center;
}

.reading-content {
  flex: 1;
  min-height: 200px;
}

.reading-error,
.reading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: var(--text-muted);
}

.reading-error {
  color: var(--danger);
}

.reading-error p {
  margin-bottom: 12px;
}

/* Reading text - sentence block layout */
.reading-text {
  padding: var(--spacing-md) 0;
}

/* Sentence block - groups chinese + english */
.sentence-block {
  position: relative;
  padding: var(--spacing-sm) var(--spacing-md);
  padding-right: 32px; /* Space for speak button */
  margin-bottom: var(--spacing-sm);
  background: var(--card-bg);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

/* Skeleton loading styles */
.skeleton-block {
  min-height: 80px;
}

.skeleton-line {
  background: linear-gradient(90deg, var(--border) 25%, var(--bg) 50%, var(--border) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-pinyin {
  height: 14px;
  width: 70%;
  margin-bottom: 8px;
}

.skeleton-hanzi {
  height: 28px;
  width: 90%;
}

.skeleton-english {
  height: 16px;
  width: 80%;
  margin-top: 8px;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Chinese line with word groups */
.chinese-line {
  line-height: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
}

/* Speak button - positioned bottom right of sentence block */
.speak-btn {
  position: absolute;
  right: 0;
  bottom: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  opacity: 0.4;
  transition: opacity 0.2s;
  color: currentColor;
}

.speak-btn:hover {
  opacity: 0.8;
}

.speak-icon {
  width: 16px;
  height: 16px;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Word group: pinyin stacked above hanzi */
.word-group {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  vertical-align: bottom;
  margin-right: 0.3em;
  /* Add top margin to separate from previous line's hanzi */
  margin-top: 0.6em;
}

.word-pinyin {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1;
  /* Tight spacing between pinyin and its hanzi */
  margin-bottom: 2px;
  /* Prevent pinyin from being selected when selecting text */
  user-select: none;
}

.word-group .word {
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.15s;
}

.word-group .word:hover {
  background: rgba(102, 126, 234, 0.15);
}

.punct {
  font-size: 1.6rem;
  display: inline-flex;
  align-items: flex-end;
  vertical-align: bottom;
  margin-top: 0.6em;
  line-height: 1;
}

.english-line {
  font-size: 0.95rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-top: 6px;
}

/* Footer controls - sticky at bottom */
.reading-footer {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-top: 1px solid var(--border);
  background: var(--bg);
  position: sticky;
  bottom: 0;
  margin: 0 -20px;
  width: calc(100% + 40px);
}

/* Pill-style toggle buttons */
.toggle-pill {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 6px 12px;
  border: none;
  border-radius: 20px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--text-muted);
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.toggle-pill:hover {
  border-color: var(--secondary);
}

.toggle-pill.active {
  background: var(--secondary);
  border-color: var(--secondary);
  color: white;
}

.toggle-pill-indicator {
  width: 18px;
  height: 10px;
  border-radius: 5px;
  background: var(--border);
  position: relative;
  transition: background 0.2s ease;
}

.toggle-pill-indicator::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  top: 1px;
  left: 1px;
  transition: transform 0.2s ease;
}

.toggle-pill.active .toggle-pill-indicator {
  background: rgba(255, 255, 255, 0.4);
}

.toggle-pill.active .toggle-pill-indicator::after {
  transform: translateX(8px);
}

.toggle-pill-label {
  white-space: nowrap;
}

/* Loading indicator */
.back-translation-loading {
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--text-muted);
  font-style: italic;
}

/* Back-translation error */
.back-translation-error {
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--danger);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.back-translation-error p {
  margin: 0;
  flex: 1;
}

.loading-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: var(--primary);
  border-radius: 50%;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* Original text panel */
.original-text {
  padding: var(--spacing-md);
  margin-top: var(--spacing-sm);
  background: var(--surface-hover);
  border-radius: var(--radius);
}

.original-text h4 {
  margin: 0 0 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.original-text p {
  margin: 0;
  white-space: pre-wrap;
  font-size: 0.95rem;
  line-height: 1.6;
}
</style>

<style>
/* Mini-card (global styles because of Teleport) */
.mini-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--spacing-sm);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: var(--spacing-sm);
  min-width: 200px;
  max-width: 280px;
}

.mini-card-header {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.mini-card-char {
  font-size: 1.4rem;
  font-weight: 500;
}

.mini-card-pinyin {
  font-size: 0.95rem;
  color: var(--text-muted);
}

.mini-card-close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0 4px;
}

.mini-card-close:hover {
  color: var(--text);
}

.mini-card-meaning {
  font-size: 0.9rem;
  color: var(--text);
  margin-bottom: var(--spacing-sm);
  line-height: 1.4;
}

.mini-card-feedback {
  padding: var(--spacing-sm) 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  text-align: center;
}

.mini-card-feedback.success {
  background: rgba(40, 167, 69, 0.1);
  color: var(--success);
}

.mini-card-feedback.error {
  background: rgba(220, 53, 69, 0.1);
  color: var(--danger);
}

.mini-card-actions {
  display: flex;
  gap: var(--spacing-sm);
}
</style>

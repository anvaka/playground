<template>
  <div class="markdown-card-editor">
    <!-- Header with character and actions -->
    <div class="editor-header">
        <div class="editor-title">
          <span class="editor-character">{{ displayCharacter }}</span>
          <span v-if="displayPinyin" class="editor-pinyin">{{ displayPinyin }}</span>
          <button 
            v-if="displayCharacter && speechSupported" 
            class="speak-btn" 
            @click.stop="speak(displayCharacter)"
            :disabled="isSpeaking"
            title="Listen"
          >
            <svg class="speak-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          </button>
        </div>
        <div class="editor-actions">
          <button 
            v-if="hasChanges" 
            class="btn btn-small btn-primary" 
            @click="handleSave"
          >
            Save
          </button>
        </div>
      </div>

      <!-- Mode tabs (Write / Preview / Chat toggle) -->
      <div class="editor-tabs">
        <div class="tabs-left">
          <button 
            class="editor-tab" 
            :class="{ active: mode === 'write' }"
            @click="mode = 'write'"
          >
            Write
          </button>
          <button 
            class="editor-tab" 
            :class="{ active: mode === 'preview' }"
            @click="mode = 'preview'"
          >
            Preview
          </button>
        </div>
      </div>

      <!-- Content area -->
      <div class="editor-content">
        <!-- Write mode -->
        <textarea
          v-show="mode === 'write'"
          ref="textareaRef"
          v-model="content"
          class="editor-textarea"
          placeholder="Card content in markdown..."
          @paste="handlePaste"
        ></textarea>

        <!-- Preview mode -->
        <div 
          v-show="mode === 'preview'" 
          ref="previewRef"
          class="editor-preview markdown-content"
          v-html="renderedContent"
          @click="handlePreviewClick"
        ></div>

        <!-- Streaming indicator -->
        <div v-if="isGenerating" class="editor-streaming">
          <span class="streaming-dot"></span>
          <span class="streaming-dot"></span>
          <span class="streaming-dot"></span>
        </div>
      </div>

      <!-- Generate button for empty cards -->
      <div v-if="!content && !isGenerating" class="editor-generate">
        <button class="btn btn-primary" @click="handleGenerate">
          Generate with AI
        </button>
      </div>

    <!-- Error display -->
    <div v-if="errorMessage" class="editor-error">
      {{ errorMessage }}
      <button class="btn btn-small" @click="clearError">Dismiss</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { renderMarkdown, parseCardSections, extractFrontInfo } from '../services/cardMarkdown.js'
import { useSpeech } from '../composables/useSpeech.js'
import { useMarkdownCardGeneration } from '../composables/useMarkdownCardGeneration.js'
import { saveImageBlob, getNextImageIndex, resizeImageBlob } from '../services/imageGen.js'
import { useCardImages } from '../composables/useCardImages.js'
import { useLLM } from '@anvaka/vue-llm'

const props = defineProps({
  card: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['saved', 'create-card', 'open-chat'])

const { client } = useLLM()

// Initialize composable with LLM client getter
const cardGen = useMarkdownCardGeneration({
  getClient: () => client,
  onCardSaved: (saved) => emit('saved', saved)
})

const { speak, isSpeaking, isSupported: speechSupported } = useSpeech()

const mode = ref('preview')
const content = ref('')
const originalContent = ref('')
const textareaRef = ref(null)
const previewRef = ref(null)
const isPastingImage = ref(false)

const { resolveImageUrl } = useCardImages()

// Computed bindings to composable state
const isGenerating = computed(() => cardGen.loading.value)
const errorMessage = computed(() => cardGen.error.value)

function clearError() {
  cardGen.clearError()
}

// Initialize content from card prop
function initFromCard(card) {
  if (!card) return
  content.value = card.content || ''
  originalContent.value = card.content || ''
  cardGen.currentCard.value = card
}

// Watch card prop for changes
watch(() => props.card, (newCard) => {
  initFromCard(newCard)
}, { immediate: true })

// Update content when streaming
watch(() => cardGen.streamingContent.value, (newContent) => {
  if (isGenerating.value || newContent) {
    content.value = newContent || ''
  }
})

// Extract display info from content
const displayInfo = computed(() => {
  const sections = parseCardSections(content.value)
  return extractFrontInfo(sections.front)
})

const displayCharacter = computed(() => displayInfo.value.character || props.card?.character)
const displayPinyin = computed(() => displayInfo.value.pinyin)

const hasChanges = computed(() => content.value !== originalContent.value)

const renderedContent = computed(() => {
  return renderMarkdown(content.value)
})

/**
 * Resolve card:// images in preview
 */
async function resolvePreviewImages() {
  if (!previewRef.value) return
  
  // Look for images with data-card-src attribute
  const images = previewRef.value.querySelectorAll('img[data-card-src]')
  for (const img of images) {
    const cardSrc = img.getAttribute('data-card-src')
    if (!cardSrc) continue
    
    img.classList.add('card-image-loading')
    img.classList.remove('card-image-pending')
    try {
      const objectUrl = await resolveImageUrl(cardSrc)
      if (objectUrl) {
        img.src = objectUrl
        img.removeAttribute('data-card-src')
        img.classList.remove('card-image-loading')
      } else {
        img.classList.add('card-image-error')
      }
    } catch {
      img.classList.add('card-image-error')
    }
  }
}

// Resolve images when content changes while in preview mode
watch(renderedContent, async () => {
  if (mode.value === 'preview') {
    await nextTick()
    resolvePreviewImages()
  }
})

// Also resolve when switching to preview mode
watch(mode, async (newMode) => {
  if (newMode === 'preview') {
    await nextTick()
    resolvePreviewImages()
  }
})

function handleSave() {
  const saved = cardGen.save(content.value)
  if (saved) {
    originalContent.value = content.value
  }
}

/**
 * Handle clicks on inline speak icons in preview
 */
function handlePreviewClick(event) {
  const target = event.target
  if (target.classList.contains('inline-speak')) {
    const text = decodeURIComponent(target.dataset.speak || '')
    if (text) {
      speak(text)
    }
  }
}

async function handleGenerate() {
  const character = props.card?.character
  if (character) {
    await cardGen.generate(character)
  }
}

// Called from parent when chat wants to edit card
function applyCardEdit({ section, content: newContent, fullContent }) {
  if (fullContent) {
    // Replace entire card
    content.value = fullContent
  } else if (section && newContent) {
    // Edit specific section
    const sections = parseCardSections(content.value)
    sections[section] = newContent
    content.value = rebuildMarkdown(sections)
  }
  mode.value = 'preview'
}

// Expose methods for parent
defineExpose({
  applyCardEdit,
  getContent: () => content.value,
  getCharacter: () => displayCharacter.value
})

/**
 * Rebuild markdown from sections object, preserving standard order
 */
function rebuildMarkdown(sections) {
  const lines = []
  
  // Standard section order - covers all known section types
  const sectionOrder = [
    { key: 'front', header: '# Front' },
    { key: 'hint', header: '## Hint' },
    { key: 'back', header: '# Back', allowEmpty: true },
    { key: 'image', header: '## Image' },
    { key: 'meaning', header: '## Meaning' },
    { key: 'examples', header: '## Examples' },
    { key: 'related', header: '## Related' },
    { key: 'components', header: '## Components' },
    { key: 'memory', header: '## Memory' },
    { key: 'answer', header: '## Answer' },
    { key: 'pattern', header: '## Pattern' },
    { key: 'usage', header: '## Usage' },
    { key: 'contrast', header: '## Contrast' },
  ]
  
  for (const { key, header, allowEmpty } of sectionOrder) {
    if (sections[key] || (allowEmpty && sections[key] !== undefined)) {
      lines.push(header)
      lines.push(sections[key] || '')
      lines.push('')
    }
  }
  
  return lines.join('\n').trim()
}

// Auto-switch to preview during generation
watch(isGenerating, (generating) => {
  if (generating) {
    mode.value = 'preview'
  }
})

// Focus textarea when switching to write mode
watch(mode, async (newMode) => {
  if (newMode === 'write') {
    await nextTick()
    if (textareaRef.value) {
      textareaRef.value.focus()
      textareaRef.value.setSelectionRange(0, 0)
      textareaRef.value.scrollTop = 0
    }
  }
})

onMounted(async () => {
  if (props.card?.isNew || !content.value) {
    mode.value = 'write'
  } else {
    // Resolve images if starting in preview mode
    await nextTick()
    if (mode.value === 'preview') {
      resolvePreviewImages()
    }
  }
})

/**
 * Handle paste event to support image pasting
 */
async function handlePaste(event) {
  const items = event.clipboardData?.items
  if (!items) return
  
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      event.preventDefault()
      await pasteImage(item)
      break
    }
  }
}

/**
 * Process and save pasted image, insert markdown at cursor
 */
async function pasteImage(item) {
  const blob = item.getAsFile()
  if (!blob) return
  
  isPastingImage.value = true
  
  try {
    // Ensure card has an ID (generate if needed for new cards)
    let cardId = props.card?.id
    if (!cardId) {
      cardId = crypto.randomUUID()
      // Update the card object with generated ID
      if (props.card) {
        props.card.id = cardId
      }
    }
    
    // Resize if needed
    const resizedBlob = await resizeImageBlob(blob)
    
    // Get next available index for this card
    const index = await getNextImageIndex(cardId)
    
    // Save to IndexedDB
    await saveImageBlob(cardId, index, resizedBlob)
    
    // Build the card:// URL
    const imageUrl = `card://${cardId}/img/${index}`
    const markdownImage = `![image](${imageUrl})`
    
    // Insert at cursor position
    insertAtCursor(markdownImage)
  } catch (err) {
    console.error('Failed to paste image:', err)
    cardGen.error.value = 'Failed to paste image: ' + err.message
  } finally {
    isPastingImage.value = false
  }
}

/**
 * Insert text at current cursor position in textarea
 */
function insertAtCursor(text) {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const before = content.value.substring(0, start)
  const after = content.value.substring(end)
  
  // Add newlines if inserting in middle of content
  const needsNewlineBefore = before.length > 0 && !before.endsWith('\n')
  const needsNewlineAfter = after.length > 0 && !after.startsWith('\n')
  
  const insertion = (needsNewlineBefore ? '\n' : '') + text + (needsNewlineAfter ? '\n' : '')
  
  content.value = before + insertion + after
  
  // Move cursor after inserted text
  nextTick(() => {
    const newPos = start + insertion.length
    textarea.setSelectionRange(newPos, newPos)
    textarea.focus()
  })
}
</script>

<style scoped>
.markdown-card-editor {
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
}

.editor-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.editor-character {
  font-size: 1.75rem;
  font-weight: 500;
}

.editor-pinyin {
  font-size: 1.1rem;
  color: var(--secondary);
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.editor-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
}

.tabs-left {
  display: flex;
}

.editor-tab {
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.875rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.editor-tab:hover {
  color: var(--text);
}

.editor-tab.active {
  color: var(--text);
  border-bottom-color: var(--secondary);
}

/* Chat toggle button */
.chat-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin-right: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.85rem;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s ease;
}

.chat-toggle-btn:hover {
  background: var(--bg);
  color: var(--text);
  border-color: var(--secondary);
}

.chat-label {
  font-weight: 500;
}

.editor-content {
  min-height: 400px;
  position: relative;
  flex: 1;
}

.editor-textarea {
  width: 100%;
  min-height: 400px;
  height: 100%;
  padding: 16px 20px;
  border: none;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  background: var(--card-bg);
  color: var(--text);
}

.editor-textarea:focus {
  outline: none;
}

.editor-preview {
  padding: 16px 20px;
  min-height: 400px;
  overflow-y: auto;
}

.editor-streaming {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  gap: 4px;
}

.streaming-dot {
  width: 6px;
  height: 6px;
  background: var(--secondary);
  border-radius: 50%;
  animation: pulse 1.4s ease-in-out infinite;
}

.streaming-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.streaming-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

.editor-generate {
  padding: 40px 20px;
  text-align: center;
}

.editor-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(220, 53, 69, 0.1);
  border-top: 1px solid var(--danger);
  color: var(--danger);
  font-size: 0.875rem;
}

/* Markdown content styles */
.markdown-content :deep(h1) {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
  color: var(--primary);
}

.markdown-content :deep(h2) {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin: 20px 0 8px 0;
}

.markdown-content :deep(h2:first-child) {
  margin-top: 0;
}

.markdown-content :deep(p) {
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 0 0 12px 0;
  padding-left: 20px;
}

.markdown-content :deep(li) {
  margin: 4px 0;
  line-height: 1.6;
}

.markdown-content :deep(em) {
  color: var(--text-muted);
  font-style: italic;
}

.markdown-content :deep(strong) {
  font-weight: 600;
}

.markdown-content :deep(code) {
  background: rgba(128, 128, 128, 0.15);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}

.markdown-content :deep(blockquote) {
  margin: 12px 0;
  padding: 8px 16px;
  border-left: 3px solid var(--secondary);
  background: var(--bg);
  color: var(--text-secondary);
}

/* Card images */
.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius);
  margin: 8px 0;
}

.markdown-content :deep(img.card-image-pending),
.markdown-content :deep(img.card-image-loading) {
  opacity: 0.5;
  min-height: 100px;
  background: rgba(128, 128, 128, 0.1);
}

.markdown-content :deep(img.card-image-error) {
  opacity: 0.3;
  min-height: 50px;
  background: rgba(220, 53, 69, 0.1);
  border: 1px dashed rgba(220, 53, 69, 0.3);
}

/* Speak button */
.speak-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card-bg);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.speak-btn:hover {
  background: var(--bg);
  border-color: var(--secondary);
}

.speak-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.speak-icon {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
}

.speak-btn:hover .speak-icon {
  color: var(--secondary);
}

/* Inline speak icons after Chinese text */
.markdown-content :deep(.inline-speak) {
  display: inline;
  margin-left: 2px;
  font-size: 0.7em;
  color: var(--text-muted);
  opacity: 0.4;
  cursor: pointer;
  transition: opacity 0.15s ease, color 0.15s ease;
  user-select: none;
  vertical-align: middle;
}

.markdown-content :deep(.inline-speak:hover) {
  opacity: 1;
  color: var(--secondary);
}
</style>

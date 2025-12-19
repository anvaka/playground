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
            v-if="!isGenerating && content" 
            class="btn btn-small" 
            @click="handleRegenerate"
            :disabled="isGenerating"
          >
            Regenerate
          </button>
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
        <button 
          class="chat-toggle-btn"
          @click="openChat"
          title="Chat about this card"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span class="chat-label">Chat</span>
        </button>
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
        ></textarea>

        <!-- Preview mode -->
        <div 
          v-show="mode === 'preview'" 
          class="editor-preview markdown-content"
          v-html="renderedContent"
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

const props = defineProps({
  card: {
    type: Object,
    required: true
  },
  getClient: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['saved', 'create-card', 'open-chat'])

// Initialize composable with provided client getter
const cardGen = useMarkdownCardGeneration({
  getClient: props.getClient,
  onCardSaved: (saved) => emit('saved', saved)
})

const { speak, isSpeaking, isSupported: speechSupported } = useSpeech()

const mode = ref('preview')
const content = ref('')
const originalContent = ref('')
const textareaRef = ref(null)

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

function handleSave() {
  const saved = cardGen.save(content.value)
  if (saved) {
    originalContent.value = content.value
  }
}

async function handleGenerate() {
  const character = props.card?.character
  if (character) {
    await cardGen.generate(character)
  }
}

async function handleRegenerate() {
  await cardGen.regenerate()
  // Auto-save after regeneration
  if (cardGen.currentCard.value) {
    const saved = cardGen.save(cardGen.currentCard.value.content)
    if (saved) {
      originalContent.value = saved.content
    }
  }
}

// Chat integration
function openChat() {
  emit('open-chat', {
    cardId: props.card?.id || 'new',
    cardContent: content.value,
    cardCharacter: displayCharacter.value
  })
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
 * Rebuild markdown from sections object
 */
function rebuildMarkdown(sections) {
  const lines = []
  
  if (sections.front) {
    lines.push('# Front')
    lines.push(sections.front)
    lines.push('')
  }
  
  if (sections.hint) {
    lines.push('## Hint')
    lines.push(sections.hint)
    lines.push('')
  }
  
  if (sections.back !== undefined) {
    lines.push('# Back')
    lines.push(sections.back || '')
    lines.push('')
  }
  
  if (sections.image) {
    lines.push('## Image')
    lines.push(sections.image)
    lines.push('')
  }
  
  if (sections.examples) {
    lines.push('## Examples')
    lines.push(sections.examples)
    lines.push('')
  }
  
  if (sections.related) {
    lines.push('## Related')
    lines.push(sections.related)
    lines.push('')
  }
  
  if (sections.meaning) {
    lines.push('## Meaning')
    lines.push(sections.meaning)
    lines.push('')
  }
  
  if (sections.components) {
    lines.push('## Components')
    lines.push(sections.components)
    lines.push('')
  }
  
  if (sections.memory) {
    lines.push('## Memory')
    lines.push(sections.memory)
    lines.push('')
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

onMounted(() => {
  if (props.card?.isNew || !content.value) {
    mode.value = 'write'
  }
})
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
</style>

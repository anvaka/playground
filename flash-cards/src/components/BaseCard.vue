<template>
  <div class="card-view-container" ref="cardContainer">
    <!-- Card with flip animation -->
    <div 
      class="card-view" 
      :class="{ flipped, editing: isEditing }" 
      @click="handleCardClick"
    >
      <div class="card-view-inner">
        <!-- Front side -->
        <div 
          class="card-view-front" 
          :class="{ 'has-bg-image': imageDataUrl }"
          :style="imageDataUrl ? { backgroundImage: `url(${imageDataUrl})` } : {}"
        >
          <slot name="front"></slot>
        </div>
        
        <!-- Back side -->
        <div class="card-view-back">
          <!-- Compact word/pinyin header -->
          <div class="card-view-back-header">
            <slot name="back-header"></slot>
          </div>
          <slot name="back"></slot>

          <!-- Image Story section -->
          <section class="card-view-section image-story-section" v-if="card.imagePrompt || imageDataUrl">
            <div class="image-story-header">
              <h4>Image Story</h4>
              <button 
                v-if="canGenerateImage && !loading"
                class="btn btn-small" 
                @click.stop="handleGenerateImage"
                :disabled="generatingImage"
              >
                {{ generatingImage ? 'Generating...' : (imageDataUrl ? 'Regenerate' : 'Generate') }}
              </button>
              <span v-if="canGenerateImage && !loading && !imageGenAvailable" class="text-muted image-hint">
                (requires OpenAI)
              </span>
            </div>
            
            <div class="image-story-content">
              <div v-if="imageDataUrl" class="image-story-preview">
                <img :src="imageDataUrl" alt="Memory image" />
              </div>
              <div class="image-story-text">
                <p v-if="card.imagePrompt" class="image-prompt-text"><MarkdownText :text="card.imagePrompt" /></p>
              </div>
            </div>
            <div v-if="imageError" class="image-error" @click.stop>{{ imageError }}</div>
          </section>
        </div>
      </div>
      
      <!-- Loading overlay (not shown when editing - button shows state instead) -->
      <div v-if="loading && !isEditing" class="card-view-loading">
        <span class="spinner"></span>
        Generating...
      </div>
    </div>

    <!-- Edit panel slot - shown when editing -->
    <slot v-if="isEditing" name="edit-panel"></slot>

    <!-- External action bar -->
    <div class="card-view-external-actions" v-if="!loading" @click.stop>
      <slot name="actions">
        <!-- Default actions -->
        <button class="btn btn-danger-text btn-small" @click="$emit('delete')">Delete</button>
        <div class="actions-right">
          <button v-if="canEdit" class="btn btn-small" @click="$emit('edit')">Edit</button>
          <button v-if="showClose" class="btn btn-small" @click="$emit('close')">← Back</button>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useLLM } from '@anvaka/vue-llm'
import { generateImage, saveImage, getImage, toDataUrl } from '../services/imageGen.js'
import MarkdownText from './MarkdownText.vue'

const cardContainer = ref(null)

const props = defineProps({
  card: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  showClose: {
    type: Boolean,
    default: true
  },
  canEdit: {
    type: Boolean,
    default: false
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  initialFlipped: {
    type: Boolean,
    default: false
  },
  scrollTargetRef: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['delete', 'close', 'edit', 'flip'])

// Get LLM utilities for API key access
const { getStoredKey, hasStoredKey, getActiveConfig } = useLLM()

const flipped = ref(props.initialFlipped)

// Image state
const imageDataUrl = ref(null)
const generatingImage = ref(false)
const imageError = ref(null)

// Expose flipped state for parent components
defineExpose({ flipped, imageDataUrl })

// Check if OpenAI is available for image generation
const imageGenAvailable = computed(() => {
  const activeConfig = getActiveConfig()
  if (activeConfig?.provider === 'openai' && activeConfig?.apiKey) {
    return true
  }
  return hasStoredKey('openai')
})

// Get the OpenAI API key
function getOpenAIKey() {
  const activeConfig = getActiveConfig()
  if (activeConfig?.provider === 'openai' && activeConfig?.apiKey) {
    return activeConfig.apiKey
  }
  if (hasStoredKey('openai')) {
    return getStoredKey('openai')
  }
  return null
}

// Check if we can show image generation button
const canGenerateImage = computed(() => {
  return props.card.imagePrompt
})

// Load image when card changes
watch(() => props.card, async (newCard) => {
  flipped.value = props.initialFlipped
  await loadImage(newCard.id)
  scrollToCard()
}, { deep: true })

// Load image on mount
onMounted(async () => {
  await loadImage(props.card.id)
  scrollToCard()
})

async function loadImage(cardId) {
  if (!cardId) {
    imageDataUrl.value = null
    return
  }
  try {
    const base64 = await getImage(cardId)
    imageDataUrl.value = toDataUrl(base64)
  } catch {
    imageDataUrl.value = null
  }
}

function scrollToCard() {
  nextTick(() => {
    // Prefer scrolling to custom target (e.g., study header) if provided
    const target = props.scrollTargetRef || cardContainer.value
    if (!target) return
    
    // Only scroll if the target's top is above the viewport
    const rect = target.getBoundingClientRect()
    if (rect.top < 0) {
      target.scrollIntoView({ block: 'start' })
    }
  })
}

async function handleGenerateImage() {
  if (!props.card.imagePrompt) {
    imageError.value = 'No image prompt available'
    return
  }
  
  const apiKey = getOpenAIKey()
  if (!apiKey) {
    imageError.value = 'OpenAI API key not configured. Add OpenAI provider in Settings.'
    return
  }
  
  generatingImage.value = true
  imageError.value = null
  
  try {
    const base64 = await generateImage(props.card.imagePrompt, apiKey)
    await saveImage(props.card.id, base64)
    imageDataUrl.value = toDataUrl(base64)
  } catch (err) {
    imageError.value = err.message
  } finally {
    generatingImage.value = false
  }
}

function handleCardClick(e) {
  // Skip if in editing mode
  if (props.isEditing) return
  // Skip if clicking interactive elements
  if (e.target.closest('button, input, textarea, a')) return
  // Skip if text is selected
  const selection = window.getSelection()
  if (selection && selection.toString().length > 0) return
  
  flipped.value = !flipped.value
  emit('flip', flipped.value)
  scrollToCard()
}
</script>

<style scoped>
.card-view-back-header {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.5em;
  opacity: 0.6;
  margin-bottom: 0.5em;
  font-size: 1.1em;
}

.card-view-external-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: 12px;
  padding: 12px var(--spacing-md);
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.card-view-external-actions .actions-right {
  display: flex;
  gap: var(--spacing-sm);
}
</style>

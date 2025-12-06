<template>
  <BaseCard
    :card="localCard"
    :loading="loading"
    :show-close="showClose"
    :can-edit="!isNew || hasFilled"
    :is-editing="isEditing"
    :initial-flipped="initialFlipped"
    :scroll-target-ref="scrollTargetRef"
    @delete="$emit('delete')"
    @close="handleClose"
    @edit="startEdit"
  >
    <!-- Front side content -->
    <template #front>
      <div class="card-view-character">
        {{ localCard.character }}
        <button 
          v-if="speechSupported" 
          class="speak-btn speak-btn-large" 
          @click.stop="speak(localCard.character)"
          :disabled="isSpeaking"
          title="Listen"
        ><svg class="speak-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg></button>
      </div>
      <div class="card-view-pinyin">{{ localCard.pinyin }}</div>
      <div class="card-view-hint">{{ localCard.microClue || '' }}</div>
      <!-- HSK Badge -->
      <div v-if="hskBadge" class="hsk-badge" :class="'hsk-' + hskBadge.level">
        HSK {{ hskBadge.level }}
      </div>
    </template>

    <!-- Compact header for back side -->
    <template #back-header>
      <span class="back-header-char">{{ localCard.character }}</span>
      <span class="back-header-pinyin">{{ localCard.pinyin }}</span>
      <button 
        v-if="speechSupported" 
        class="speak-btn" 
        @click.stop="speak(localCard.character)"
        :disabled="isSpeaking"
        title="Listen"
      ><svg class="speak-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg></button>
      <span v-if="hskBadge" class="back-header-badge hsk-badge-small">HSK {{ hskBadge.level }}</span>
    </template>
    
    <!-- Back side content -->
    <template #back>
      <section v-if="displayTranslation" class="card-view-section card-view-translation">
        <span class="translation-text">{{ displayTranslation }}</span>
      </section>

      <section class="card-view-section">
        <h4>Meaning</h4>
        <p><MarkdownText :text="displayMeaning" /></p>
      </section>

      <section class="card-view-section" v-if="displayComponents">
        <h4>Components</h4>
        <p><MarkdownText :text="displayComponents" /></p>
      </section>

      <section class="card-view-section" v-if="localCard.examples && localCard.examples.length">
        <h4>Examples</h4>
        <div v-for="(ex, i) in localCard.examples" :key="i" class="example">
          <div class="example-zh">
            {{ ex.zh }}
            <button 
              v-if="speechSupported" 
              class="speak-btn" 
              @click.stop="speak(ex.zh)"
              :disabled="isSpeaking"
              title="Listen"
            ><svg class="speak-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg></button>
          </div>
          <div class="example-pinyin">{{ ex.pinyin }}</div>
          <div class="example-en">{{ ex.en }}</div>
        </div>
      </section>

      <section class="card-view-section" v-if="localCard.memoryStory">
        <h4>Memory Story</h4>
        <p><MarkdownText :text="localCard.memoryStory" /></p>
      </section>

      <section class="card-view-section" v-if="localCard.relatedWords && localCard.relatedWords.length">
        <h4>Related</h4>
        <div class="related-words">
          <a 
            v-for="(word, i) in localCard.relatedWords" 
            :key="i"
            :href="'?card=' + encodeURIComponent(word.zh)"
            class="related-word"
            @click.prevent="$emit('navigate', word.zh)"
          >
            <span class="related-zh">{{ word.zh }}</span>
            <span class="related-pinyin">{{ word.pinyin }}</span>
            <span class="related-en">{{ word.en }}</span>
          </a>
        </div>
      </section>

      <!-- Generate button for new unfilled cards -->
      <div v-if="isNew && !hasFilled && !loading" class="card-view-generate">
        <button class="btn btn-primary" @click.stop="$emit('generate')">
          Generate with AI
        </button>
      </div>
    </template>

    <!-- Edit panel -->
    <template #edit-panel>
      <div class="card-view-edit-panel">
        <div class="edit-panel-header">
          <h4>Front Side</h4>
          <button 
            class="btn btn-small btn-secondary" 
            @click="$emit('regenerate')" 
            :disabled="loading"
            title="Regenerate content with AI"
          >
            {{ loading ? 'Regenerating...' : 'Regenerate' }}
          </button>
        </div>
        <div class="edit-front-preview">
          <div class="preview-character">{{ localCard.character }}</div>
          <input 
            v-model="localCard.pinyin" 
            class="card-view-input"
            placeholder="Pinyin"
          />
          <input 
            v-model="localCard.microClue"
            class="card-view-input"
            placeholder="Hint"
          />
        </div>
        
        <h4>Back Side</h4>
        <div class="edit-field">
          <label>Translation (short)</label>
          <input v-model="localCard.translation" placeholder="Concise translation, e.g. 'no; not; un-'" />
        </div>
        <div class="edit-field">
          <label>Meaning</label>
          <textarea v-model="localCard.meaning" rows="2" placeholder="Meaning"></textarea>
        </div>
        <div class="edit-field">
          <label>Components</label>
          <textarea v-model="localCard.components" rows="2" placeholder="Components"></textarea>
        </div>
        <div class="edit-field">
          <label>Examples</label>
          <div v-for="(ex, i) in localCard.examples" :key="i" class="example-edit">
            <input v-model="ex.zh" placeholder="Chinese" />
            <input v-model="ex.pinyin" placeholder="Pinyin" />
            <input v-model="ex.en" placeholder="English" />
            <button class="btn btn-small" @click="removeExample(i)">×</button>
          </div>
          <button class="btn btn-small" @click="addExample">+ Add Example</button>
        </div>
        <div class="edit-field">
          <label>Memory Story</label>
          <textarea v-model="localCard.memoryStory" rows="2" placeholder="Memory story"></textarea>
        </div>
        <div class="edit-field">
          <label>Image Prompt</label>
          <textarea v-model="localCard.imagePrompt" rows="2" placeholder="Image prompt"></textarea>
        </div>
      </div>
    </template>

    <!-- Custom actions -->
    <template #actions>
      <template v-if="isEditing">
        <button class="btn" @click="cancelEdit">Cancel</button>
        <button class="btn btn-primary" @click="save">Save</button>
      </template>
      <template v-else>
        <div class="actions-left">
          <button class="btn btn-danger-text btn-small" @click="$emit('delete')">Delete</button>
          <!-- Add to Collection button for HSK cards not in collection -->
          <button 
            v-if="!isInCollection && hasFilled" 
            class="btn btn-primary btn-small" 
            @click="$emit('addToCollection')"
          >
            + Add to My Cards
          </button>
          <span v-else-if="isInCollection && !isNew" class="collection-badge">✓ In collection</span>
        </div>
        <div class="actions-right">
          <button v-if="hasFilled" class="btn btn-small" @click="startEdit">Edit</button>
          <button v-if="showClose" class="btn btn-small" @click="handleClose">← Back</button>
        </div>
      </template>
    </template>
  </BaseCard>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import BaseCard from './BaseCard.vue'
import MarkdownText from './MarkdownText.vue'
import { lookupChinese, formatDefinitions } from '../services/dictionary.js'
import { useSpeech } from '../composables/useSpeech.js'

const props = defineProps({
  card: {
    type: Object,
    required: true
  },
  isNew: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  showClose: {
    type: Boolean,
    default: true
  },
  initialFlipped: {
    type: Boolean,
    default: false
  },
  hskBadge: {
    type: Object,
    default: null
  },
  isInCollection: {
    type: Boolean,
    default: false
  },
  regeneratedData: {
    type: Object,
    default: null
  },
  scrollTargetRef: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['save', 'delete', 'close', 'generate', 'regenerate', 'addToCollection', 'navigate', 'clearRegenerated'])

const localCard = ref(cloneCard(props.card))
const isEditing = ref(false)
const dictLookup = ref(null)
const { speak, isSpeaking, isSupported: speechSupported } = useSpeech()

// Fetch dictionary data for the character
async function fetchDictLookup() {
  if (localCard.value.character) {
    dictLookup.value = await lookupChinese(localCard.value.character)
  }
}

// Card is filled if it has meaning from LLM (not just dict)
const hasFilled = computed(() => {
  return !!(localCard.value.meaning && localCard.value.meaning.trim())
})

// Short dictionary-style translation - prefer card's translation, fallback to cedict
const displayTranslation = computed(() => {
  if (localCard.value.translation) return localCard.value.translation
  if (dictLookup.value?.cedict?.[0]) {
    return formatDefinitions(dictLookup.value.cedict[0].definitions)
  }
  return ''
})

// Show dictionary meaning if card not filled
const displayMeaning = computed(() => {
  if (localCard.value.meaning) return localCard.value.meaning
  if (dictLookup.value?.cedict?.[0]) {
    return formatDefinitions(dictLookup.value.cedict[0].definitions)
  }
  return '—'
})

// Show dictionary components if card not filled
const displayComponents = computed(() => {
  if (localCard.value.components) return localCard.value.components
  if (dictLookup.value?.ids) {
    return dictLookup.value.ids.decomposition
  }
  if (dictLookup.value?.componentIds) {
    return dictLookup.value.componentIds
      .map(c => `${c.character}: ${c.decomposition}`)
      .join(' | ')
  }
  return ''
})

// Update local card when prop changes (but not while editing)
watch(() => props.card, (newCard) => {
  if (!isEditing.value) {
    localCard.value = cloneCard(newCard)
  }
  if (hasFilled.value && props.isNew) {
    isEditing.value = false
  }
  fetchDictLookup()
}, { deep: true })

// Update local card when regenerated data arrives (while editing)
watch(() => props.regeneratedData, (newData) => {
  if (newData && isEditing.value) {
    localCard.value = cloneCard(newData)
  }
})

// Fetch dict data on mount
onMounted(() => {
  fetchDictLookup()
})

function cloneCard(card) {
  return JSON.parse(JSON.stringify(card))
}

function handleClose() {
  emit('close')
}

function startEdit() {
  isEditing.value = true
}

function cancelEdit() {
  localCard.value = cloneCard(props.card)
  isEditing.value = false
  emit('clearRegenerated')
}

function save() {
  emit('save', localCard.value)
  isEditing.value = false
  emit('clearRegenerated')
}

function addExample() {
  if (!localCard.value.examples) {
    localCard.value.examples = []
  }
  localCard.value.examples.push({ zh: '', pinyin: '', en: '' })
}

function removeExample(index) {
  localCard.value.examples.splice(index, 1)
}
</script>

<style scoped>
.hsk-badge {
  position: absolute;
  bottom: var(--spacing-md);
  right: var(--spacing-md);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-view-translation {
  text-align: center;
  padding: var(--spacing-sm) 12px;
  margin-bottom: 12px;
  background: var(--surface-hover);
  border-radius: var(--spacing-sm);
}

.translation-text {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text);
}

.hsk-badge-small {
  padding: 2px 8px;
  font-size: 0.7rem;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-left: 8px;
}

.back-header-badge {
  position: static;
}

.collection-badge {
  color: var(--success);
  font-size: 0.85rem;
  padding: 4px 8px;
}

/* HSK level color variations */
.hsk-1 { background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%); }
.hsk-2 { background: linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%); }
.hsk-3 { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.hsk-4 { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.hsk-5 { background: linear-gradient(135deg, #ff6a00 0%, #ee0979 100%); }
.hsk-6 { background: linear-gradient(135deg, #434343 0%, #000000 100%); }

.related-words {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.related-word {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-sm) 12px;
  background: var(--surface-hover);
  border-radius: var(--spacing-sm);
  text-decoration: none;
  color: inherit;
  transition: background-color 0.2s ease;
  min-width: 80px;
}

.related-word:hover {
  background: var(--surface-active);
}

.related-zh {
  font-size: 1.1rem;
  font-weight: 500;
}

.related-pinyin {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.related-en {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.speak-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  margin-left: 4px;
  opacity: 0.4;
  transition: opacity 0.2s;
  vertical-align: middle;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
}

.speak-btn:hover:not(:disabled) {
  opacity: 0.8;
}

.speak-btn:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.speak-btn-large {
  position: absolute;
  right: -36px;
  top: 50%;
  transform: translateY(-50%);
}

.speak-btn-large .speak-icon {
  width: 20px;
  height: 20px;
}

.speak-icon {
  width: 16px;
  height: 16px;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.card-view-character {
  position: relative;
}

.example-zh {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
<template>
  <div class="book-creator">
    <div class="creator-header">
      <button class="btn btn-small" @click="$emit('cancel')">← Back</button>
      <h2>New Book</h2>
    </div>

    <p class="welcome-hint">
      Paste text from a book, article, or anywhere. Interesting content makes better flashcards.
    </p>

    <!-- Main text input - always visible -->
    <div class="form-field">
      <label>Your text</label>
      <textarea 
        ref="textareaRef"
        v-model="sourceText" 
        placeholder="Paste English or Chinese text here..."
        class="form-textarea"
        rows="8"
      ></textarea>
      <div class="field-hint" v-if="sourceText.trim() || isGenerating">
        <span v-if="sourceText.trim()">{{ textStats }}</span>
        <button v-if="isGenerating" class="btn-stop" @click="handleStop">
          ◼ Stop
        </button>
      </div>
    </div>

    <!-- Generate helper - collapsible -->
    <div class="generate-helper">
      <button 
        class="generate-toggle" 
        @click="showGenerateForm = !showGenerateForm"
        :class="{ expanded: showGenerateForm }"
      >
        <span class="toggle-icon">{{ showGenerateForm ? '−' : '+' }}</span>
        Need content? Generate from a topic
      </button>
      
      <div v-if="showGenerateForm" class="generate-form">
        <textarea 
          ref="generateTextareaRef"
          v-model="generatePrompt" 
          placeholder="Describe what you want to read about..."
          class="form-textarea generate-textarea"
          rows="2"
        ></textarea>
        
        <div class="inspiration-prompts">
          <span class="inspiration-label">Try:</span>
          <button 
            v-for="prompt in visiblePrompts" 
            :key="prompt"
            class="prompt-chip"
            @click="generatePrompt = prompt"
          >
            {{ prompt }}
          </button>
          <button class="btn-link" @click="shufflePrompts">more</button>
        </div>
        
        <div class="generate-actions">
          <button 
            class="btn btn-primary" 
            @click="handleGenerate"
            :disabled="!generatePrompt.trim() || isGenerating"
          >
            {{ isGenerating ? 'Generating...' : 'Generate' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Target level -->
    <div class="level-field">
      <div class="level-row">
        <label>Target level</label>
        <select v-model="targetLevel" class="level-select">
          <option v-for="level in levels" :key="level.id" :value="level.id">
            {{ level.label }} ({{ level.desc }})
          </option>
        </select>
      </div>
      <div class="level-hint">
        Translations and generated text will use vocabulary appropriate for this level.
      </div>
    </div>

    <!-- Main action -->
    <div class="creator-actions">
      <button 
        class="btn btn-primary btn-large" 
        @click="handleCreate"
        :disabled="!canCreate"
      >
        Create Book
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useLLM } from '@anvaka/vue-llm'
import { chunkIntoPages, containsChinese } from '../../services/books.js'

const emit = defineEmits(['cancel', 'create'])

const { client } = useLLM()

const sourceText = ref('')
const targetLevel = ref('hsk1-2')
const showGenerateForm = ref(false)
const generatePrompt = ref('')
const isGenerating = ref(false)
let currentGenerationId = 0

const textareaRef = ref(null)
const generateTextareaRef = ref(null)

const levels = [
  { id: 'hsk1-2', label: 'Beginner', desc: 'HSK 1-2' },
  { id: 'hsk3-4', label: 'Intermediate', desc: 'HSK 3-4' },
  { id: 'hsk5-6', label: 'Advanced', desc: 'HSK 5-6' },
  { id: 'natural', label: 'Natural', desc: 'No adjustment' }
]

const allPrompts = [
  'The history of Chinese tea culture',
  'How the Great Wall was built',
  'Describe a day in the life of a delivery rider in Shanghai.',
  'What are 9 things we should understand before it’s too late?',
  'What are 7 lies we tell ourselves that feel like protection but are actually prisons?',
  'Tips for learning Chinese effectively',
  'The art of Chinese calligraphy',
  'A travel guide to Shanghai',
  'Famous Chinese inventions and their impact',
  'A story about friendship and adventure',
  'The significance of the Chinese New Year',
  'What are things that feel productive but are actually sophisticated procrastination?',
  'How to stay motivated while learning a new language',
  'The role of family in Chinese culture',
  'A day at a traditional Chinese market',
  'The evolution of Chinese cuisine',
  'Why do we give advice we don\'t follow ourselves?',
  'What would happen if everyone suddenly told the truth for 24 hours?',
  'How does living in a megacity like Shanghai change one’s sense of identity compared to staying in a hometown county-level city?',
  'Describe a day in the life of a migrant worker building high-rises in Shenzhen.',
  'Describe a day in the life of a junior engineer at a big tech company in Beijing.',
  'Describe a day in the life of a primary school teacher in a small city in Henan.',
  'Describe a day in the life of a middle-aged factory owner in Guangdong facing shrinking margins.',
  'Describe a day in the life of a university student in Wuhan preparing for the postgraduate entrance exam.',
  'Describe a day in the life of a delivery rider in a smaller city like Chengdu, not just Shanghai.',
  'Describe a day in the life of an elderly retiree in Shanghai who dances in the square every evening.',
  'Describe a day in the life of a young couple in Hangzhou deciding whether to have a second child.',
  'Describe a day in the life of an online content moderator working for a social media platform in China.',
  'Describe a day in the life of a rural doctor in a village in Gansu.'

  // 'A conversation at a coffee shop',
  // 'Asking for directions in a new city',
  // 'A phone call to make a restaurant reservation',
  // 'Shopping at a farmers market',
  // 'A short mystery story set in old Shanghai',
  // 'Two strangers meet on a long train ride',
  // 'A child discovers a hidden garden',
  // 'Traditional festivals and their meanings',
  // 'What would you tell your younger self?',
  // 'The difference between being busy and being productive',
  // 'What makes a house feel like home?',
  // 'The pros and cons of social media',
  // 'How technology is changing education',
  // 'A debate about remote work vs office work',
  // 'Life in a smart city of the future'
]

const shuffledPrompts = ref([...allPrompts].sort(() => Math.random() - 0.5))
const visiblePrompts = computed(() => shuffledPrompts.value.slice(0, 3))

function shufflePrompts() {
  shuffledPrompts.value = [...allPrompts].sort(() => Math.random() - 0.5)
}

onMounted(() => {
  textareaRef.value?.focus()
})

const canCreate = computed(() => sourceText.value.trim().length > 0)

const textStats = computed(() => {
  const text = sourceText.value.trim()
  if (!text) return ''
  
  const isChinese = containsChinese(text)
  const pages = chunkIntoPages(text)
  
  if (isChinese) {
    return `${text.length} characters, ${pages.length} page${pages.length !== 1 ? 's' : ''}, Chinese detected`
  } else {
    const words = text.split(/\s+/).filter(Boolean).length
    return `${words} words, ${pages.length} page${pages.length !== 1 ? 's' : ''}, will be translated`
  }
})

async function handleGenerate() {
  if (!generatePrompt.value.trim()) return
  
  if (!client) {
    alert('LLM not configured. Please configure in Settings.')
    return
  }
  
  isGenerating.value = true
  const generationId = ++currentGenerationId
  
  const prompt = `Generate a Chinese text about the following topic. Write in Chinese characters (Simplified Chinese), approximately 400-500 characters.

Topic: ${generatePrompt.value}

Requirements:
- Write entirely in Chinese (Simplified characters)
- Make it engaging and natural-sounding
- Include some dialogue if appropriate for the topic
- Do not include pinyin or English translations
- Just output the Chinese text, nothing else`

  try {
    showGenerateForm.value = false
    sourceText.value = ''
    
    await client.stream({
      messages: [{ role: 'user', content: prompt }]
    }, (chunk) => {
      // Only update if this generation is still current
      if (generationId === currentGenerationId) {
        sourceText.value = chunk.fullContent
      }
    })
    
    if (generationId === currentGenerationId) {
      sourceText.value = sourceText.value.trim()
      generatePrompt.value = ''
    }
  } catch (err) {
    if (generationId === currentGenerationId) {
      console.error('Generation failed:', err)
      alert('Failed to generate text. Please check your LLM settings and try again.')
    }
  } finally {
    if (generationId === currentGenerationId) {
      isGenerating.value = false
    }
  }
}

function handleStop() {
  currentGenerationId++ // Invalidate current generation
  isGenerating.value = false
  sourceText.value = sourceText.value.trim()
}

function handleCreate() {
  if (!canCreate.value) return
  
  emit('create', {
    sourceText: sourceText.value.trim(),
    targetLevel: targetLevel.value
  })
}
</script>

<style scoped>
.book-creator {
  padding: 8px 0;
}

.creator-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.creator-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.welcome-hint {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 20px;
  line-height: 1.5;
}

/* Form fields */
.form-field {
  margin-bottom: 16px;
}

.form-field label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 0.9rem;
}

.level-field {
  margin-bottom: 20px;
}

.level-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.level-row label {
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
}

.level-hint {
  margin-top: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.level-select {
  padding: 6px 10px;
  font-size: 0.85rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card-bg);
  color: var(--text);
  cursor: pointer;
}

.level-select:focus {
  outline: none;
  border-color: var(--primary);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  font-size: 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card-bg);
  color: var(--text);
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.field-hint {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.btn-stop {
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 4px 10px;
  font-size: 0.75rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-stop:hover {
  border-color: var(--text-muted);
  color: var(--text);
}

/* Generate helper */
.generate-helper {
  margin-bottom: 24px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.generate-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 12px 14px;
  background: var(--card-bg);
  border: none;
  font-size: 0.9rem;
  color: var(--text-muted);
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s ease;
}

.generate-toggle:hover {
  background: var(--bg);
}

.generate-toggle.expanded {
  border-bottom: 1px solid var(--border);
}

.toggle-icon {
  font-weight: bold;
  font-size: 1rem;
  width: 16px;
  text-align: center;
}

.generate-form {
  padding: 14px;
  background: var(--bg);
}

.generate-textarea {
  min-height: 60px;
  margin-bottom: 12px;
}

.inspiration-prompts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.inspiration-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.prompt-chip {
  padding: 5px 10px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.prompt-chip:hover {
  border-color: var(--primary);
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0;
}

.btn-link:hover {
  text-decoration: underline;
}

.generate-actions {
  display: flex;
  justify-content: flex-end;
}

/* Main action */
.creator-actions {
  padding-top: 8px;
}

.btn-large {
  width: 100%;
  padding: 14px;
  font-size: 1rem;
}
</style>

<template>
  <div class="flash-match-setup">
    <div class="setup-header">
      <button class="btn btn-small" @click="$emit('back')">← Back</button>
      <h2 class="setup-header-title">Flash Match</h2>
      <div class="setup-header-actions">
        <button 
          class="btn btn-primary" 
          @click="handleStart"
          :disabled="!canStart"
        >
          Start Game
        </button>
      </div>
    </div>
    
    <!-- Mode Selection -->
    <section class="setup-section">
      <h3>Mode</h3>
      <div class="mode-options">
        <label class="mode-option" :class="{ active: mode === 'hanzi-pinyin' }">
          <input type="radio" v-model="mode" value="hanzi-pinyin" />
          <span class="mode-label">Hanzi to Pinyin</span>
          <span class="mode-hint">Match characters with pronunciation</span>
        </label>
        <label class="mode-option" :class="{ active: mode === 'hanzi-english' }">
          <input type="radio" v-model="mode" value="hanzi-english" />
          <span class="mode-label">Hanzi to English</span>
          <span class="mode-hint">Match characters with meaning</span>
        </label>
      </div>
      
      <!-- Hide pinyin option (only for hanzi-english) -->
      <label v-if="mode === 'hanzi-english'" class="checkbox-option">
        <input type="checkbox" v-model="hidePinyin" />
        <span>Hide pinyin (harder)</span>
      </label>
    </section>
    
    <!-- Tag Selection -->
    <section class="setup-section">
      <h3>Card Sources</h3>
      <p class="section-hint">Select which decks to practice</p>
      
      <div class="tag-grid">
        <label 
          v-for="tag in availableTags" 
          :key="tag.id"
          class="tag-option"
          :class="{ active: selectedTags.includes(tag.id), disabled: tagCounts[tag.id] === 0 }"
        >
          <input 
            type="checkbox" 
            :value="tag.id" 
            v-model="selectedTags"
            :disabled="tagCounts[tag.id] === 0"
          />
          <span class="tag-label">{{ tag.label }}</span>
          <span class="tag-count">{{ tagCounts[tag.id] ?? '...' }} cards</span>
        </label>
      </div>
      
      <p v-if="totalCards > 0" class="total-cards">
        Total: {{ totalCards }} cards selected
      </p>
      <p v-if="totalCards > 0 && totalCards < 10" class="warning-text">
        Need at least 10 cards to play
      </p>
    </section>
    
    <!-- Time Limit -->
    <section class="setup-section">
      <h3>Time Limit</h3>
      <div class="time-options">
        <label 
          v-for="t in timeLimitOptions" 
          :key="t"
          class="time-option"
          :class="{ active: timeLimit === t }"
        >
          <input type="radio" v-model="timeLimit" :value="t" />
          <span>{{ t }}s</span>
        </label>
      </div>
    </section>
    
    <!-- Recent Sessions -->
    <section v-if="recentSessions.length > 0" class="setup-section">
      <h3>Recent</h3>
      <div class="recent-sessions">
        <button 
          v-for="(session, i) in recentSessions" 
          :key="i"
          class="recent-session"
          @click="loadSession(session)"
        >
          <span class="session-tags">{{ formatTags(session.tags) }}</span>
          <span class="session-mode">{{ formatMode(session.mode, session.hidePinyin) }}</span>
        </button>
      </div>
    </section>
    
    <!-- Error display -->
    <p v-if="error" class="error-text">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getAvailableTags, getCardCountForTag } from '../../services/cardPool.js'
import { getSettings } from '../../services/gameStats.js'

const emit = defineEmits(['start', 'back'])

// Configuration state
const mode = ref('hanzi-pinyin')
const hidePinyin = ref(false)
const selectedTags = ref([])
const timeLimit = ref(90)
const error = ref(null)

// Data
const availableTags = ref([])
const tagCounts = ref({})
const recentSessions = ref([])

const timeLimitOptions = [30, 60, 90, 120]

// Computed


const totalCards = computed(() => {
  return selectedTags.value.reduce((sum, tagId) => sum + (tagCounts.value[tagId] || 0), 0)
})

const canStart = computed(() => {
  return selectedTags.value.length > 0 && totalCards.value >= 10
})

// Load available tags and counts
onMounted(async () => {
  availableTags.value = getAvailableTags()
  
  // Load card counts for each tag
  for (const tag of availableTags.value) {
    tagCounts.value[tag.id] = await getCardCountForTag(tag.id)
  }
  
  // Load settings
  const settings = getSettings()
  mode.value = settings.defaultMode || 'hanzi-pinyin'
  recentSessions.value = settings.recentSessions || []
  
  // Pre-select first available tag if nothing selected
  if (availableTags.value.length > 0 && selectedTags.value.length === 0) {
    const firstWithCards = availableTags.value.find(t => tagCounts.value[t.id] > 0)
    if (firstWithCards) {
      selectedTags.value = [firstWithCards.id]
    }
  }
})

// Reset hidePinyin when switching to hanzi-pinyin mode
watch(mode, (newMode) => {
  if (newMode === 'hanzi-pinyin') {
    hidePinyin.value = false
  }
})

function loadSession(session) {
  selectedTags.value = [...session.tags]
  mode.value = session.mode
  hidePinyin.value = session.hidePinyin || false
  timeLimit.value = session.timeLimit || 60
}

function formatTags(tags) {
  return tags.map(t => {
    const tag = availableTags.value.find(at => at.id === t)
    return tag ? tag.label : t
  }).join(', ')
}

function formatMode(m, hp) {
  if (m === 'hanzi-pinyin') return 'Hanzi → Pinyin'
  return hp ? 'Hanzi → English (no pinyin)' : 'Hanzi+Pinyin → English'
}

function handleStart() {
  if (!canStart.value) return
  
  error.value = null
  
  emit('start', {
    mode: mode.value,
    hidePinyin: hidePinyin.value,
    tags: selectedTags.value,
    timeLimit: timeLimit.value
  })
}
</script>

<style scoped>
.flash-match-setup {
  max-width: 500px;
  margin: 0 auto;
}

.flash-match-setup h2 {
  margin-bottom: 8px;
}

.setup-description {
  color: var(--text-muted);
  margin-bottom: 24px;
}

.setup-section {
  margin-bottom: 24px;
}

.setup-section h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.section-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

/* Mode options */
.mode-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.mode-option {
  display: flex;
  flex-direction: column;
  padding: 12px var(--spacing-md);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.mode-option:hover {
  border-color: var(--secondary);
}

.mode-option.active {
  border-color: var(--secondary);
  background: rgba(52, 152, 219, 0.05);
}

.mode-option input {
  display: none;
}

.mode-label {
  font-weight: 500;
}

.mode-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  cursor: pointer;
}

.checkbox-option input {
  width: auto;
}

/* Tag grid */
.tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--spacing-sm);
}

.tag-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-sm);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
  text-align: center;
}

.tag-option:hover:not(.disabled) {
  border-color: var(--secondary);
}

.tag-option.active {
  border-color: var(--secondary);
  background: rgba(52, 152, 219, 0.1);
}

.tag-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tag-option input {
  display: none;
}

.tag-label {
  font-weight: 500;
  margin-bottom: 4px;
}

.tag-count {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.total-cards {
  margin-top: 12px;
  font-weight: 500;
  color: var(--secondary);
}

.warning-text {
  color: var(--danger);
  font-size: 0.9rem;
}

/* Time options */
.time-options {
  display: flex;
  gap: var(--spacing-sm);
}

.time-option {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.time-option:hover {
  border-color: var(--secondary);
}

.time-option.active {
  border-color: var(--secondary);
  background: var(--secondary);
  color: white;
}

.time-option input {
  display: none;
}

/* Recent sessions */
.recent-sessions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.recent-session {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-sm) 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card-bg);
  cursor: pointer;
  transition: border-color 0.15s ease;
  text-align: left;
}

.recent-session:hover {
  border-color: var(--secondary);
}

.session-tags {
  font-weight: 500;
  font-size: 0.9rem;
}

.session-mode {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Header */
.setup-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: 20px;
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border);
}

.setup-header-title {
  flex: 1;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.setup-header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.error-text {
  color: var(--danger);
  margin-top: 12px;
}
</style>

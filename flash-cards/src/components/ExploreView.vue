<template>
  <div class="explore-view">
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">Find Words to Study</h1>
      <p class="page-subtitle">Select words to create flashcards</p>
    </div>

    <!-- HSK Level Filter -->
    <div class="level-filters">
      <button 
        v-for="level in levels" 
        :key="level.value"
        class="level-chip"
        :class="{ active: selectedLevel === level.value }"
        @click="selectLevel(level.value)"
      >
        {{ level.label }}
        <span v-if="level.count" class="level-count">{{ level.count }}</span>
      </button>
    </div>

    <!-- Word List -->
    <div class="word-list" ref="listContainer">
      <div 
        v-for="item in words" 
        :key="item.simplified"
        class="word-item"
        :class="{ 'in-deck': savedWords.has(item.simplified) }"
        @click="openWord(item.simplified)"
      >
        <div class="word-main">
          <span class="word-char">{{ item.simplified }}</span>
          <span class="word-pinyin">{{ item.entry?.pinyin }}</span>
        </div>
        <div class="word-def">{{ formatDef(item.entry) }}</div>
        <div v-if="savedWords.has(item.simplified)" class="word-saved">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>
      
      <!-- Load More -->
      <div v-if="hasMore" class="load-more">
        <button @click="loadMore" :disabled="loading">
          {{ loading ? 'Loading...' : 'Load more' }}
        </button>
      </div>
      
      <!-- Empty State -->
      <div v-if="!loading && words.length === 0" class="empty-state">
        <p>No words found for this level.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { getWordsByHskLevel, getHskWordCount, formatDefinitions } from '../services/dictionary.js'
import { getMarkdownCards } from '../services/markdownStorage.js'

const props = defineProps({
  initialLevel: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['select-word', 'change-level'])

const PAGE_SIZE = 50

const selectedLevel = ref(props.initialLevel || 1)
const words = ref([])
const offset = ref(0)
const loading = ref(false)
const totalCount = ref(0)
const savedWords = ref(new Set())

// HSK levels with counts
const levels = computed(() => [
  { value: 0, label: 'All', count: getHskWordCount(0) },
  { value: 1, label: 'HSK 1', count: getHskWordCount(1) },
  { value: 2, label: 'HSK 2', count: getHskWordCount(2) },
  { value: 3, label: 'HSK 3', count: getHskWordCount(3) },
  { value: 4, label: 'HSK 4', count: getHskWordCount(4) },
  { value: 5, label: 'HSK 5', count: getHskWordCount(5) },
  { value: 6, label: 'HSK 6', count: getHskWordCount(6) },
  { value: 7, label: 'HSK 7-9', count: getHskWordCount(7) },
])

const hasMore = computed(() => words.value.length < totalCount.value)

function formatDef(entry) {
  if (!entry?.definitions) return ''
  // Show first 2 definitions, truncated
  const defs = entry.definitions.slice(0, 2).join('; ')
  return defs.length > 60 ? defs.slice(0, 57) + '...' : defs
}

function loadSavedWords() {
  const cards = getMarkdownCards()
  savedWords.value = new Set(cards.map(c => c.character))
}

async function loadWords(reset = false) {
  if (loading.value) return
  
  loading.value = true
  
  if (reset) {
    offset.value = 0
    words.value = []
  }
  
  try {
    const newWords = await getWordsByHskLevel(selectedLevel.value, offset.value, PAGE_SIZE)
    words.value = reset ? newWords : [...words.value, ...newWords]
    offset.value += newWords.length
    totalCount.value = getHskWordCount(selectedLevel.value)
  } finally {
    loading.value = false
  }
}

function loadMore() {
  loadWords(false)
}

function selectLevel(level) {
  selectedLevel.value = level
  emit('change-level', level)
  loadWords(true)
}

function openWord(simplified) {
  emit('select-word', simplified)
}

// Watch for external level changes (from URL)
watch(() => props.initialLevel, (newLevel) => {
  if (newLevel !== selectedLevel.value) {
    selectedLevel.value = newLevel || 1
    loadWords(true)
  }
})

onMounted(() => {
  loadSavedWords()
  loadWords(true)
})

// Expose refresh for parent to call after card saved
defineExpose({
  refresh: loadSavedWords
})
</script>

<style scoped>
.explore-view {
  max-width: 600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--text);
}

.page-subtitle {
  font-size: 0.9rem;
  margin: 0;
  color: var(--text-secondary);
}

.level-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.level-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--card-bg);
  color: var(--text);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.level-chip:hover {
  border-color: var(--border-hover);
  background: var(--bg);
}

.level-chip.active {
  background: var(--secondary);
  border-color: var(--secondary);
  color: white;
}

.level-count {
  font-size: 0.75rem;
  opacity: 0.7;
}

.word-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.word-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.word-item:hover {
  background: var(--bg);
  border-color: var(--border-hover);
}

.word-item.in-deck {
  border-left: 3px solid var(--success, #28a745);
}

.word-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 60px;
}

.word-char {
  font-size: 1.25rem;
  font-weight: 500;
}

.word-pinyin {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.word-def {
  font-size: 0.875rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.word-saved {
  color: var(--success, #28a745);
  flex-shrink: 0;
}

.load-more {
  padding: 16px;
  text-align: center;
}

.load-more button {
  padding: 10px 24px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card-bg);
  color: var(--text);
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.load-more button:hover:not(:disabled) {
  background: var(--bg);
}

.load-more button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}
</style>

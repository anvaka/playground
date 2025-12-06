<template>
  <div class="search-container" :class="{ 'search-active': isActive }">
    <!-- Backdrop when search is active -->
    <div 
      v-if="isActive" 
      class="search-backdrop" 
      @click="closeSearch"
      aria-hidden="true"
    ></div>
    
    <!-- Search box - always visible -->
    <div class="search-box" :class="{ 'search-box-active': isActive }">
      <div class="search-input-wrapper">
        <!-- Search icon -->
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        
        <input 
          ref="inputRef"
          type="text" 
          v-model="query"
          :placeholder="placeholder"
          @input="onInput"
          @keydown="onKeyDown"
          @focus="onFocus"
          aria-label="Search for Chinese words or English meanings"
          aria-autocomplete="list"
          :aria-expanded="isActive && (results.length > 0 || (searched && query))"
          aria-controls="search-results"
        />
        
        <!-- Clear button - only when not in popup mode -->
        <button 
          v-if="query && !isActive"
          class="search-icon-btn"
          @click="clearSearch"
          type="button"
          aria-label="Clear search"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      
      <!-- Results dropdown - only shown when active -->
      <div 
        v-if="isActive" 
        id="search-results"
        class="search-results"
        role="listbox"
      >
        <!-- Dictionary results -->
        <div v-if="results.length > 0" class="dict-results">
          <div 
            v-for="(entry, index) in results" 
            :key="entry.simplified + entry.pinyin"
            class="dict-entry"
            :class="{ 'dict-entry-focused': focusedIndex === index }"
            @click="selectEntry(entry)"
            role="option"
            :aria-selected="focusedIndex === index"
          >
            <div class="dict-entry-head">
              <span class="dict-entry-char">{{ entry.simplified }}</span>
              <span v-if="entry.traditional !== entry.simplified" class="dict-entry-trad">
                ({{ entry.traditional }})
              </span>
              <span class="dict-entry-pinyin">{{ entry.pinyin }}</span>
            </div>
            <div class="dict-entry-def">{{ formatDefinitions(entry.definitions, 3) }}</div>
          </div>
        </div>
        
        <!-- No results state -->
        <div v-else-if="searched && query" class="search-empty-state">
          <p>No dictionary results for "{{ query }}"</p>
          <p class="search-hint">Press Enter to ask AI about this term</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { search, formatDefinitions } from '../services/dictionary.js'

const props = defineProps({
  placeholder: {
    type: String,
    default: 'Search Chinese or English...'
  }
})

const emit = defineEmits(['select', 'freeform'])

const inputRef = ref(null)
const query = ref('')
const results = ref([])
const searched = ref(false)
const isActive = ref(false)
const focusedIndex = ref(-1)

let debounceTimer = null

function onFocus() {
  // Only show popup if there's already content to display
  if (query.value.trim() || results.value.length > 0) {
    isActive.value = true
  }
}

function closeSearch() {
  isActive.value = false
  focusedIndex.value = -1
  inputRef.value?.blur()
}

function clearSearch() {
  query.value = ''
  results.value = []
  searched.value = false
  focusedIndex.value = -1
  isActive.value = false
  inputRef.value?.focus()
}

function onInput() {
  focusedIndex.value = -1
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    if (query.value.trim().length >= 1) {
      results.value = await search(query.value, 100)
      searched.value = true
      isActive.value = true  // Show popup when we have search results
    } else {
      results.value = []
      searched.value = false
      isActive.value = false  // Hide popup when input is cleared
    }
  }, 300)
}

function onKeyDown(e) {
  // Handle Escape - close search and prevent propagation
  if (e.key === 'Escape') {
    e.stopPropagation()
    if (query.value) {
      clearSearch()
    } else {
      closeSearch()
    }
    return
  }
  
  // Handle Enter - submit search
  if (e.key === 'Enter') {
    e.preventDefault()
    if (focusedIndex.value >= 0 && focusedIndex.value < results.value.length) {
      selectEntry(results.value[focusedIndex.value])
    } else {
      onSubmit()
    }
    return
  }
  
  // Handle arrow navigation
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    e.stopPropagation()
    if (results.value.length > 0) {
      isActive.value = true
      focusedIndex.value = Math.min(focusedIndex.value + 1, results.value.length - 1)
      scrollToFocused()
    }
    return
  }
  
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    e.stopPropagation()
    if (results.value.length > 0) {
      focusedIndex.value = Math.max(focusedIndex.value - 1, -1)
      scrollToFocused()
    }
    return
  }
}

async function onSubmit() {
  if (!query.value.trim()) return
  
  // If we have results, select the first one
  if (results.value.length > 0) {
    selectEntry(results.value[0])
  } else {
    // No dictionary results - use freeform/AI search
    emit('freeform', query.value)
    resetAndClose()
  }
}

function selectEntry(entry) {
  emit('select', entry)
  resetAndClose()
}

function resetAndClose() {
  results.value = []
  query.value = ''
  searched.value = false
  focusedIndex.value = -1
  isActive.value = false
}

function scrollToFocused() {
  if (focusedIndex.value < 0) return
  const container = document.getElementById('search-results')
  const focused = container?.querySelector('.dict-entry-focused')
  if (focused && container) {
    focused.scrollIntoView({ block: 'nearest' })
  }
}

function handleGlobalKeyDown(e) {
  // Focus search on Cmd/Ctrl + K
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    inputRef.value?.focus()
  }
}

/**
 * Prepopulate search with a query and trigger search
 * Used by external components to initiate a search
 */
async function prepopulateSearch(searchQuery) {
  query.value = searchQuery
  if (searchQuery.trim().length >= 1) {
    results.value = await search(searchQuery, 100)
    searched.value = true
    isActive.value = true
  }
  // Focus and scroll to top
  inputRef.value?.focus()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeyDown)
  clearTimeout(debounceTimer)
})

// Expose methods for parent components
defineExpose({
  prepopulateSearch
})
</script>

<style scoped>
.search-container {
  position: relative;
  margin-bottom: 20px;
  z-index: 50;
}

.search-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.25);
  z-index: 49;
}

.search-box {
  position: relative;
  z-index: 51;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.search-box:hover {
  border-color: var(--border-hover);
}

.search-box-active {
  border-color: var(--secondary);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  pointer-events: none;
  flex-shrink: 0;
}

.search-input-wrapper input {
  flex: 1;
  padding: 10px 40px 10px 40px;
  border: none;
  border-radius: var(--radius);
  background: transparent;
  font-size: 1rem;
}

.search-input-wrapper input:focus {
  outline: none;
}

.search-input-wrapper input::placeholder {
  color: var(--text-muted);
}

.search-icon-btn {
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius);
  transition: color 0.15s ease;
}

.search-icon-btn:hover {
  color: var(--text);
}

.search-results {
  border-top: 1px solid var(--border);
  max-height: 60vh;
  overflow-y: auto;
}

.dict-results {
  margin: 0;
}

.dict-entry {
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.dict-entry:hover {
  background: var(--bg);
}

.dict-entry-focused {
  background: var(--secondary);
  color: white;
}

.dict-entry-focused .dict-entry-trad,
.dict-entry-focused .dict-entry-pinyin,
.dict-entry-focused .dict-entry-def {
  color: rgba(255, 255, 255, 0.9);
}

.dict-entry-head {
  display: flex;
  gap: var(--spacing-sm);
  align-items: baseline;
  flex-wrap: wrap;
}

.dict-entry-char {
  font-size: 1.4rem;
  font-weight: 500;
}

.dict-entry-trad {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.dict-entry-pinyin {
  color: var(--secondary);
  font-size: 0.95rem;
}

.dict-entry-def {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-top: 4px;
  line-height: 1.4;
}

.search-empty-state {
  padding: 24px 16px;
  text-align: center;
  color: var(--text-muted);
}

.search-empty-state p {
  margin: 0;
}

.search-hint {
  font-size: 0.85rem;
  color: var(--secondary);
  margin-top: 8px;
}

/* Mobile adjustments */
@media (max-width: 600px) {
  .search-results {
    max-height: 50vh;
  }
  
  .dict-entry-char {
    font-size: 1.3rem;
  }
}
</style>

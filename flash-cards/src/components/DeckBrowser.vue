<template>
  <div class="deck-browser">
    <!-- Your Cards Section -->
    <section class="deck-section" v-if="userCards.length > 0 || userTrivia.length > 0">
      <h2 class="section-title">Your Cards</h2>
      <div class="deck-grid">
        <!-- Vocabulary deck -->
        <div 
          v-if="userCards.length > 0"
          class="deck-tile"
          @click="$emit('openDeck', { type: 'user', filter: 'vocabulary' })"
        >
        <div class="deck-tile-title">Words</div>
          <div class="deck-tile-count">{{ userCards.length }}</div>
        </div>
        
        <!-- Trivia deck -->
        <div 
          v-if="userTrivia.length > 0"
          class="deck-tile"
          @click="$emit('openDeck', { type: 'user', filter: 'trivia' })"
        >
        <div class="deck-tile-title">Questions</div>
          <div class="deck-tile-count">{{ userTrivia.length }}</div>
        </div>
        
        <!-- All cards -->
        <div 
          v-if="userCards.length > 0 || userTrivia.length > 0"
          class="deck-tile deck-tile-all"
          @click="$emit('openDeck', { type: 'user', filter: 'all' })"
        >
        <div class="deck-tile-title">All</div>
          <div class="deck-tile-count">{{ userCards.length + userTrivia.length }}</div>
        </div>
      </div>
    </section>
    
    <!-- HSK Decks Section -->
    <section class="deck-section">
      <h2 class="section-title">HSK Decks</h2>
      <div class="deck-grid">
        <div 
          v-for="level in availableHskLevels"
          :key="level"
          class="deck-tile deck-tile-hsk"
          :class="{ 'loading': loadingLevels.has(level) }"
          @click="openHskDeck(level)"
        >
          <div class="deck-tile-badge">HSK {{ level }}</div>
          <div class="deck-tile-count" v-if="hskStats[level]">
            {{ hskStats[level].totalCards }} cards
          </div>
          <div class="deck-tile-count loading-text" v-else>
            Loading...
          </div>
        </div>
        
        <!-- Coming soon placeholders -->
        <div 
          v-for="level in comingSoonLevels"
          :key="'soon-' + level"
          class="deck-tile deck-tile-hsk deck-tile-disabled"
        >
          <div class="deck-tile-badge">HSK {{ level }}</div>
          <div class="deck-tile-count">Coming soon</div>
        </div>
      </div>
    </section>
    
    <!-- Games Section -->
    <section class="deck-section">
      <h2 class="section-title">Games</h2>
      <div class="games-grid">
        <div 
          class="game-tile"
          @click="$emit('openGames')"
        >
          <div class="game-tile-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
              <path d="M10 6.5h4M10 17.5h4" stroke-dasharray="2 2"/>
            </svg>
          </div>
          <div class="game-tile-title">Flash Match</div>
          <div class="game-tile-desc">Match characters with pinyin or English meanings. Race against the clock!</div>
        </div>
        
        <!-- Future games (disabled) -->
        <div class="game-tile game-tile-disabled">
          <div class="game-tile-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
              <path d="M9 9h6M9 12h6M9 15h3"/>
            </svg>
          </div>
          <div class="game-tile-title">Type It</div>
          <div class="game-tile-desc">Type the pinyin for displayed characters</div>
        </div>
        
        <div class="game-tile game-tile-disabled">
          <div class="game-tile-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div class="game-tile-title">Flash Cards</div>
          <div class="game-tile-desc">Classic flashcard review with spaced repetition</div>
        </div>
        
        <div class="game-tile game-tile-disabled">
          <div class="game-tile-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3 8-8"/>
              <path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9"/>
            </svg>
          </div>
          <div class="game-tile-title">Multiple Choice</div>
          <div class="game-tile-desc">Choose the correct meaning from four options</div>
        </div>
      </div>
    </section>
    
    <!-- Reader Section -->
    <section class="deck-section">
      <h2 class="section-title">Reader</h2>
      <div class="games-grid">
        <div 
          class="game-tile"
          @click="$emit('openReader')"
        >
          <div class="game-tile-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <div class="game-tile-title">Reader</div>
          <div class="game-tile-desc">Paste any text and read it at your level with word-by-word translations</div>
        </div>
      </div>
    </section>
    
    <!-- Empty state -->
    <div v-if="userCards.length === 0 && userTrivia.length === 0" class="empty-hint">
      <p>Search for a word above to create your first flashcard</p>
      <p class="text-muted">Or browse the HSK decks to get started</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAvailableLevels, loadHskDeck, getHskDeckStats } from '../services/hsk.js'

const props = defineProps({
  userCards: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['openDeck', 'openCard', 'openGames', 'openReader'])

// HSK state
const availableHskLevels = ref([])
const hskStats = ref({})
const loadingLevels = ref(new Set())

// Computed: separate vocabulary from trivia
const userVocabulary = computed(() => 
  props.userCards.filter(c => c.type !== 'trivia')
)

// Alias for template (vocabulary/phrase cards)
const userCards = computed(() => userVocabulary.value)

const userTrivia = computed(() => 
  props.userCards.filter(c => c.type === 'trivia')
)

// Levels not yet available
const comingSoonLevels = computed(() => {
  const available = new Set(availableHskLevels.value)
  return [3, 4, 5, 6].filter(l => !available.has(l))
})

onMounted(async () => {
  // Get available levels
  availableHskLevels.value = getAvailableLevels()
  
  // Load stats for each level
  for (const level of availableHskLevels.value) {
    loadingLevels.value.add(level)
    try {
      const stats = await getHskDeckStats(level)
      hskStats.value[level] = stats
    } catch (err) {
      console.error(`Failed to load HSK ${level} stats:`, err)
    } finally {
      loadingLevels.value.delete(level)
    }
  }
})

function openHskDeck(level) {
  if (loadingLevels.value.has(level)) return
  emit('openDeck', { type: 'hsk', level })
}
</script>

<style scoped>
.deck-browser {
  padding: 8px 0;
}

.deck-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.deck-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.deck-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px var(--spacing-lg);
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
  min-width: 100px;
}

.deck-tile:hover {
  border-color: var(--secondary);
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}

.deck-tile-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 4px;
}

.deck-tile-count {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.deck-tile-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.3;
}

/* Games grid - uniform tile sizes */
.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-sm);
}

.game-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.game-tile:hover:not(.game-tile-disabled) {
  border-color: var(--primary);
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}

.game-tile-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.game-tile-disabled:hover {
  transform: none;
  box-shadow: none;
}

.game-tile-icon {
  width: 32px;
  height: 32px;
  margin-bottom: var(--spacing-sm);
  color: var(--primary);
}

.game-tile-disabled .game-tile-icon {
  color: var(--text-muted);
}

.game-tile-icon svg {
  width: 100%;
  height: 100%;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.game-tile-title {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 4px;
}

.game-tile-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.4;
}

.deck-tile-all {
  background: var(--bg);
}

/* HSK deck tiles */
.deck-tile-hsk {
  min-width: 120px;
  background: var(--card-bg);
  border: 2px solid var(--secondary);
}

.deck-tile-hsk:hover {
  background: var(--bg);
}

.deck-tile-hsk .deck-tile-badge {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  color: var(--secondary);
}

.deck-tile-hsk .deck-tile-count {
  color: var(--text-muted);
}

.deck-tile-hsk.loading {
  opacity: 0.7;
}

.deck-tile-disabled {
  background: var(--bg);
  border-color: var(--border);
  border-width: 1px;
  cursor: not-allowed;
  opacity: 0.5;
}

.deck-tile-disabled:hover {
  transform: none;
  box-shadow: none;
  border-color: var(--border);
}

.deck-tile-disabled .deck-tile-badge {
  color: var(--text-muted);
}

.deck-tile-disabled .deck-tile-count {
  color: var(--text-muted);
}

.deck-tile-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 8px;
  color: var(--primary);
}

.deck-tile-icon svg {
  width: 100%;
  height: 100%;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.loading-text {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.empty-hint {
  text-align: center;
  padding: var(--spacing-lg) 20px;
  color: var(--text-muted);
}

.empty-hint p {
  margin-bottom: var(--spacing-sm);
}
</style>

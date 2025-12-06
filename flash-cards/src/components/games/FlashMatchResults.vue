<template>
  <div class="flash-match-results">
    <h2>Game Over</h2>
    
    <!-- Score Summary -->
    <div class="results-summary">
      <div class="result-stat result-accuracy">
        <span class="stat-value">{{ accuracyPercent }}%</span>
        <span class="stat-label">Accuracy</span>
      </div>
      
      <div class="result-stat">
        <span class="stat-value stat-correct">{{ game.correct.value }}</span>
        <span class="stat-label">Correct</span>
      </div>
      
      <div class="result-stat">
        <span class="stat-value stat-incorrect">{{ game.incorrect.value }}</span>
        <span class="stat-label">Wrong</span>
      </div>
    </div>
    
    <!-- Best Score Comparison -->
    <div v-if="bestScore" class="best-score-comparison">
      <template v-if="isNewBest">
        <span class="new-best-badge">New Best!</span>
      </template>
      <template v-else>
        <span class="best-label">Best: {{ bestScorePercent }}% ({{ bestScore.correct }} correct)</span>
      </template>
    </div>
    
    <!-- Problem Words -->
    <section v-if="problemCards.length > 0" class="results-section">
      <h3>Words to Practice</h3>
      <p class="section-hint">These words were missed multiple times</p>
      
      <div class="problem-words">
        <a 
          v-for="card in problemCards" 
          :key="card.cardId"
          :href="'?card=' + encodeURIComponent(card.character)"
          class="problem-word"
          @click.prevent="navigateToCard(card.character)"
        >
          <span class="problem-char">{{ card.character }}</span>
          <span class="problem-count">missed {{ card.count }}x</span>
        </a>
      </div>
    </section>
    
    <!-- Game Config Summary -->
    <div class="game-config">
      <span>{{ formatMode(game.mode.value, game.hidePinyin.value) }}</span>
      <span class="config-separator">|</span>
      <span>{{ formatTags(game.selectedTags.value) }}</span>
      <span class="config-separator">|</span>
      <span>{{ game.timeLimit.value }}s</span>
    </div>
    
    <!-- Actions -->
    <div class="results-actions">
      <button class="btn btn-small" @click="$emit('back')">← Back</button>
      <button class="btn btn-small" @click="$emit('setup')">Change Settings</button>
      <button class="btn btn-primary" @click="$emit('playAgain')">Play Again</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getBestScore } from '../../services/gameStats.js'
import { getAvailableTags } from '../../services/cardPool.js'

const props = defineProps({
  game: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['back', 'setup', 'playAgain', 'navigateToCard'])

const bestScore = ref(null)
const availableTags = ref([])

// Computed
const accuracyPercent = computed(() => {
  return Math.round(props.game.accuracy.value * 100)
})

const bestScorePercent = computed(() => {
  if (!bestScore.value) return 0
  return Math.round(bestScore.value.accuracy * 100)
})

const isNewBest = computed(() => {
  if (!bestScore.value) return true
  // New best if higher accuracy, or same accuracy with more correct
  if (props.game.accuracy.value > bestScore.value.accuracy) return true
  if (props.game.accuracy.value === bestScore.value.accuracy && 
      props.game.correct.value > bestScore.value.correct) return true
  return false
})

const problemCards = computed(() => {
  return props.game.getSessionProblemCards()
})

onMounted(async () => {
  // Load best score for comparison (before this game was recorded)
  // Note: The current game has already been recorded, so we fetch again
  bestScore.value = getBestScore(
    props.game.mode.value,
    props.game.selectedTags.value,
    props.game.hidePinyin.value
  )
  
  availableTags.value = getAvailableTags()
})

function formatMode(mode, hidePinyin) {
  if (mode === 'hanzi-pinyin') return 'Hanzi → Pinyin'
  return hidePinyin ? 'Hanzi → English' : 'Hanzi+Pinyin → English'
}

function formatTags(tags) {
  return tags.map(t => {
    const tag = availableTags.value.find(at => at.id === t)
    return tag ? tag.label : t
  }).join(', ')
}

function navigateToCard(character) {
  emit('navigateToCard', character)
}
</script>

<style scoped>
.flash-match-results {
  max-width: 500px;
  margin: 0 auto;
  text-align: center;
}

.flash-match-results h2 {
  margin-bottom: 24px;
}

/* Score Summary */
.results-summary {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.result-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 600;
}

.result-accuracy .stat-value {
  font-size: 3rem;
  color: var(--secondary);
}

.stat-correct {
  color: var(--success);
}

.stat-incorrect {
  color: var(--danger);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Best score */
.best-score-comparison {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg);
  border-radius: var(--radius);
  display: inline-block;
}

.new-best-badge {
  color: var(--success);
  font-weight: 600;
}

.best-label {
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* Problem words section */
.results-section {
  text-align: left;
  margin: var(--spacing-lg) 0;
  padding: var(--spacing-md);
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.results-section h3 {
  font-size: 1rem;
  margin-bottom: 4px;
}

.section-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: var(--spacing-sm);
}

.problem-words {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.problem-word {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-sm) 12px;
  background: rgba(220, 53, 69, 0.05);
  border: 1px solid rgba(220, 53, 69, 0.2);
  border-radius: var(--radius);
  text-decoration: none;
  color: inherit;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.problem-word:hover {
  background: rgba(220, 53, 69, 0.1);
  border-color: var(--danger);
}

.problem-char {
  font-size: 1.25rem;
}

.problem-count {
  font-size: 0.75rem;
  color: var(--danger);
}

/* Game config */
.game-config {
  margin: 24px 0;
  padding: 12px;
  background: var(--bg);
  border-radius: var(--radius);
  font-size: 0.9rem;
  color: var(--text-muted);
}

.config-separator {
  margin: 0 var(--spacing-sm);
  opacity: 0.5;
}

/* Actions */
.results-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}
</style>

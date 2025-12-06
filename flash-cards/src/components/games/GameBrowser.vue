<template>
  <div class="game-browser">
    <div class="game-browser-header">
      <button class="btn btn-small" @click="$emit('back')">← Back</button>
      <h2>Games</h2>
    </div>
    
    <p class="games-intro">Practice your Chinese vocabulary with interactive games</p>
    
    <div class="games-grid">
      <!-- Flash Match -->
      <div class="game-tile" @click="$emit('selectGame', 'flash-match')">
        <div class="game-tile-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
            <path d="M10 6.5h4M10 17.5h4" stroke-dasharray="2 2"/>
          </svg>
        </div>
        <div class="game-tile-content">
          <h3>Flash Match</h3>
          <p>Match characters with pinyin or English meanings. Race against the clock!</p>
        </div>
        <div v-if="flashMatchBest" class="game-tile-stats">
          Best: {{ flashMatchBest.accuracy }}% accuracy
        </div>
      </div>
      
      <!-- Future games (disabled) -->
      <div class="game-tile game-tile-disabled">
        <div class="game-tile-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="4" width="16" height="16" rx="2"/>
            <path d="M9 9h6M9 12h6M9 15h3"/>
          </svg>
        </div>
        <div class="game-tile-content">
          <h3>Type It</h3>
          <p>Type the pinyin for displayed characters</p>
        </div>
        <div class="game-tile-coming">Coming soon</div>
      </div>
      
      <div class="game-tile game-tile-disabled">
        <div class="game-tile-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <div class="game-tile-content">
          <h3>Flash Cards</h3>
          <p>Classic flashcard review with spaced repetition</p>
        </div>
        <div class="game-tile-coming">Coming soon</div>
      </div>
      
      <div class="game-tile game-tile-disabled">
        <div class="game-tile-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3 8-8"/>
            <path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9"/>
          </svg>
        </div>
        <div class="game-tile-content">
          <h3>Multiple Choice</h3>
          <p>Choose the correct meaning from four options</p>
        </div>
        <div class="game-tile-coming">Coming soon</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getRecentScores } from '../../services/gameStats.js'

defineEmits(['back', 'selectGame'])

const flashMatchBest = ref(null)

onMounted(() => {
  // Get best flash match score
  const scores = getRecentScores(50)
  const flashMatchScores = scores.filter(s => s.mode)
  
  if (flashMatchScores.length > 0) {
    flashMatchBest.value = flashMatchScores.reduce((best, current) => {
      if (!best || current.accuracy > best.accuracy) return current
      return best
    }, null)
    
    if (flashMatchBest.value) {
      flashMatchBest.value = {
        accuracy: Math.round(flashMatchBest.value.accuracy * 100)
      }
    }
  }
})
</script>

<style scoped>
.game-browser {
  padding: 8px 0;
}

.game-browser-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: 20px;
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border);
}

.game-browser-header h2 {
  flex: 1;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.games-intro {
  color: var(--text-muted);
  margin-bottom: 24px;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-md);
}

.game-tile {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.game-tile:hover:not(.game-tile-disabled) {
  border-color: var(--secondary);
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}

.game-tile-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.game-tile-icon {
  width: 48px;
  height: 48px;
  margin-bottom: var(--spacing-sm);
  color: var(--secondary);
}

.game-tile-icon svg {
  width: 100%;
  height: 100%;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.game-tile-disabled .game-tile-icon {
  color: var(--text-muted);
}

.game-tile-content h3 {
  font-size: 1.1rem;
  margin-bottom: 4px;
}

.game-tile-content p {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0;
}

.game-tile-stats {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 0.85rem;
  color: var(--secondary);
}

.game-tile-coming {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 0.85rem;
  color: var(--text-muted);
  font-style: italic;
}
</style>

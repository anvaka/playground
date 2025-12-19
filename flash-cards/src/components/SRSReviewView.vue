<template>
  <div class="srs-review">
    <!-- Session complete -->
    <div v-if="sessionComplete" class="review-complete">
      <div class="complete-icon">🎉</div>
      <h2>Session Complete!</h2>
      <div class="session-stats">
        <div class="stat">
          <span class="stat-value">{{ sessionStats.reviewed }}</span>
          <span class="stat-label">Reviewed</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ sessionStats.correct }}</span>
          <span class="stat-label">Correct</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ sessionStats.again }}</span>
          <span class="stat-label">Again</span>
        </div>
      </div>
      <button class="btn btn-primary" @click="$emit('done')">Done</button>
    </div>

    <!-- No cards to review -->
    <div v-else-if="!currentCard" class="review-empty">
      <div class="empty-icon">✓</div>
      <h2>All caught up!</h2>
      <p>No cards due for review.</p>
      <button class="btn" @click="$emit('done')">Back to Cards</button>
    </div>

    <!-- Review card -->
    <div v-else class="review-card-container">
      <!-- Progress -->
      <div class="review-progress">
        <span>{{ currentIndex + 1 }} / {{ totalCards }}</span>
      </div>

      <!-- Card display -->
      <div class="review-card" :class="{ revealed: isRevealed }">
        <!-- Front (always visible) -->
        <div class="card-front">
          <div class="card-character">{{ cardInfo.character }}</div>
          <div v-if="cardInfo.pinyin && isRevealed" class="card-pinyin">{{ cardInfo.pinyin }}</div>
          <button 
            v-if="cardInfo.character && speechSupported" 
            class="speak-btn" 
            @click.stop="speak(cardInfo.character)"
            :disabled="isSpeaking"
            title="Listen"
          >
            <svg class="speak-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          </button>
        </div>

        <!-- Back (revealed on click) -->
        <div v-if="isRevealed" class="card-back">
          <div class="card-content markdown-content" v-html="renderedBack"></div>
        </div>

        <!-- Tap to reveal -->
        <button 
          v-if="!isRevealed" 
          class="reveal-btn"
          @click="reveal"
        >
          Tap to reveal
        </button>
      </div>

      <!-- Grade buttons (shown after reveal) -->
      <div v-if="isRevealed" class="grade-buttons">
        <button class="grade-btn grade-again" @click="grade(Quality.AGAIN)" title="Resets progress — you'll see this card again soon">
          <span class="grade-label">I forgot</span>
          <span class="grade-interval">{{ intervals[Quality.AGAIN] }}</span>
        </button>
        <div class="grade-divider"></div>
        <button class="grade-btn grade-hard" @click="grade(Quality.HARD)" title="Card advances but will appear sooner than usual">
          <span class="grade-label">I struggled</span>
          <span class="grade-interval">{{ intervals[Quality.HARD] }}</span>
        </button>
        <button class="grade-btn grade-good" @click="grade(Quality.GOOD)" title="Card advances on normal schedule">
          <span class="grade-label">I remembered</span>
          <span class="grade-interval">{{ intervals[Quality.GOOD] }}</span>
        </button>
        <button class="grade-btn grade-easy" @click="grade(Quality.EASY)" title="Card advances with longer delay — use when recall was instant">
          <span class="grade-label">Instant recall</span>
          <span class="grade-interval">{{ intervals[Quality.EASY] }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getDueCards } from '../services/markdownStorage.js'
import { Quality, reviewCard, previewIntervals, formatInterval } from '../services/srs.js'
import { renderMarkdown, parseCardSections, extractFrontInfo } from '../services/cardMarkdown.js'
import { useSpeech } from '../composables/useSpeech.js'

const emit = defineEmits(['done'])

const { speak, isSpeaking, isSupported: speechSupported } = useSpeech()

// Review queue
const reviewQueue = ref([])
const currentIndex = ref(0)
const isRevealed = ref(false)
const sessionComplete = ref(false)

// Session stats
const sessionStats = ref({
  reviewed: 0,
  correct: 0,
  again: 0
})

const currentCard = computed(() => reviewQueue.value[currentIndex.value] || null)
const totalCards = computed(() => reviewQueue.value.length)

// Extract card info from markdown content
const cardInfo = computed(() => {
  if (!currentCard.value) return { character: '', pinyin: '' }
  const sections = parseCardSections(currentCard.value.content || '')
  return extractFrontInfo(sections.front)
})

// Render back of card (everything except front)
const renderedBack = computed(() => {
  if (!currentCard.value) return ''
  const content = currentCard.value.content || ''
  // Remove #Front section for back display
  const backContent = content.replace(/^#\s*Front[\s\S]*?(?=^#[^#]|\Z)/m, '').trim()
  return renderMarkdown(backContent)
})

// Preview intervals for grade buttons
const intervals = computed(() => {
  if (!currentCard.value) return {}
  const preview = previewIntervals(currentCard.value)
  return {
    [Quality.AGAIN]: formatInterval(preview[Quality.AGAIN]),
    [Quality.HARD]: formatInterval(preview[Quality.HARD]),
    [Quality.GOOD]: formatInterval(preview[Quality.GOOD]),
    [Quality.EASY]: formatInterval(preview[Quality.EASY])
  }
})

function reveal() {
  isRevealed.value = true
}

function grade(quality) {
  if (!currentCard.value) return
  
  // Apply SRS update
  const updated = reviewCard(currentCard.value, quality)
  
  // Update stats
  sessionStats.value.reviewed++
  if (quality >= Quality.HARD) {
    sessionStats.value.correct++
  } else {
    sessionStats.value.again++
  }
  
  // Move to next card
  if (currentIndex.value < reviewQueue.value.length - 1) {
    currentIndex.value++
    isRevealed.value = false
  } else {
    sessionComplete.value = true
  }
}

// Load due cards on mount
onMounted(() => {
  const due = getDueCards()
  // Shuffle for variety
  reviewQueue.value = due.sort(() => Math.random() - 0.5)
})
</script>

<style scoped>
.srs-review {
  max-width: 500px;
  margin: 0 auto;
  padding: 16px;
}

/* Progress */
.review-progress {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-bottom: 16px;
}

/* Card container */
.review-card-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Card */
.review-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 12px);
  padding: 24px;
  min-height: 300px;
  display: flex;
  flex-direction: column;
}

.card-front {
  text-align: center;
  padding: 20px 0;
}

.card-character {
  font-size: 4rem;
  font-weight: 300;
  line-height: 1.2;
  margin-bottom: 8px;
}

.card-pinyin {
  font-size: 1.25rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.speak-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--bg);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.speak-btn:hover:not(:disabled) {
  background: var(--secondary);
  color: white;
}

.speak-icon {
  width: 18px;
  height: 18px;
}

.card-back {
  flex: 1;
  border-top: 1px solid var(--border);
  padding-top: 16px;
  margin-top: 16px;
  overflow-y: auto;
}

.card-content {
  font-size: 0.95rem;
  line-height: 1.6;
}

.reveal-btn {
  margin-top: auto;
  padding: 16px;
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  background: transparent;
  color: var(--text-muted);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.reveal-btn:hover {
  border-color: var(--secondary);
  color: var(--secondary);
}

/* Grade buttons */
.grade-buttons {
  display: flex;
  gap: 8px;
}

.grade-divider {
  width: 1px;
  background: var(--border);
  margin: 4px 4px;
}

.grade-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card-bg);
  color: var(--text);
  cursor: pointer;
  transition: all 0.15s ease;
}

.grade-btn:hover {
  background: var(--secondary);
  color: white;
  border-color: var(--secondary);
}

.grade-label {
  font-weight: 500;
  font-size: 0.9rem;
}

.grade-interval {
  font-size: 0.75rem;
  opacity: 0.7;
}

/* Empty / Complete states */
.review-empty,
.review-complete {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon,
.complete-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.review-empty h2,
.review-complete h2 {
  margin: 0 0 8px;
  font-weight: 500;
}

.review-empty p {
  color: var(--text-muted);
  margin: 0 0 24px;
}

/* Session stats */
.session-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin: 24px 0;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 600;
  color: var(--secondary);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

</style>

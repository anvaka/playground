<template>
  <div class="flash-match-game">
    <!-- Header -->
    <div class="game-header">
      <button class="btn btn-small" @click="handleQuit">Quit</button>
      
      <div class="game-timer" :class="{ 'low-time': game.isLowTime.value }">
        {{ formatTime(game.timeRemainingSeconds.value) }}
      </div>
      
      <div class="game-score">
        <span class="score-correct">{{ game.correct.value }}</span>
        <span class="score-separator">/</span>
        <span class="score-total">{{ game.totalAttempts.value }}</span>
      </div>
      
      <button 
        class="btn btn-small audio-toggle"
        :class="{ active: game.audioEnabled.value }"
        @click="toggleAudio"
        title="Toggle pronunciation audio"
      >
        <svg v-if="game.audioEnabled.value" class="audio-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 5L6 9H2v6h4l5 4V5z"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        </svg>
        <svg v-else class="audio-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 5L6 9H2v6h4l5 4V5z"/>
          <line x1="23" y1="9" x2="17" y2="15"/>
          <line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
      </button>
    </div>
    
    <!-- Game Mode Indicator -->
    <div class="mode-indicator">
      {{ modeLabel }}
      <span v-if="props.game.comboCount.value > 0" class="combo-indicator">
        {{ props.game.comboCount.value }}x combo
      </span>
    </div>
    
    <!-- Game Board -->
    <div class="game-board">
      <!-- Left Column (Hanzi) - iterate by slot index -->
      <div class="game-column left-column">
        <div 
          v-for="(slot, index) in game.slots.value"
          :key="'left-' + index"
          class="game-slot"
          :class="getSlotClass(index, slot, 'left')"
          @click="handleLeftClick(index, slot)"
        >
          <template v-if="slot && slot.state === 'active'">
            <span class="slot-character">{{ slot.card.character }}</span>
            <span v-if="showLeftPinyin" class="slot-pinyin">{{ slot.card.pinyin }}</span>
          </template>
          <template v-else-if="slot && slot.state === 'cooldown'">
            <span class="slot-character slot-faded">{{ slot.card.character }}</span>
            <span v-if="showLeftPinyin" class="slot-pinyin slot-faded">{{ slot.card.pinyin }}</span>
          </template>
          <template v-else>
            <span class="slot-empty-placeholder">&nbsp;</span>
          </template>
        </div>
      </div>
      
      <!-- Right Column (Pinyin or English) - iterate by display position, map to slot -->
      <div class="game-column right-column">
        <div 
          v-for="(slotIndex, displayIndex) in game.rightColumnOrder.value"
          :key="'right-' + displayIndex"
          class="game-slot"
          :class="getSlotClass(slotIndex, game.slots.value[slotIndex], 'right', displayIndex)"
          @click="handleRightClick(displayIndex, slotIndex)"
        >
          <template v-if="game.slots.value[slotIndex] && game.slots.value[slotIndex].state === 'active'">
            <span class="slot-text">{{ game.getRightDisplayText(game.slots.value[slotIndex].card) }}</span>
          </template>
          <template v-else-if="game.slots.value[slotIndex] && game.slots.value[slotIndex].state === 'cooldown'">
            <span class="slot-text slot-faded">{{ game.getRightDisplayText(game.slots.value[slotIndex].card) }}</span>
          </template>
          <template v-else>
            <span class="slot-empty-placeholder">&nbsp;</span>
          </template>
        </div>
      </div>
    </div>
    
    <!-- Wrong answer feedback -->
    <div v-if="showWrongFeedback" class="wrong-feedback">
      -3 seconds!
    </div>
    
    <!-- Start overlay (before game starts) -->
    <div v-if="!gameStarted" class="start-overlay">
      <div class="start-content">
        <h3>Ready?</h3>
        <p>Match the {{ game.mode.value === 'hanzi-pinyin' ? 'characters with pinyin' : 'characters with meanings' }}</p>
        <button class="btn btn-primary btn-large" @click="startGame">
          Start
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useSpeech } from '../../composables/useSpeech.js'

const props = defineProps({
  game: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['quit', 'finished'])

const { speak } = useSpeech()

const gameStarted = ref(false)
const showWrongFeedback = ref(false)

// Computed
const modeLabel = computed(() => {
  if (props.game.mode.value === 'hanzi-pinyin') {
    return 'Match Hanzi with Pinyin'
  }
  return props.game.hidePinyin.value 
    ? 'Match Hanzi with English' 
    : 'Match Hanzi + Pinyin with English'
})

const showLeftPinyin = computed(() => {
  return props.game.mode.value === 'hanzi-english' && !props.game.hidePinyin.value
})

// Watch for game end
watch(() => props.game.status.value, (newStatus) => {
  if (newStatus === 'finished') {
    emit('finished')
  }
})

// Audio is now played on left click, no need to play again on match

// Watch for wrong matches to show feedback
watch(() => props.game.incorrect.value, (newIncorrect, oldIncorrect) => {
  if (newIncorrect > oldIncorrect) {
    showWrongFeedback.value = true
    setTimeout(() => {
      showWrongFeedback.value = false
    }, 1000)
  }
})

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function startGame() {
  gameStarted.value = true
  props.game.startGame()
}

function handleLeftClick(index, slot) {
  if (!gameStarted.value) return
  if (!slot || slot.state !== 'active') return
  
  // Speak the character immediately when clicked
  if (props.game.audioEnabled.value) {
    speak(slot.card.character)
  }
  
  props.game.selectLeft(index)
  
  // Check if this completes a match
  checkForMatch(index)
}

function handleRightClick(orderIndex, slotIndex) {
  if (!gameStarted.value) return
  const slot = props.game.slots.value[slotIndex]
  if (!slot || slot.state !== 'active') return
  
  props.game.selectRight(orderIndex)
  
  // Check if this completes a match
  checkForMatch(null, orderIndex)
}

function checkForMatch(leftIndex, rightOrderIndex) {
  // Match checking is handled by the game composable
  // Audio is played on left click, not on match
}

function getSlotClass(slotIndex, slot, column, displayIndex = null) {
  const classes = []
  
  if (!slot || slot.state === 'empty') {
    classes.push('slot-empty-state')
  } else if (slot.state === 'cooldown') {
    classes.push('slot-cooldown')
  } else if (slot.state === 'active') {
    // Check selection
    if (column === 'left' && props.game.selectedLeft.value === slotIndex) {
      classes.push('slot-selected')
    } else if (column === 'right' && props.game.selectedRight.value === displayIndex) {
      classes.push('slot-selected')
    }
  }
  
  return classes
}

function toggleAudio() {
  props.game.audioEnabled.value = !props.game.audioEnabled.value
  props.game.persistSettings()
}

function handleQuit() {
  if (gameStarted.value && props.game.status.value === 'playing') {
    if (!confirm('Quit the current game? Your progress will be lost.')) {
      return
    }
    props.game.endGame()
  }
  emit('quit')
}

onUnmounted(() => {
  // Clean up if component is destroyed while game is running
  if (props.game.status.value === 'playing') {
    props.game.endGame()
  }
})
</script>

<style scoped>
.flash-match-game {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

/* Header */
.game-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: 12px var(--spacing-md);
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: var(--spacing-md);
}

.game-timer {
  font-size: 1.5rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  min-width: 60px;
  text-align: center;
}

.game-timer.low-time {
  color: var(--danger);
  animation: pulse-timer 0.5s ease-in-out infinite;
}

@keyframes pulse-timer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.game-score {
  flex: 1;
  text-align: center;
  font-size: 1.1rem;
}

.score-correct {
  color: var(--success);
  font-weight: 600;
}

.score-separator {
  color: var(--text-muted);
  margin: 0 4px;
}

.score-total {
  color: var(--text-muted);
}

.audio-toggle {
  padding: 6px;
}

.audio-toggle.active {
  color: var(--secondary);
}

.audio-icon {
  width: 20px;
  height: 20px;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Mode indicator */
.mode-indicator {
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: var(--spacing-md);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-sm);
}

.combo-indicator {
  color: var(--warning);
  font-weight: 600;
  animation: combo-pulse 0.3s ease-out;
}

@keyframes combo-pulse {
  0% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

/* Game board */
.game-board {
  display: flex;
  gap: var(--spacing-lg);
  justify-content: center;
}

.game-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.left-column {
  align-items: flex-end;
  width: 200px;
}

.right-column {
  align-items: flex-start;
  width: 200px;
}

/* Slots */
.game-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80px;
  padding: 12px var(--spacing-md);
  background: var(--card-bg);
  border: 2px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease, opacity 0.5s ease;
  user-select: none;
}

.left-column .game-slot {
  width: 100%;
}

.right-column .game-slot {
  width: 100%;
}

.game-slot:hover:not(.slot-empty-state):not(.slot-cooldown) {
  border-color: var(--secondary);
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.game-slot.slot-selected {
  border-color: var(--secondary);
  background: rgba(52, 152, 219, 0.1);
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.game-slot.slot-cooldown {
  background: rgba(40, 167, 69, 0.05);
  border-color: var(--success);
  border-style: dashed;
  cursor: default;
  opacity: 0.4;
}

.game-slot.slot-empty-state {
  background: var(--bg);
  border-style: dashed;
  cursor: default;
  opacity: 0.3;
}

.slot-character {
  font-size: 2rem;
  line-height: 1.2;
}

.slot-pinyin {
  font-size: 0.9rem;
  color: var(--secondary);
  margin-top: 4px;
}

.slot-text {
  font-size: 1rem;
  text-align: center;
  line-height: 1.3;
}

.slot-faded {
  opacity: 0.5;
}

.slot-empty-placeholder {
  /* Maintains height when slot is empty */
  min-height: 2rem;
}

/* Wrong feedback */
.wrong-feedback {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 16px 32px;
  background: var(--danger);
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  border-radius: var(--radius);
  animation: shake 0.3s ease-in-out, fadeOut 1s ease-in-out forwards;
  z-index: 100;
}

@keyframes shake {
  0%, 100% { transform: translate(-50%, -50%) translateX(0); }
  25% { transform: translate(-50%, -50%) translateX(-10px); }
  75% { transform: translate(-50%, -50%) translateX(10px); }
}

@keyframes fadeOut {
  0%, 70% { opacity: 1; }
  100% { opacity: 0; }
}

/* Start overlay */
.start-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
  z-index: 50;
}

.start-content {
  text-align: center;
}

.start-content h3 {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-sm);
}

.start-content p {
  color: var(--text-muted);
  margin-bottom: var(--spacing-lg);
}

.btn-large {
  padding: 12px var(--spacing-lg);
  font-size: 1.1rem;
}

/* Responsive */
@media (max-width: 500px) {
  .game-board {
    gap: var(--spacing-sm);
  }
  
  .left-column,
  .right-column {
    width: 140px;
  }
  
  .game-slot {
    height: 70px;
    padding: var(--spacing-sm) 12px;
  }
  
  .slot-character {
    font-size: 1.5rem;
  }
  
  .slot-text {
    font-size: 0.85rem;
  }
}
</style>

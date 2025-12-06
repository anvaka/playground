/**
 * Flash Match game composable - manages game state, timing, and scoring
 */

import { ref, computed, watch } from 'vue'
import { getFlashMatchCards, shuffleArray } from '../services/cardPool.js'
import { recordGameResult, getSettings, saveSettings } from '../services/gameStats.js'

// Game constants
const SLOT_COUNT = 5
const MAX_EMPTY_SLOTS = 2     // Never have more than 2 slots in cooldown/empty
const BASE_COOLDOWN_MS = 3000 // Base cooldown before new card appears
const MIN_COOLDOWN_MS = 1000  // Minimum cooldown with max combo
const COMBO_REDUCTION_MS = 500 // Cooldown reduction per combo level
const COMBO_WINDOW_MS = 2000  // Time window to maintain combo
const WRONG_PENALTY_MS = 3000 // -3 seconds for wrong answer
const TIMER_INTERVAL_MS = 100 // Update timer every 100ms for smooth display

/**
 * Create Flash Match game composable
 */
export function useFlashMatch() {
  // Configuration
  const mode = ref('hanzi-pinyin')       // 'hanzi-pinyin' | 'hanzi-english'
  const hidePinyin = ref(false)           // Only for hanzi-english mode
  const selectedTags = ref([])
  const timeLimit = ref(60)               // Seconds
  const audioEnabled = ref(true)
  
  // Game state
  const status = ref('setup')             // 'setup' | 'playing' | 'finished'
  const timeRemaining = ref(0)            // Milliseconds
  const cardPool = ref([])                // Remaining cards to show
  const slots = ref([])                   // Current 5 slots
  const rightColumnOrder = ref([])        // Shuffled indices for right column display
  
  // Selection state
  const selectedLeft = ref(null)          // Slot index
  const selectedRight = ref(null)         // Index in rightColumnOrder
  
  // Stats
  const correct = ref(0)
  const incorrect = ref(0)
  const matchHistory = ref([])            // { cardId, character, wasCorrect, timestamp }
  
  // Combo tracking
  const comboCount = ref(0)               // Current combo streak
  let lastMatchTime = null                // Timestamp of last correct match
  
  // Internal
  let timerInterval = null
  let lastTickTime = null
  
  // Computed
  const totalAttempts = computed(() => correct.value + incorrect.value)
  const accuracy = computed(() => {
    if (totalAttempts.value === 0) return 0
    return correct.value / totalAttempts.value
  })
  
  const timeRemainingSeconds = computed(() => Math.ceil(timeRemaining.value / 1000))
  const isLowTime = computed(() => timeRemainingSeconds.value <= 10 && timeRemainingSeconds.value > 0)
  
  const availableSlots = computed(() => {
    return slots.value.filter(s => s && s.state === 'active').length
  })
  
  /**
   * Load settings from storage
   */
  function loadSettings() {
    const settings = getSettings()
    audioEnabled.value = settings.audioEnabled ?? true
    timeLimit.value = settings.defaultTimeLimit ?? 60
    mode.value = settings.defaultMode ?? 'hanzi-pinyin'
  }
  
  /**
   * Save current settings
   */
  function persistSettings() {
    saveSettings({
      audioEnabled: audioEnabled.value,
      defaultTimeLimit: timeLimit.value,
      defaultMode: mode.value
    })
  }
  
  /**
   * Initialize game with selected configuration
   */
  async function initGame() {
    if (selectedTags.value.length === 0) {
      throw new Error('Please select at least one tag')
    }
    
    // Fetch and shuffle cards
    const cards = await getFlashMatchCards(selectedTags.value)
    
    if (cards.length < SLOT_COUNT * 2) {
      throw new Error(`Need at least ${SLOT_COUNT * 2} cards. Selected tags have ${cards.length}.`)
    }
    
    cardPool.value = shuffleArray(cards)
    
    // Initialize slots
    slots.value = []
    for (let i = 0; i < SLOT_COUNT; i++) {
      slots.value.push(createSlot(cardPool.value.shift()))
    }
    
    // Shuffle right column display order
    initRightColumnOrder()
    
    // Reset state
    correct.value = 0
    incorrect.value = 0
    matchHistory.value = []
    selectedLeft.value = null
    selectedRight.value = null
    timeRemaining.value = timeLimit.value * 1000
    comboCount.value = 0
    lastMatchTime = null
    
    status.value = 'setup'
  }
  
  /**
   * Create a slot from a card
   */
  function createSlot(card) {
    if (!card) return null
    
    return {
      card,
      state: 'active',      // 'active' | 'cooldown' | 'empty'
      cooldownUntil: null
    }
  }
  
  /**
   * Calculate current cooldown based on combo level
   */
  function getCurrentCooldown() {
    const reduction = comboCount.value * COMBO_REDUCTION_MS
    return Math.max(MIN_COOLDOWN_MS, BASE_COOLDOWN_MS - reduction)
  }
  
  /**
   * Initialize right column order ensuring no card is in the same row as its match
   * This creates the initial shuffled mapping for display
   */
  function initRightColumnOrder() {
    rightColumnOrder.value = generateDerangement(SLOT_COUNT)
  }
  
  /**
   * Generate a derangement (permutation where no element is in its original position)
   * Ensures slot i never maps to display position i
   */
  function generateDerangement(n) {
    // Start with sequential array and shuffle
    let arr = Array.from({ length: n }, (_, i) => i)
    
    // Keep shuffling until we get a valid derangement
    let attempts = 0
    while (attempts < 100) {
      arr = shuffleArray(arr)
      // Check if any element is in its original position
      const hasFixedPoint = arr.some((val, idx) => val === idx)
      if (!hasFixedPoint) {
        return arr
      }
      attempts++
    }
    
    // Fallback: manually fix any conflicts by swapping
    for (let i = 0; i < n; i++) {
      if (arr[i] === i) {
        // Swap with next position (wrapping)
        const swapIdx = (i + 1) % n
        ;[arr[i], arr[swapIdx]] = [arr[swapIdx], arr[i]]
      }
    }
    return arr
  }
  
  /**
   * Assign a display position to a newly revealed slot
   * Ensures the new card is NOT in the same row as its left-column position
   * Keeps existing active slots in their current positions
   */
  function assignPositionForSlot(slotIndex) {
    // Find which display positions are currently used by active/cooldown slots
    const usedPositions = new Set()
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (i !== slotIndex) {
        const slot = slots.value[i]
        if (slot && (slot.state === 'active' || slot.state === 'cooldown')) {
          const displayPos = rightColumnOrder.value.indexOf(i)
          if (displayPos !== -1) usedPositions.add(displayPos)
        }
      }
    }
    
    // Find available positions, excluding the slot's own row
    const availablePositions = []
    for (let pos = 0; pos < SLOT_COUNT; pos++) {
      if (!usedPositions.has(pos) && pos !== slotIndex) {
        availablePositions.push(pos)
      }
    }
    
    // If no valid position (shouldn't happen), allow same-row as fallback
    if (availablePositions.length === 0) {
      for (let pos = 0; pos < SLOT_COUNT; pos++) {
        if (!usedPositions.has(pos)) {
          availablePositions.push(pos)
        }
      }
    }
    
    // Pick a random available position
    if (availablePositions.length > 0) {
      const randomPos = availablePositions[Math.floor(Math.random() * availablePositions.length)]
      rightColumnOrder.value[randomPos] = slotIndex
    }
  }
  
  /**
   * Start the game
   */
  function startGame() {
    if (status.value === 'playing') return
    
    status.value = 'playing'
    lastTickTime = Date.now()
    
    timerInterval = setInterval(tick, TIMER_INTERVAL_MS)
  }
  
  /**
   * Timer tick - update time and process cooldowns
   * Strategy: 
   * - Reveal slots individually when their cooldown expires
   * - Never allow more than MAX_EMPTY_SLOTS to be in cooldown at once
   * - If limit exceeded, immediately reveal the oldest cooldown slot
   */
  function tick() {
    const now = Date.now()
    const delta = now - lastTickTime
    lastTickTime = now
    
    // Update timer
    timeRemaining.value = Math.max(0, timeRemaining.value - delta)
    
    // Count cooldown slots and find ready ones
    const cooldownSlots = []
    
    for (let i = 0; i < slots.value.length; i++) {
      const slot = slots.value[i]
      if (slot && slot.state === 'cooldown') {
        cooldownSlots.push({
          index: i,
          cooldownUntil: slot.cooldownUntil,
          isReady: slot.cooldownUntil <= now
        })
      }
    }
    
    // Sort by cooldown time (oldest first)
    cooldownSlots.sort((a, b) => a.cooldownUntil - b.cooldownUntil)
    
    // Reveal slots that are ready
    for (const { index, isReady } of cooldownSlots) {
      if (isReady) {
        revealSlot(index)
      }
    }
    
    // Recount after reveals - enforce MAX_EMPTY_SLOTS limit
    const remainingCooldowns = slots.value
      .map((slot, i) => ({ slot, index: i }))
      .filter(({ slot }) => slot && slot.state === 'cooldown')
      .sort((a, b) => a.slot.cooldownUntil - b.slot.cooldownUntil)
    
    // If too many cooldowns, force-reveal the oldest ones
    while (remainingCooldowns.length > MAX_EMPTY_SLOTS) {
      const oldest = remainingCooldowns.shift()
      revealSlot(oldest.index)
    }
    
    // Check end conditions
    if (timeRemaining.value <= 0) {
      endGame()
    } else if (availableSlots.value === 0 && cardPool.value.length === 0) {
      // All cards matched!
      endGame()
    }
  }
  
  /**
   * Reveal a new card in the specified slot
   */
  function revealSlot(slotIndex) {
    const newCard = cardPool.value.shift()
    if (newCard) {
      slots.value[slotIndex] = createSlot(newCard)
      // Assign a random position for this new card (keeps others stable)
      assignPositionForSlot(slotIndex)
    } else {
      slots.value[slotIndex] = { card: null, state: 'empty', cooldownUntil: null }
    }
  }
  
  /**
   * Select a left column item
   */
  function selectLeft(slotIndex) {
    if (status.value !== 'playing') return
    
    const slot = slots.value[slotIndex]
    if (!slot || slot.state !== 'active') return
    
    selectedLeft.value = slotIndex
    
    // If right is already selected, check match
    if (selectedRight.value !== null) {
      checkMatch()
    }
  }
  
  /**
   * Select a right column item
   * @param {number} displayIndex - The visual position (0-4) in the right column
   */
  function selectRight(displayIndex) {
    if (status.value !== 'playing') return
    
    // Map display position to actual slot index
    const slotIndex = rightColumnOrder.value[displayIndex]
    const slot = slots.value[slotIndex]
    if (!slot || slot.state !== 'active') return
    
    selectedRight.value = displayIndex
    
    // If left is already selected, check match
    if (selectedLeft.value !== null) {
      checkMatch()
    }
  }
  
  /**
   * Check if current selection is a match
   */
  function checkMatch() {
    if (selectedLeft.value === null || selectedRight.value === null) return
    
    const leftSlotIndex = selectedLeft.value
    const rightSlotIndex = rightColumnOrder.value[selectedRight.value]
    
    const leftSlot = slots.value[leftSlotIndex]
    const rightSlot = slots.value[rightSlotIndex]
    
    if (!leftSlot || !rightSlot) {
      clearSelection()
      return
    }
    
    const isCorrect = leftSlotIndex === rightSlotIndex
    
    // Record in history
    matchHistory.value.push({
      cardId: leftSlot.card.id,
      character: leftSlot.card.character,
      wasCorrect: isCorrect,
      timestamp: Date.now()
    })
    
    if (isCorrect) {
      handleCorrectMatch(leftSlotIndex)
    } else {
      handleWrongMatch(leftSlot.card, rightSlot.card)
    }
    
    clearSelection()
  }
  
  /**
   * Handle correct match - updates combo and sets cooldown
   */
  function handleCorrectMatch(slotIndex) {
    correct.value++
    
    const now = Date.now()
    const slot = slots.value[slotIndex]
    
    // Update combo: increment if within window, reset otherwise
    if (lastMatchTime && (now - lastMatchTime) <= COMBO_WINDOW_MS) {
      comboCount.value++
    } else {
      comboCount.value = 0
    }
    lastMatchTime = now
    
    // Calculate cooldown based on current combo
    const cooldown = getCurrentCooldown()
    
    // Put slot in cooldown
    slot.state = 'cooldown'
    slot.cooldownUntil = now + cooldown
    
    // Return the matched card for audio playback
    return slot.card
  }

  /**
   * Handle wrong match - resets combo and applies penalty
   */
  function handleWrongMatch(leftCard, rightCard) {
    incorrect.value++
    
    // Reset combo on wrong answer
    comboCount.value = 0
    lastMatchTime = null
    
    // Apply time penalty
    timeRemaining.value = Math.max(0, timeRemaining.value - WRONG_PENALTY_MS)
    
    // Also record the right card as a miss (they confused it)
    matchHistory.value.push({
      cardId: rightCard.id,
      character: rightCard.character,
      wasCorrect: false,
      timestamp: Date.now()
    })
  }
  
  /**
   * Clear current selection
   */
  function clearSelection() {
    selectedLeft.value = null
    selectedRight.value = null
  }
  
  /**
   * End the game
   */
  function endGame() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    
    status.value = 'finished'
    
    // Record result
    const result = recordGameResult({
      mode: mode.value,
      tags: selectedTags.value,
      hidePinyin: hidePinyin.value,
      timeLimit: timeLimit.value,
      correct: correct.value,
      incorrect: incorrect.value,
      matchHistory: matchHistory.value
    })
    
    return result
  }
  
  /**
   * Reset game to setup state
   */
  function resetGame() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    
    status.value = 'setup'
    slots.value = []
    cardPool.value = []
    rightColumnOrder.value = []
    selectedLeft.value = null
    selectedRight.value = null
    correct.value = 0
    incorrect.value = 0
    matchHistory.value = []
    timeRemaining.value = 0
    comboCount.value = 0
    lastMatchTime = null
  }
  
  /**
   * Get the display text for right column based on mode
   */
  function getRightDisplayText(card) {
    if (mode.value === 'hanzi-pinyin') {
      return card.pinyin
    } else {
      return card.english
    }
  }
  
  /**
   * Get the display for left column based on mode
   */
  function getLeftDisplay(card) {
    if (mode.value === 'hanzi-pinyin') {
      return { character: card.character, pinyin: null }
    } else {
      // hanzi-english: show character + optionally pinyin
      return {
        character: card.character,
        pinyin: hidePinyin.value ? null : card.pinyin
      }
    }
  }
  
  /**
   * Get problem cards from this session (missed 2+ times)
   */
  function getSessionProblemCards() {
    const missCounts = {}
    
    for (const match of matchHistory.value) {
      if (!match.wasCorrect) {
        if (!missCounts[match.cardId]) {
          missCounts[match.cardId] = { 
            cardId: match.cardId, 
            character: match.character, 
            count: 0 
          }
        }
        missCounts[match.cardId].count++
      }
    }
    
    return Object.values(missCounts)
      .filter(m => m.count >= 2)
      .sort((a, b) => b.count - a.count)
  }
  
  // Load settings on creation
  loadSettings()
  
  return {
    // Configuration
    mode,
    hidePinyin,
    selectedTags,
    timeLimit,
    audioEnabled,
    
    // State
    status,
    timeRemaining,
    timeRemainingSeconds,
    isLowTime,
    slots,
    rightColumnOrder,
    selectedLeft,
    selectedRight,
    cardPool,
    
    // Stats
    correct,
    incorrect,
    totalAttempts,
    accuracy,
    matchHistory,
    comboCount,
    
    // Actions
    loadSettings,
    persistSettings,
    initGame,
    startGame,
    selectLeft,
    selectRight,
    clearSelection,
    endGame,
    resetGame,
    
    // Display helpers
    getRightDisplayText,
    getLeftDisplay,
    getSessionProblemCards
  }
}

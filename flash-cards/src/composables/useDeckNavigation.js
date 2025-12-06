/**
 * Deck navigation composable - manages deck browsing and card navigation within decks
 */

import { ref, computed } from 'vue'
import { loadHskDeck } from '../services/hsk.js'

/**
 * Fisher-Yates shuffle
 */
function shuffleArray(arr) {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Create deck navigation composable
 * @param {Object} options
 * @param {import('vue').Ref<Array>} options.savedCards - Reference to user's saved cards
 * @param {Function} options.onCardChange - Called when current card changes via navigation
 */
export function useDeckNavigation({ savedCards, onCardChange }) {
  // Deck state
  const activeDeck = ref(null)
  const activeDeckCards = ref([])
  const activeDeckTitle = ref('')
  
  // Navigation state
  const currentIndex = ref(-1)
  const displayOrder = ref([])
  
  // Check if actively browsing cards with navigation
  const isBrowsingCards = computed(() => {
    return displayOrder.value.length > 0 && currentIndex.value >= 0
  })
  
  async function openDeck(deckInfo) {
    activeDeck.value = deckInfo
    
    if (deckInfo.type === 'hsk') {
      activeDeckTitle.value = `HSK ${deckInfo.level}`
      activeDeckCards.value = await loadHskDeck(deckInfo.level)
    } else if (deckInfo.type === 'user') {
      if (deckInfo.filter === 'vocabulary') {
        activeDeckTitle.value = 'Your Words'
        activeDeckCards.value = savedCards.value.filter(c => c.type !== 'trivia')
      } else if (deckInfo.filter === 'trivia') {
        activeDeckTitle.value = 'Your Questions'
        activeDeckCards.value = savedCards.value.filter(c => c.type === 'trivia')
      } else {
        activeDeckTitle.value = 'All Your Cards'
        activeDeckCards.value = [...savedCards.value]
      }
    }
  }
  
  function closeDeck() {
    activeDeck.value = null
    activeDeckCards.value = []
    activeDeckTitle.value = ''
    displayOrder.value = []
    currentIndex.value = -1
  }
  
  function openCardFromDeck(card, shuffledOrder = null) {
    const cardIndex = activeDeckCards.value.findIndex(c => c.id === card.id)
    
    // If a shuffled order was provided (from DeckView), use it
    if (shuffledOrder && shuffledOrder.length > 0) {
      displayOrder.value = shuffledOrder
      const posInOrder = displayOrder.value.indexOf(cardIndex)
      currentIndex.value = posInOrder >= 0 ? posInOrder : 0
    } else if (displayOrder.value.length === 0) {
      // Only reset display order if not already set (preserve existing shuffle)
      displayOrder.value = activeDeckCards.value.map((_, i) => i)
      currentIndex.value = cardIndex >= 0 ? cardIndex : 0
    } else {
      // Find position in current display order
      const posInOrder = displayOrder.value.indexOf(cardIndex)
      currentIndex.value = posInOrder >= 0 ? posInOrder : 0
    }
    return card
  }
  
  function prevCard() {
    if (currentIndex.value > 0) {
      currentIndex.value--
      const cardIndex = displayOrder.value[currentIndex.value]
      const card = activeDeckCards.value[cardIndex]
      onCardChange?.(card)
      return card
    }
    return null
  }
  
  function nextCard() {
    if (currentIndex.value < displayOrder.value.length - 1) {
      currentIndex.value++
      const cardIndex = displayOrder.value[currentIndex.value]
      const card = activeDeckCards.value[cardIndex]
      onCardChange?.(card)
      return card
    }
    return null
  }
  
  function shuffleCurrentDeck() {
    if (activeDeckCards.value.length === 0) return null
    
    displayOrder.value = shuffleArray(activeDeckCards.value.map((_, i) => i))
    currentIndex.value = 0
    const card = activeDeckCards.value[displayOrder.value[0]]
    onCardChange?.(card)
    return card
  }
  
  /**
   * Find a card in the current deck
   */
  function findCardInDeck(character) {
    return activeDeckCards.value.find(c => c.character === character)
  }
  
  /**
   * Set up navigation for saved cards (when opening a card outside deck context)
   */
  function setupSavedCardsNavigation(card) {
    displayOrder.value = savedCards.value.map((_, i) => i)
    const cardIndex = savedCards.value.findIndex(c => c.id === card.id)
    currentIndex.value = cardIndex >= 0 ? cardIndex : 0
    activeDeckCards.value = savedCards.value
  }
  
  /**
   * Remove a card from display order (after deletion)
   */
  function removeFromDisplayOrder(cardId) {
    const deckCardIndex = activeDeckCards.value.findIndex(c => c.id === cardId)
    const displayIndex = displayOrder.value.indexOf(deckCardIndex)
    
    if (displayIndex >= 0) {
      displayOrder.value.splice(displayIndex, 1)
    }
    
    if (currentIndex.value >= displayOrder.value.length) {
      currentIndex.value = Math.max(0, displayOrder.value.length - 1)
    }
    
    if (displayOrder.value.length > 0) {
      return activeDeckCards.value[displayOrder.value[currentIndex.value]]
    }
    return null
  }
  
  /**
   * Clear navigation state (when opening a new/single card)
   */
  function clearNavigation() {
    displayOrder.value = []
    currentIndex.value = -1
  }
  
  return {
    // State
    activeDeck,
    activeDeckCards,
    activeDeckTitle,
    currentIndex,
    displayOrder,
    isBrowsingCards,
    
    // Actions
    openDeck,
    closeDeck,
    openCardFromDeck,
    prevCard,
    nextCard,
    shuffleCurrentDeck,
    findCardInDeck,
    setupSavedCardsNavigation,
    removeFromDisplayOrder,
    clearNavigation
  }
}

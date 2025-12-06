/**
 * Card state composable - manages current card display state
 */

import { ref, computed } from 'vue'
import { lookupChinese } from '../services/dictionary.js'
import { getHskBadge, findHskWord } from '../services/hsk.js'
import { getLocalCards, saveCard, deleteCard, createCard, getCardByCharacter, copyCardToCollection } from '../services/storage.js'

/**
 * Create card state composable
 * @param {Object} options
 * @param {import('vue').Ref<Array>} options.savedCards - Reference to user's saved cards
 * @param {Function} options.loadCards - Function to reload saved cards
 */
export function useCardState({ savedCards, loadCards }) {
  const currentCard = ref(null)
  const isNewCard = ref(false)
  const currentDictLookup = ref(null)
  const currentHskBadge = ref(null)
  const urlLoading = ref(false)
  const error = ref(null)
  
  // Pending data for card generation
  const pendingDictEntry = ref(null)
  const pendingFreeformQuery = ref(null)
  
  // Check if current card is in user's collection
  const isCurrentCardInCollection = computed(() => {
    if (!currentCard.value) return false
    if (currentCard.value.tags?.includes('user')) return true
    return savedCards.value.some(c => c.id === currentCard.value.id)
  })
  
  async function updateHskBadge() {
    if (currentCard.value?.character) {
      currentHskBadge.value = await getHskBadge(currentCard.value.character)
    } else {
      currentHskBadge.value = null
    }
  }
  
  /**
   * Open a saved card
   */
  function openSavedCard(card) {
    currentCard.value = card
    isNewCard.value = false
    pendingDictEntry.value = null
    pendingFreeformQuery.value = null
    currentDictLookup.value = null
    updateHskBadge()
    return card
  }
  
  /**
   * Open an HSK card directly (not within deck navigation context)
   */
  function openHskCard(card) {
    currentCard.value = card
    isNewCard.value = false
    pendingDictEntry.value = null
    pendingFreeformQuery.value = null
    currentDictLookup.value = null
    updateHskBadge()
    return card
  }
  
  /**
   * Open a card by character - searches saved cards, HSK decks, then CEDICT
   */
  async function openCardByCharacter(character) {
    // 1. Check saved cards first
    const savedCard = savedCards.value.find(c => c.character === character)
    if (savedCard) {
      return { type: 'saved', card: openSavedCard(savedCard) }
    }
    
    // 2. Check HSK decks
    const hskMatches = await findHskWord(character)
    if (hskMatches && hskMatches.length > 0) {
      const match = hskMatches.sort((a, b) => a.level - b.level)[0]
      return { type: 'hsk', card: openHskCard(match.card), level: match.level }
    }
    
    // 3. Fall back to CEDICT lookup
    urlLoading.value = true
    try {
      const lookup = await lookupChinese(character)
      if (lookup.cedict && lookup.cedict.length > 0) {
        const entry = lookup.cedict[0]
        currentCard.value = createCard({
          character: entry.simplified,
          pinyin: entry.pinyin || ''
        })
        isNewCard.value = true
        pendingDictEntry.value = entry
        
        currentDictLookup.value = {
          cedict: lookup.cedict,
          ids: lookup.ids,
          componentIds: lookup.componentIds
        }
        
        updateHskBadge()
        return { type: 'new', card: currentCard.value }
      } else {
        error.value = `Character "${character}" not found`
        return { type: 'error', error: error.value }
      }
    } finally {
      urlLoading.value = false
    }
  }
  
  /**
   * Handle dictionary entry selection from search
   */
  async function handleDictSelect(entry, { findCardInDeck, openCardFromDeck, activeDeck, activeDeckCards }) {
    // 1. Check if already saved
    const existing = getCardByCharacter(entry.simplified, entry.pinyin)
    if (existing) {
      return { action: 'openSaved', card: openSavedCard(existing) }
    }
    
    // 2. Check current deck
    if (activeDeck?.value && activeDeckCards?.value.length > 0) {
      const deckCard = findCardInDeck(entry.simplified)
      if (deckCard) {
        openCardFromDeck(deckCard)
        currentCard.value = deckCard
        isNewCard.value = false
        pendingDictEntry.value = null
        pendingFreeformQuery.value = null
        currentDictLookup.value = null
        updateHskBadge()
        return { action: 'openDeck', card: deckCard }
      }
    }
    
    // 3. Check HSK decks
    const hskMatches = await findHskWord(entry.simplified)
    if (hskMatches && hskMatches.length > 0) {
      const match = hskMatches.sort((a, b) => a.level - b.level)[0]
      return { action: 'openHsk', card: openHskCard(match.card) }
    }
    
    // 4. Create new stub card
    currentCard.value = createCard({
      character: entry.simplified,
      pinyin: entry.pinyin || ''
    })
    isNewCard.value = true
    pendingDictEntry.value = entry
    
    currentDictLookup.value = {
      cedict: [entry],
      ids: null,
      componentIds: null
    }
    
    // Fetch IDS decomposition async
    lookupChinese(entry.simplified).then(lookup => {
      if (currentDictLookup.value) {
        currentDictLookup.value.ids = lookup.ids
        currentDictLookup.value.componentIds = lookup.componentIds
      }
    })
    
    updateHskBadge()
    return { action: 'newCard', card: currentCard.value }
  }
  
  /**
   * Handle freeform query (no dictionary match)
   */
  function handleFreeform(query) {
    pendingFreeformQuery.value = query
    pendingDictEntry.value = null
    
    currentCard.value = createCard({
      character: query,
      type: 'vocabulary'
    })
    isNewCard.value = true
    currentDictLookup.value = null
    
    return currentCard.value
  }
  
  /**
   * Save the current card
   */
  function saveCurrentCard(card) {
    saveCard(card)
    loadCards()
    
    currentCard.value = card
    isNewCard.value = false
    pendingDictEntry.value = null
    pendingFreeformQuery.value = null
  }
  
  /**
   * Add current card to user's collection (for HSK cards)
   */
  function addCurrentToCollection() {
    if (!currentCard.value) return null
    
    const result = copyCardToCollection(currentCard.value)
    if (result.success) {
      loadCards()
      currentCard.value = result.card
      return { success: true, card: result.card }
    } else if (result.reason === 'exists') {
      error.value = 'This card is already in your collection'
      setTimeout(() => { error.value = null }, 2000)
      return { success: false, reason: 'exists' }
    }
    return result
  }
  
  /**
   * Close current card
   */
  function closeCard() {
    currentCard.value = null
    isNewCard.value = false
    pendingDictEntry.value = null
    pendingFreeformQuery.value = null
    currentDictLookup.value = null
    currentHskBadge.value = null
    error.value = null
  }
  
  /**
   * Delete current card
   */
  function handleDelete(cardId) {
    if (isCurrentCardInCollection.value) {
      deleteCard(cardId)
      loadCards()
      return true
    }
    return false
  }
  
  /**
   * Mark card as generated (no longer new)
   */
  function markAsGenerated(card) {
    currentCard.value = card
    isNewCard.value = false
    pendingDictEntry.value = null
    pendingFreeformQuery.value = null
    updateHskBadge()
  }
  
  return {
    // State
    currentCard,
    isNewCard,
    currentDictLookup,
    currentHskBadge,
    urlLoading,
    error,
    pendingDictEntry,
    pendingFreeformQuery,
    isCurrentCardInCollection,
    
    // Actions
    updateHskBadge,
    openSavedCard,
    openHskCard,
    openCardByCharacter,
    handleDictSelect,
    handleFreeform,
    saveCurrentCard,
    addCurrentToCollection,
    closeCard,
    handleDelete,
    markAsGenerated
  }
}

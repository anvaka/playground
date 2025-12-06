/**
 * Router composable - manages URL state and browser history
 * 
 * URL Schema:
 * - /?tag=hsk2           → Browse HSK 2 deck
 * - /?tag=hsk2&card=帮助  → View card within HSK 2 deck (preserves navigation)
 * - /?tag=vocabulary     → Your vocabulary cards
 * - /?tag=trivia         → Your trivia cards  
 * - /?card=茶            → View card without deck context
 */

import { onMounted, onUnmounted } from 'vue'

/**
 * Parse tag parameter into deck info
 */
export function parseTagToDeck(tag) {
  if (!tag) return null
  
  // HSK tags: hsk1, hsk2, etc.
  const hskMatch = tag.match(/^hsk(\d)$/i)
  if (hskMatch) {
    const level = parseInt(hskMatch[1])
    if (level >= 1 && level <= 6) {
      return { type: 'hsk', level }
    }
  }
  
  // User deck tags
  if (tag === 'vocabulary' || tag === 'trivia' || tag === 'all') {
    return { type: 'user', filter: tag }
  }
  
  return null
}

/**
 * Build URL from current state
 */
function buildUrl(activeDeck, currentCard) {
  const params = new URLSearchParams()
  
  if (activeDeck) {
    if (activeDeck.type === 'hsk') {
      params.set('tag', `hsk${activeDeck.level}`)
    } else if (activeDeck.type === 'user') {
      params.set('tag', activeDeck.filter || 'all')
    }
  }
  
  if (currentCard?.character) {
    params.set('card', currentCard.character)
  }
  
  const query = params.toString()
  return query ? `?${query}` : window.location.pathname
}

/**
 * Create router composable
 * @param {Object} options - Configuration
 * @param {Function} options.getState - Returns { activeDeck, currentCard, currentIndex }
 * @param {Function} options.onRestore - Called when restoring state from URL
 * @param {Function} options.onPopState - Called on browser back/forward
 */
export function useRouter({ getState, onRestore, onPopState }) {
  
  function pushHistoryState() {
    const { activeDeck, currentCard, currentIndex } = getState()
    const url = buildUrl(activeDeck, currentCard)
    const state = {
      card: currentCard?.character || null,
      deck: activeDeck ? { ...activeDeck } : null,
      cardIndex: currentIndex
    }
    history.pushState(state, '', url)
  }
  
  function replaceHistoryState() {
    const { activeDeck, currentCard, currentIndex } = getState()
    const url = buildUrl(activeDeck, currentCard)
    const state = {
      card: currentCard?.character || null,
      deck: activeDeck ? { ...activeDeck } : null,
      cardIndex: currentIndex
    }
    history.replaceState(state, '', url)
  }
  
  /**
   * Parse URL and return restore info
   */
  function parseUrl() {
    const params = new URLSearchParams(window.location.search)
    
    const tag = params.get('tag')
    const cardChar = params.get('card')
    const deckInfo = parseTagToDeck(tag)
    
    return { deckInfo, cardChar }
  }
  
  async function restoreFromUrl() {
    const { deckInfo, cardChar } = parseUrl()
    await onRestore({ deckInfo, cardChar })
    replaceHistoryState()
  }
  
  function handlePopState(event) {
    onPopState(event.state)
  }
  
  onMounted(() => {
    window.addEventListener('popstate', handlePopState)
  })
  
  onUnmounted(() => {
    window.removeEventListener('popstate', handlePopState)
  })
  
  return {
    pushHistoryState,
    replaceHistoryState,
    restoreFromUrl,
    parseTagToDeck
  }
}

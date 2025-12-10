/**
 * Unified App Router - Single source of truth for all navigation state
 * 
 * URL Schema:
 * - /                              → Home (DeckBrowser)
 * - /?deck=hsk2                    → DeckView for HSK 2
 * - /?deck=vocabulary              → DeckView for user vocabulary
 * - /?deck=hsk2&card=帮助          → CardView within HSK 2 deck
 * - /?card=茶                      → CardView without deck context
 * - /?view=games                   → FlashMatch setup
 * - /?view=games&stage=play        → FlashMatch game in progress
 * - /?view=games&stage=results     → FlashMatch results
 * - /?view=reader                  → Reader home
 * - /?view=reader&stage=create     → Book creator
 * - /?view=reader&book=abc123      → Reading a specific book
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * Route state shape:
 * {
 *   view: 'home' | 'deck' | 'card' | 'games' | 'reader',
 *   deck: { type: 'hsk', level: number } | { type: 'user', filter: string } | null,
 *   card: string | null,  // character
 *   cardIndex: number,    // position in deck navigation
 *   gameStage: 'setup' | 'play' | 'results' | null,
 *   readerStage: 'home' | 'create' | 'reading' | null,
 *   bookId: string | null
 * }
 */

function createEmptyRoute() {
  return {
    view: 'home',
    deck: null,
    card: null,
    cardIndex: -1,
    gameStage: null,
    readerStage: null,
    bookId: null
  }
}

/**
 * Parse deck parameter into deck info object
 */
function parseDeckParam(deckParam) {
  if (!deckParam) return null
  
  // HSK decks: hsk1, hsk2, etc.
  const hskMatch = deckParam.match(/^hsk(\d)$/i)
  if (hskMatch) {
    const level = parseInt(hskMatch[1])
    if (level >= 1 && level <= 6) {
      return { type: 'hsk', level }
    }
  }
  
  // User deck filters
  if (deckParam === 'vocabulary' || deckParam === 'trivia' || deckParam === 'all') {
    return { type: 'user', filter: deckParam }
  }
  
  return null
}

/**
 * Convert deck info to URL parameter
 */
function deckToParam(deck) {
  if (!deck) return null
  if (deck.type === 'hsk') return `hsk${deck.level}`
  if (deck.type === 'user') return deck.filter || 'all'
  return null
}

/**
 * Parse current URL into route state
 */
function parseUrl() {
  const params = new URLSearchParams(window.location.search)
  const route = createEmptyRoute()
  
  const view = params.get('view')
  const deckParam = params.get('deck')
  const cardParam = params.get('card')
  const stage = params.get('stage')
  const bookId = params.get('book')
  
  // Determine view based on parameters
  if (view === 'games') {
    route.view = 'games'
    route.gameStage = stage === 'play' ? 'play' : stage === 'results' ? 'results' : 'setup'
  } else if (view === 'reader') {
    route.view = 'reader'
    if (bookId) {
      route.readerStage = 'reading'
      route.bookId = bookId
    } else if (stage === 'create') {
      route.readerStage = 'create'
    } else {
      route.readerStage = 'home'
    }
  } else if (cardParam) {
    route.view = 'card'
    route.card = cardParam
    route.deck = parseDeckParam(deckParam)
  } else if (deckParam) {
    route.view = 'deck'
    route.deck = parseDeckParam(deckParam)
  } else {
    route.view = 'home'
  }
  
  return route
}

/**
 * Build URL from route state
 */
function buildUrl(route) {
  const params = new URLSearchParams()
  
  if (route.view === 'games') {
    params.set('view', 'games')
    if (route.gameStage && route.gameStage !== 'setup') {
      params.set('stage', route.gameStage)
    }
  } else if (route.view === 'reader') {
    params.set('view', 'reader')
    if (route.bookId) {
      params.set('book', route.bookId)
    } else if (route.readerStage === 'create') {
      params.set('stage', 'create')
    }
  } else if (route.view === 'card' || route.card) {
    if (route.deck) {
      params.set('deck', deckToParam(route.deck))
    }
    if (route.card) {
      params.set('card', route.card)
    }
  } else if (route.view === 'deck' && route.deck) {
    params.set('deck', deckToParam(route.deck))
  }
  
  const query = params.toString()
  return query ? `?${query}` : window.location.pathname
}

/**
 * Serialize route to a plain object safe for history.pushState/replaceState
 * (history API requires structured-cloneable objects)
 */
function serializeRoute(route) {
  return {
    view: route.view,
    deck: route.deck ? JSON.parse(JSON.stringify(route.deck)) : null,
    card: route.card,
    cardIndex: route.cardIndex,
    gameStage: route.gameStage,
    readerStage: route.readerStage,
    bookId: route.bookId
  }
}

/**
 * Check if two routes are equal (for avoiding duplicate pushes)
 */
function routesEqual(a, b) {
  if (!a || !b) return a === b
  return (
    a.view === b.view &&
    a.card === b.card &&
    a.gameStage === b.gameStage &&
    a.readerStage === b.readerStage &&
    a.bookId === b.bookId &&
    JSON.stringify(a.deck) === JSON.stringify(b.deck)
  )
}

/**
 * Create the unified app router
 * @param {Object} options
 * @param {Function} options.onNavigate - Called when route changes (including popstate)
 */
export function useAppRouter({ onNavigate }) {
  const currentRoute = ref(createEmptyRoute())
  
  // Computed helpers for template conditionals
  const isHome = computed(() => currentRoute.value.view === 'home')
  const isDeck = computed(() => currentRoute.value.view === 'deck')
  const isCard = computed(() => currentRoute.value.view === 'card' || !!currentRoute.value.card)
  const isGames = computed(() => currentRoute.value.view === 'games')
  const isReader = computed(() => currentRoute.value.view === 'reader')
  
  const hasDeckContext = computed(() => !!currentRoute.value.deck)
  const gameStage = computed(() => currentRoute.value.gameStage)
  const readerStage = computed(() => currentRoute.value.readerStage)
  
  /**
   * Navigate to a new route (pushes history)
   */
  function navigate(newRoute, { replace = false } = {}) {
    const merged = { ...currentRoute.value, ...newRoute }
    
    // Clear unrelated state when switching views BEFORE normalizing
    // This ensures explicit view changes take precedence over card state
    if (newRoute.view === 'home') {
      merged.deck = null
      merged.card = null
      merged.cardIndex = -1
      merged.gameStage = null
      merged.readerStage = null
      merged.bookId = null
    } else if (newRoute.view === 'deck') {
      merged.card = null
      merged.cardIndex = -1
      merged.gameStage = null
      merged.readerStage = null
      merged.bookId = null
    } else if (newRoute.view === 'games') {
      merged.deck = null
      merged.card = null
      merged.cardIndex = -1
      merged.readerStage = null
      merged.bookId = null
    } else if (newRoute.view === 'reader') {
      merged.deck = null
      merged.card = null
      merged.cardIndex = -1
      merged.gameStage = null
    }
    
    // Normalize view based on state (only if view wasn't explicitly set)
    if (!newRoute.view && merged.card && merged.view !== 'games' && merged.view !== 'reader') {
      merged.view = 'card'
    }
    
    // Clear card-related state when view is explicitly deck or home
    if (merged.view === 'card') {
      merged.gameStage = null
      merged.readerStage = null
      merged.bookId = null
    }
    
    const url = buildUrl(merged)
    const historyState = serializeRoute(merged)
    
    if (replace) {
      history.replaceState(historyState, '', url)
    } else {
      // Avoid duplicate pushes
      if (!routesEqual(currentRoute.value, merged)) {
        history.pushState(historyState, '', url)
      }
    }
    
    currentRoute.value = merged
  }
  
  /**
   * Replace current history entry without pushing
   */
  function replace(newRoute) {
    navigate(newRoute, { replace: true })
  }
  
  /**
   * Update card index without pushing new history (for prev/next navigation)
   */
  function updateCardIndex(index) {
    currentRoute.value.cardIndex = index
    const url = buildUrl(currentRoute.value)
    history.replaceState(serializeRoute(currentRoute.value), '', url)
  }
  
  /**
   * Go back in history (wrapper for history.back)
   */
  function back() {
    history.back()
  }
  
  /**
   * Navigate to home
   */
  function goHome() {
    navigate({ view: 'home' })
  }
  
  /**
   * Navigate to a deck
   */
  function goToDeck(deck) {
    // Ensure deck is a plain object (not a Vue proxy)
    const plainDeck = deck ? JSON.parse(JSON.stringify(deck)) : null
    navigate({ view: 'deck', deck: plainDeck })
  }
  
  /**
   * Navigate to a card (optionally within deck context)
   */
  function goToCard(card, deck = null, cardIndex = -1) {
    // Ensure deck is a plain object (not a Vue proxy)
    const plainDeck = deck ? JSON.parse(JSON.stringify(deck)) : null
    navigate({ view: 'card', card, deck: plainDeck, cardIndex })
  }
  
  /**
   * Navigate to games
   */
  function goToGames(stage = 'setup') {
    navigate({ view: 'games', gameStage: stage })
  }
  
  /**
   * Navigate to reader
   */
  function goToReader(stage = 'home', bookId = null) {
    navigate({ view: 'reader', readerStage: stage, bookId })
  }
  
  /**
   * Handle browser back/forward
   */
  function handlePopState(event) {
    const state = event.state
    if (state && state.view) {
      currentRoute.value = state
    } else {
      // No state or initial page load - parse from URL
      currentRoute.value = parseUrl()
    }
    onNavigate?.(currentRoute.value)
  }
  
  /**
   * Initialize router - parse current URL and set up listeners
   */
  function init() {
    currentRoute.value = parseUrl()
    // Replace current history entry with proper state
    history.replaceState(serializeRoute(currentRoute.value), '', buildUrl(currentRoute.value))
    return currentRoute.value
  }
  
  onMounted(() => {
    window.addEventListener('popstate', handlePopState)
  })
  
  onUnmounted(() => {
    window.removeEventListener('popstate', handlePopState)
  })
  
  return {
    // State
    currentRoute,
    
    // Computed helpers
    isHome,
    isDeck,
    isCard,
    isGames,
    isReader,
    hasDeckContext,
    gameStage,
    readerStage,
    
    // Navigation
    navigate,
    replace,
    updateCardIndex,
    back,
    goHome,
    goToDeck,
    goToCard,
    goToGames,
    goToReader,
    
    // Initialization
    init,
    
    // Utilities
    parseUrl,
    parseDeckParam
  }
}

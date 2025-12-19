/**
 * Minimal hash-based router for the app
 * Works on static hosts like GitHub Pages
 * 
 * Routes:
 * - #/              → Card list (home)
 * - #/card/new      → New card (query: ?q=character)
 * - #/card/:id      → Edit existing card
 * - #/review        → SRS review session
 * - #/explore       → Browse HSK words (query: ?level=1-7)
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * Parse hash into route object
 */
function parseUrl() {
  const hash = window.location.hash || '#/'
  const [pathPart, queryPart] = hash.slice(1).split('?')
  const path = pathPart || '/'
  const params = new URLSearchParams(queryPart || '')
  
  // /review
  if (path === '/review') {
    return { name: 'review' }
  }
  
  // /explore
  if (path === '/explore') {
    const level = parseInt(params.get('level'), 10) || 0
    return { name: 'explore', level }
  }
  
  // /card/new
  if (path === '/card/new') {
    return {
      name: 'card-new',
      query: params.get('q') || ''
    }
  }
  
  // /card/:id
  const cardMatch = path.match(/^\/card\/(.+)$/)
  if (cardMatch) {
    return {
      name: 'card',
      id: decodeURIComponent(cardMatch[1])
    }
  }
  
  // Default: home
  return { name: 'home' }
}

/**
 * Build URL from route object
 */
function buildUrl(route) {
  if (route.name === 'review') {
    return '#/review'
  }
  if (route.name === 'explore') {
    return route.level ? `#/explore?level=${route.level}` : '#/explore'
  }
  if (route.name === 'card-new') {
    return route.query ? `#/card/new?q=${encodeURIComponent(route.query)}` : '#/card/new'
  }
  if (route.name === 'card') {
    return `#/card/${encodeURIComponent(route.id)}`
  }
  return '#/'
}

/**
 * Create the router composable
 */
export function useRouter() {
  const route = ref(parseUrl())
  
  // Computed helpers
  const isHome = computed(() => route.value.name === 'home')
  const isCard = computed(() => route.value.name === 'card' || route.value.name === 'card-new')
  const isNewCard = computed(() => route.value.name === 'card-new')
  const isReview = computed(() => route.value.name === 'review')
  const isExplore = computed(() => route.value.name === 'explore')
  const exploreLevel = computed(() => route.value.level || 1)
  
  /**
   * Navigate to a route
   */
  function navigate(newRoute, { replace = false } = {}) {
    const url = buildUrl(newRoute)
    
    if (replace) {
      history.replaceState(newRoute, '', url)
    } else {
      history.pushState(newRoute, '', url)
    }
    
    route.value = newRoute
  }
  
  /**
   * Go to home (card list)
   */
  function goHome() {
    navigate({ name: 'home' })
  }
  
  /**
   * Go to new card editor
   */
  function goToNewCard(query = '') {
    navigate({ name: 'card-new', query })
  }
  
  /**
   * Go to existing card
   */
  function goToCard(id) {
    navigate({ name: 'card', id })
  }
  
  /**
   * Go to SRS review session
   */
  function goToReview() {
    navigate({ name: 'review' })
  }
  
  /**
   * Go to explore/browse HSK words
   */
  function goToExplore(level = 0) {
    navigate({ name: 'explore', level })
  }
  
  /**
   * Handle hash change (browser back/forward or direct hash change)
   */
  function handleHashChange() {
    route.value = parseUrl()
  }
  
  /**
   * Initialize - set initial route from hash
   */
  function init() {
    const initialRoute = parseUrl()
    // Set hash if not present
    if (!window.location.hash) {
      history.replaceState(initialRoute, '', buildUrl(initialRoute))
    }
    route.value = initialRoute
  }
  
  onMounted(() => {
    window.addEventListener('hashchange', handleHashChange)
  })
  
  onUnmounted(() => {
    window.removeEventListener('hashchange', handleHashChange)
  })
  
  return {
    route,
    isHome,
    isCard,
    isNewCard,
    isReview,
    isExplore,
    exploreLevel,
    navigate,
    goHome,
    goToNewCard,
    goToCard,
    goToReview,
    goToExplore,
    init
  }
}

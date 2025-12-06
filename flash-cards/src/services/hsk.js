/**
 * HSK deck service - loads and indexes pre-generated HSK flashcard decks
 */

import { getLocalCards } from './storage.js'

// Available HSK levels (add more as they're generated)
const AVAILABLE_LEVELS = [1, 2]

// Cache for loaded decks
const deckCache = new Map()

// Index: character → { level, id, card }
let hskIndex = null

/**
 * Get available HSK levels
 */
export function getAvailableLevels() {
  return AVAILABLE_LEVELS
}

/**
 * Load an HSK deck by level
 * @param {number} level - HSK level (1-6)
 * @returns {Promise<Array>} Array of card objects
 */
export async function loadHskDeck(level) {
  if (!AVAILABLE_LEVELS.includes(level)) {
    throw new Error(`HSK ${level} deck not available`)
  }
  
  // Return cached if available
  if (deckCache.has(level)) {
    return mergeWithUserCards(deckCache.get(level))
  }
  
  try {
    const response = await fetch(`./hsk/hsk${level}.json`)
    if (!response.ok) {
      throw new Error(`Failed to load HSK ${level}: ${response.status}`)
    }
    
    const cards = await response.json()
    
    // Ensure all cards have the hsk tag
    for (const card of cards) {
      if (!card.tags) card.tags = []
      if (!card.tags.includes(`hsk${level}`)) {
        card.tags.push(`hsk${level}`)
      }
    }
    
    deckCache.set(level, cards)
    return mergeWithUserCards(cards)
  } catch (err) {
    console.error(`Error loading HSK ${level}:`, err)
    throw err
  }
}

/**
 * Merge HSK deck with user-saved cards
 * User's saved versions override the original HSK cards
 */
function mergeWithUserCards(hskCards) {
  const userCards = getLocalCards()
  const userCardById = new Map(userCards.map(c => [c.id, c]))
  
  return hskCards.map(card => {
    const userVersion = userCardById.get(card.id)
    return userVersion || card
  })
}

/**
 * Get a single card from an HSK deck
 */
export async function getHskCard(level, cardId) {
  const deck = await loadHskDeck(level)
  return deck.find(c => c.id === cardId) || null
}

/**
 * Build index of all HSK words for quick lookup
 * Maps character → { level, id, card }
 */
export async function buildHskIndex() {
  if (hskIndex) return hskIndex
  
  hskIndex = new Map()
  
  for (const level of AVAILABLE_LEVELS) {
    try {
      const deck = await loadHskDeck(level)
      for (const card of deck) {
        // Index by character (may have multiple entries for same char with different pinyin)
        const key = card.character
        if (!hskIndex.has(key)) {
          hskIndex.set(key, [])
        }
        hskIndex.get(key).push({ level, id: card.id, card })
      }
    } catch {
      // Skip unavailable levels
    }
  }
  
  return hskIndex
}

/**
 * Check if a character/word is in any HSK level
 * @param {string} character - Chinese character or word
 * @returns {Array|null} Array of { level, id } or null if not found
 */
export async function findHskWord(character) {
  await buildHskIndex()
  return hskIndex.get(character) || null
}

/**
 * Get HSK level badge info for a character
 * Returns the lowest HSK level if word appears in multiple
 */
export async function getHskBadge(character) {
  const matches = await findHskWord(character)
  if (!matches || matches.length === 0) return null
  
  // Return lowest level
  const sorted = matches.sort((a, b) => a.level - b.level)
  return { level: sorted[0].level }
}

/**
 * Get deck statistics
 */
export async function getHskDeckStats(level) {
  const deck = await loadHskDeck(level)
  return {
    level,
    totalCards: deck.length,
    // Additional stats can be added later (learned count, etc.)
  }
}

/**
 * Preload all available HSK decks
 */
export async function preloadAllDecks() {
  const results = []
  for (const level of AVAILABLE_LEVELS) {
    try {
      await loadHskDeck(level)
      results.push({ level, success: true })
    } catch (err) {
      results.push({ level, success: false, error: err.message })
    }
  }
  return results
}

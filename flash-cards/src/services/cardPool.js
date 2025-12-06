/**
 * Card pool service - fetches and merges cards from multiple tags/decks
 * Provides a unified interface for games to access vocabulary cards
 */

import { loadHskDeck, getAvailableLevels } from './hsk.js'
import { getLocalCards } from './storage.js'
import { lookupChinese, formatDefinitions } from './dictionary.js'

/**
 * Get all available tags that can be used in games
 * @returns {Array<{id: string, label: string, type: string}>}
 */
export function getAvailableTags() {
  const tags = []
  
  // HSK levels
  const hskLevels = getAvailableLevels()
  for (const level of hskLevels) {
    tags.push({
      id: `hsk${level}`,
      label: `HSK ${level}`,
      type: 'hsk'
    })
  }
  
  // User cards
  const userCards = getLocalCards()
  const vocabCount = userCards.filter(c => c.type !== 'trivia').length
  
  if (vocabCount > 0) {
    tags.push({
      id: 'user',
      label: 'My Cards',
      type: 'user'
    })
  }
  
  return tags
}

/**
 * Get card count for a specific tag
 * @param {string} tagId - Tag identifier (e.g., 'hsk1', 'user')
 * @returns {Promise<number>}
 */
export async function getCardCountForTag(tagId) {
  const cards = await getCardsForTags([tagId])
  return cards.length
}

/**
 * Fetch cards for multiple tags, merged and deduplicated
 * Filters out trivia cards (not suitable for matching games)
 * 
 * @param {string[]} tagIds - Array of tag IDs
 * @returns {Promise<Array>} Array of vocabulary cards
 */
export async function getCardsForTags(tagIds) {
  const allCards = []
  const seenIds = new Set()
  
  for (const tagId of tagIds) {
    let cards = []
    
    // HSK decks
    const hskMatch = tagId.match(/^hsk(\d)$/i)
    if (hskMatch) {
      const level = parseInt(hskMatch[1])
      try {
        cards = await loadHskDeck(level)
      } catch {
        // Skip unavailable decks
        continue
      }
    }
    
    // User cards
    if (tagId === 'user') {
      cards = getLocalCards()
    }
    
    // Filter and deduplicate
    for (const card of cards) {
      // Skip trivia cards
      if (card.type === 'trivia') continue
      
      // Skip cards without required fields for matching
      if (!card.character || !card.pinyin) continue
      
      // Dedupe by ID
      if (!seenIds.has(card.id)) {
        seenIds.add(card.id)
        allCards.push(card)
      }
    }
  }
  
  return allCards
}

/**
 * Get cards suitable for Flash Match game
 * Requires: character, pinyin, and either translation or CEDICT lookup
 * Cards without any English translation source are dropped
 * 
 * @param {string[]} tagIds - Array of tag IDs
 * @returns {Promise<Array>} Array of cards with normalized fields
 */
export async function getFlashMatchCards(tagIds) {
  const cards = await getCardsForTags(tagIds)
  
  // Process cards: populate missing translations from CEDICT
  const processedCards = await Promise.all(
    cards.map(async card => {
      // Already has translation - use it (truncated for game display)
      if (card.translation) {
        return {
          id: card.id,
          character: card.character,
          pinyin: card.pinyin,
          english: truncateMeaning(card.translation),
          originalCard: card
        }
      }
      
      // Try CEDICT lookup
      const lookup = await lookupChinese(card.character)
      if (lookup.cedict && lookup.cedict.length > 0) {
        const cedictTranslation = formatDefinitions(lookup.cedict[0].definitions, 3)
        return {
          id: card.id,
          character: card.character,
          pinyin: card.pinyin,
          english: truncateMeaning(cedictTranslation),
          originalCard: card
        }
      }
      
      // No translation source - mark for removal
      return null
    })
  )
  
  // Filter out cards with no translation
  return processedCards.filter(card => card !== null)
}

/**
 * Extract the first/primary meaning for clean display in games
 */
function truncateMeaning(meaning) {
  if (!meaning) return ''
  
  // Take only the first meaning (semicolon separates distinct meanings)
  const firstMeaning = meaning.split(';')[0].trim()
  if (firstMeaning.length <= 50) return firstMeaning
  
  return firstMeaning.slice(0, 47) + '...'
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} New shuffled array
 */
export function shuffleArray(array) {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

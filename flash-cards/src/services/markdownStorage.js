/**
 * Storage service for markdown-based flashcards
 * Simplified storage focused on markdown content with SRS support
 */

import { extractCharacterForIndex } from './cardMarkdown.js'

const STORAGE_KEY_CARDS = 'flashcards_markdown_cards'

/**
 * Default SRS values for new cards
 */
const DEFAULT_SRS = {
  due: null,          // null = new card, ISO date string = when due
  interval: 0,        // days until next review
  easeFactor: 2.5,    // SM-2 ease factor
  repetitions: 0,     // consecutive correct answers
  lapses: 0           // times forgotten
}

/**
 * Generate a unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

/**
 * Ensure card has SRS fields (migration helper)
 */
function ensureSRSFields(card) {
  return {
    ...card,
    due: card.due ?? DEFAULT_SRS.due,
    interval: card.interval ?? DEFAULT_SRS.interval,
    easeFactor: card.easeFactor ?? DEFAULT_SRS.easeFactor,
    repetitions: card.repetitions ?? DEFAULT_SRS.repetitions,
    lapses: card.lapses ?? DEFAULT_SRS.lapses
  }
}

/**
 * Get all saved markdown cards from localStorage
 */
export function getMarkdownCards() {
  const stored = localStorage.getItem(STORAGE_KEY_CARDS)
  if (!stored) return []
  
  try {
    const cards = JSON.parse(stored)
    // Ensure all cards have SRS fields (handles migration)
    return cards.map(ensureSRSFields)
  } catch {
    return []
  }
}

/**
 * Save cards to localStorage
 */
function saveCards(cards) {
  localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(cards))
}

/**
 * Create a new markdown card
 * @param {string} content - Markdown content
 * @param {Object} metadata - Optional metadata (tags, etc.)
 */
export function createMarkdownCard(content, metadata = {}) {
  const character = extractCharacterForIndex(content)
  
  return {
    id: generateId(),
    created: new Date().toISOString(),
    tags: metadata.tags || [],
    content,
    character, // for indexing/search
    // SRS fields
    ...DEFAULT_SRS
  }
}

/**
 * Save a markdown card
 */
export function saveMarkdownCard(card) {
  const cards = getMarkdownCards()
  
  // Update character index when saving
  if (card.content) {
    card.character = extractCharacterForIndex(card.content)
  }
  
  // Ensure SRS fields exist
  card = ensureSRSFields(card)
  
  // Check if updating existing card
  const existingIndex = cards.findIndex(c => c.id === card.id)
  if (existingIndex >= 0) {
    cards[existingIndex] = { ...cards[existingIndex], ...card }
  } else {
    // New card
    if (!card.id) {
      card.id = generateId()
    }
    if (!card.created) {
      card.created = new Date().toISOString()
    }
    cards.push(card)
  }
  
  saveCards(cards)
  return card
}

/**
 * Delete a markdown card by ID
 */
export function deleteMarkdownCard(cardId) {
  const cards = getMarkdownCards()
  const filtered = cards.filter(c => c.id !== cardId)
  saveCards(filtered)
}

/**
 * Get a single card by ID
 */
export function getMarkdownCard(cardId) {
  const cards = getMarkdownCards()
  return cards.find(c => c.id === cardId) || null
}

/**
 * Get a card by character
 */
export function getMarkdownCardByCharacter(character) {
  const cards = getMarkdownCards()
  return cards.find(c => c.character === character) || null
}

/**
 * Search cards by character or content
 */
export function searchMarkdownCards(query) {
  if (!query) return getMarkdownCards()
  
  const q = query.toLowerCase()
  return getMarkdownCards().filter(card => 
    card.character?.includes(query) ||
    card.content?.toLowerCase().includes(q)
  )
}

/**
 * Get cards due for review
 * @param {Date} asOf - Date to check against (defaults to now)
 * @returns {Array} Cards that are due (due <= asOf) or new (due === null)
 */
export function getDueCards(asOf = new Date()) {
  const now = asOf.toISOString().split('T')[0] // YYYY-MM-DD
  return getMarkdownCards().filter(card => {
    if (card.due === null) return true // new cards are always "due"
    return card.due <= now
  })
}

/**
 * Get new cards (never reviewed)
 */
export function getNewCards() {
  return getMarkdownCards().filter(card => card.due === null)
}

/**
 * Get cards currently in review (have been reviewed at least once)
 */
export function getReviewCards() {
  return getMarkdownCards().filter(card => card.due !== null)
}

/**
 * Get count summary for dashboard
 */
export function getCardCounts() {
  const cards = getMarkdownCards()
  const now = new Date().toISOString().split('T')[0]
  
  let newCount = 0
  let dueCount = 0
  let totalCount = cards.length
  
  for (const card of cards) {
    if (card.due === null) {
      newCount++
    } else if (card.due <= now) {
      dueCount++
    }
  }
  
  return { newCount, dueCount, totalCount }
}

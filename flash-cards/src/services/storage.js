/**
 * Storage service for saving/loading flashcards
 * Uses localStorage with future Google Sheets integration
 */

import { deleteImage } from './imageGen.js'
import { normalizePinyin } from './dictionary.js'

const STORAGE_KEY_CARDS = 'flashcards_saved_cards'
const STORAGE_KEY_TAGS = 'flashcards_card_tags'
const STORAGE_KEY_GOOGLE_TOKEN = 'flashcards_google_token'
const STORAGE_KEY_SHEET_ID = 'flashcards_sheet_id'

/**
 * Generate a unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

/**
 * Get all saved cards from localStorage
 * Returns vocabulary/phrase cards first, trivia cards last
 */
export function getLocalCards() {
  const stored = localStorage.getItem(STORAGE_KEY_CARDS)
  if (!stored) return []
  
  try {
    const cards = JSON.parse(stored)
    // Sort: vocabulary/phrase first, trivia last
    return cards.sort((a, b) => {
      const aIsTrivia = a.type === 'trivia' ? 1 : 0
      const bIsTrivia = b.type === 'trivia' ? 1 : 0
      return aIsTrivia - bIsTrivia
    })
  } catch {
    return []
  }
}

/**
 * Save cards to localStorage
 */
function saveLocalCards(cards) {
  localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(cards))
}

/**
 * Create a new flashcard
 * Supports types: 'vocabulary' (default), 'phrase', 'trivia'
 */
export function createCard(data) {
  const type = data.type || 'vocabulary'
  
  // Base fields for all card types
  const card = {
    id: data.id || generateId(),
    created: data.created || new Date().toISOString(),
    type,
    tags: data.tags || ['user']  // Default tag for user-created cards
  }
  
  if (type === 'trivia') {
    return {
      ...card,
      question: data.question || '',
      answer: data.answer || '',
      explanation: data.explanation || '',
      relatedWords: data.relatedWords || [],
      memoryStory: data.memoryStory || ''
    }
  }
  
  // Vocabulary and phrase cards share similar structure
  return {
    ...card,
    character: data.character || '',
    pinyin: data.pinyin || '',
    microClue: data.microClue || '',
    imageUrl: data.imageUrl || null,
    translation: data.translation || '',
    meaning: data.meaning || '',
    components: data.components || '',
    examples: data.examples || [],
    relatedWords: data.relatedWords || [],
    memoryStory: data.memoryStory || '',
    imagePrompt: data.imagePrompt || '',
    rawDictEntry: data.rawDictEntry || '',
    rawIdsEntry: data.rawIdsEntry || ''
  }
}

/**
 * Save a single card
 */
export function saveCard(card) {
  const cards = getLocalCards()
  
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
  
  saveLocalCards(cards)
  return card
}

/**
 * Delete a card by ID
 */
export function deleteCard(cardId) {
  const cards = getLocalCards()
  const filtered = cards.filter(c => c.id !== cardId)
  saveLocalCards(filtered)
  
  // Also delete associated image from IndexedDB
  deleteImage(cardId).catch(() => {
    // Ignore errors - image might not exist
  })
}

/**
 * Get a single card by ID
 */
export function getCard(cardId) {
  const cards = getLocalCards()
  return cards.find(c => c.id === cardId) || null
}

/**
 * Get a card by character and pinyin
 * Pinyin comparison ignores tones to match different tone marks with same base
 */
export function getCardByCharacter(character, pinyin) {
  const cards = getLocalCards()
  
  if (!pinyin) {
    // Fallback: match by character only (legacy behavior)
    return cards.find(c => c.character === character) || null
  }
  
  const normalizedQuery = normalizePinyin(pinyin)
  return cards.find(c => 
    c.character === character && 
    normalizePinyin(c.pinyin) === normalizedQuery
  ) || null
}

/**
 * Search cards by character or meaning
 */
export function searchCards(query) {
  if (!query) return getLocalCards()
  
  const q = query.toLowerCase()
  return getLocalCards().filter(card => 
    card.character.includes(query) ||
    card.pinyin.toLowerCase().includes(q) ||
    card.meaning.toLowerCase().includes(q)
  )
}

// ============ Tag Management ============

/**
 * Get tags for a card (merges inline tags with override storage)
 */
export function getCardTags(cardId) {
  const card = getCard(cardId)
  const inlineTags = card?.tags || []
  
  // Get override tags from separate storage
  const overrides = getTagOverrides()
  const overrideTags = overrides[cardId] || []
  
  // Merge and dedupe
  return [...new Set([...inlineTags, ...overrideTags])]
}

/**
 * Add a tag to a card
 */
export function addTagToCard(cardId, tag) {
  const card = getCard(cardId)
  
  if (card) {
    // User card - update inline
    if (!card.tags) card.tags = []
    if (!card.tags.includes(tag)) {
      card.tags.push(tag)
      saveCard(card)
    }
  } else {
    // External card (HSK) - store in overrides
    const overrides = getTagOverrides()
    if (!overrides[cardId]) overrides[cardId] = []
    if (!overrides[cardId].includes(tag)) {
      overrides[cardId].push(tag)
      saveTagOverrides(overrides)
    }
  }
}

/**
 * Remove a tag from a card
 */
export function removeTagFromCard(cardId, tag) {
  const card = getCard(cardId)
  
  if (card && card.tags) {
    card.tags = card.tags.filter(t => t !== tag)
    saveCard(card)
  }
  
  // Also check overrides
  const overrides = getTagOverrides()
  if (overrides[cardId]) {
    overrides[cardId] = overrides[cardId].filter(t => t !== tag)
    if (overrides[cardId].length === 0) {
      delete overrides[cardId]
    }
    saveTagOverrides(overrides)
  }
}

/**
 * Get all unique tags across all cards
 */
export function getAllTags() {
  const cards = getLocalCards()
  const overrides = getTagOverrides()
  
  const tags = new Set()
  
  for (const card of cards) {
    if (card.tags) {
      card.tags.forEach(t => tags.add(t))
    }
  }
  
  for (const cardTags of Object.values(overrides)) {
    cardTags.forEach(t => tags.add(t))
  }
  
  return [...tags].sort()
}

/**
 * Get/save tag overrides (for external cards like HSK)
 */
function getTagOverrides() {
  const stored = localStorage.getItem(STORAGE_KEY_TAGS)
  if (!stored) return {}
  try {
    return JSON.parse(stored)
  } catch {
    return {}
  }
}

function saveTagOverrides(overrides) {
  localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(overrides))
}

/**
 * Copy an external card (e.g., HSK) to user's collection
 */
export function copyCardToCollection(card) {
  // Check if already exists
  const existing = getCardByCharacter(card.character, card.pinyin)
  if (existing) {
    return { success: false, reason: 'exists', card: existing }
  }
  
  // Create a copy with new ID and user tag
  const newCard = createCard({
    ...card,
    id: undefined,  // Generate new ID
    created: undefined,  // Fresh timestamp
    tags: [...(card.tags || []), 'user']
  })
  
  saveCard(newCard)
  return { success: true, card: newCard }
}

// ============ Google Sheets Integration (Future) ============

/**
 * Check if Google is connected
 */
export function isGoogleConnected() {
  return !!localStorage.getItem(STORAGE_KEY_GOOGLE_TOKEN)
}

/**
 * Get Google Sheet ID
 */
export function getSheetId() {
  return localStorage.getItem(STORAGE_KEY_SHEET_ID) || ''
}

/**
 * Save Google Sheet ID
 */
export function setSheetId(id) {
  localStorage.setItem(STORAGE_KEY_SHEET_ID, id)
}

/**
 * Placeholder for Google OAuth
 * To be implemented when needed
 */
export async function connectGoogle() {
  // TODO: Implement Google OAuth flow
  // For now, we use localStorage only
  console.log('Google Sheets integration not yet implemented')
  return false
}

/**
 * Sync cards with Google Sheets
 * Placeholder for future implementation
 */
export async function syncWithGoogle() {
  if (!isGoogleConnected()) {
    throw new Error('Google not connected')
  }
  
  // TODO: Implement sync logic
  // 1. Fetch cards from Google Sheets
  // 2. Merge with local cards
  // 3. Push updates back to Google Sheets
  
  console.log('Google Sheets sync not yet implemented')
  return getLocalCards()
}

/**
 * Export cards as JSON (for backup)
 */
export function exportCards() {
  const cards = getLocalCards()
  const blob = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `flashcards-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  
  URL.revokeObjectURL(url)
}

/**
 * Import cards from JSON
 */
export function importCards(jsonString) {
  try {
    const imported = JSON.parse(jsonString)
    if (!Array.isArray(imported)) {
      throw new Error('Invalid format: expected array')
    }
    
    const existing = getLocalCards()
    const existingIds = new Set(existing.map(c => c.id))
    
    let added = 0
    for (const card of imported) {
      if (!existingIds.has(card.id)) {
        existing.push(card)
        added++
      }
    }
    
    saveLocalCards(existing)
    return { added, total: existing.length }
  } catch (err) {
    throw new Error('Failed to import: ' + err.message)
  }
}

/**
 * Card generation composable - handles LLM-based card generation
 */

import { ref } from 'vue'
import { lookupChinese, formatForLLM } from '../services/dictionary.js'
import { buildPrompt, buildFreeformPrompt, validateCardData, parseResponse } from '../services/llm.js'
import { createCard, saveCard } from '../services/storage.js'

/**
 * Create card generation composable
 * @param {Object} options
 * @param {Function} options.getClient - Returns LLM client
 * @param {Function} options.loadCards - Function to reload saved cards
 * @param {Function} options.onCardGenerated - Called when card is generated
 */
export function useCardGeneration({ getClient, loadCards, onCardGenerated }) {
  const loading = ref(false)
  const error = ref(null)
  
  /**
   * Generate card from dictionary entry
   */
  async function generateFromDictEntry(dictEntry) {
    if (!dictEntry) {
      error.value = 'No dictionary entry to generate from'
      return null
    }
    
    loading.value = true
    error.value = null
    
    try {
      const client = getClient()
      const lookup = await lookupChinese(dictEntry.simplified)
      const dictContext = formatForLLM(lookup)
      const prompt = buildPrompt(dictEntry.simplified, dictContext)
      
      const result = await client.stream({
        messages: [
          { role: 'system', content: 'You are a helpful Chinese language learning assistant. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ]
      })
      
      const generated = parseResponse(result)
      validateCardData(generated)
      
      const newCard = createCard({
        character: dictEntry.simplified,
        ...generated,
        rawDictEntry: lookup.cedict[0]?.raw || '',
        rawIdsEntry: lookup.ids?.raw || ''
      })
      
      saveCard(newCard)
      loadCards()
      onCardGenerated?.(newCard)
      
      return newCard
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Generate card from freeform query
   */
  async function generateFromFreeform(query) {
    if (!query) {
      error.value = 'No query to generate from'
      return null
    }
    
    loading.value = true
    error.value = null
    
    try {
      const client = getClient()
      const prompt = buildFreeformPrompt(query)
      
      const result = await client.stream({
        messages: [
          { role: 'system', content: 'You are a helpful Chinese language learning assistant. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ]
      })
      
      const generated = parseResponse(result)
      validateCardData(generated)
      
      const newCard = createCard(generated)
      
      saveCard(newCard)
      loadCards()
      onCardGenerated?.(newCard)
      
      return newCard
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Regenerate content for an existing card (returns data without saving)
   */
  async function regenerateCard(card) {
    if (!card?.character) {
      error.value = 'No card to regenerate'
      return null
    }
    
    loading.value = true
    error.value = null
    
    try {
      const client = getClient()
      const lookup = await lookupChinese(card.character)
      const dictContext = formatForLLM(lookup)
      const prompt = buildPrompt(card.character, dictContext)
      
      const result = await client.stream({
        messages: [
          { role: 'system', content: 'You are a helpful Chinese language learning assistant. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ]
      })
      
      const generated = parseResponse(result)
      validateCardData(generated)
      
      // Return merged data without saving - let caller decide
      return {
        ...card,
        ...generated,
        rawDictEntry: lookup.cedict[0]?.raw || card.rawDictEntry || '',
        rawIdsEntry: lookup.ids?.raw || card.rawIdsEntry || ''
      }
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }
  
  return {
    loading,
    error,
    generateFromDictEntry,
    generateFromFreeform,
    regenerateCard
  }
}

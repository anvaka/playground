/**
 * Markdown card generation composable - handles streaming LLM-based card generation
 */

import { ref } from 'vue'
import { lookupChinese, formatForLLM } from '../services/dictionary.js'
import { 
  buildCardTemplate, 
  buildMarkdownPrompt, 
  buildFreeformMarkdownPrompt,
  extractCharacterForIndex 
} from '../services/cardMarkdown.js'
import { 
  createMarkdownCard, 
  saveMarkdownCard,
  getMarkdownCardByCharacter 
} from '../services/markdownStorage.js'

/**
 * Create markdown card generation composable with streaming support
 * @param {Object} options
 * @param {Function} options.getClient - Returns LLM client
 * @param {Function} options.onCardSaved - Called when card is saved
 */
export function useMarkdownCardGeneration({ getClient, onCardSaved }) {
  const loading = ref(false)
  const error = ref(null)
  const streamingContent = ref('')
  const currentCard = ref(null)

  /**
   * Build initial template from dictionary lookup
   */
  async function buildTemplate(character) {
    const lookup = await lookupChinese(character)
    return {
      template: buildCardTemplate(character, lookup),
      lookup,
      dictContext: formatForLLM(lookup)
    }
  }

  /**
   * Open or create a card for a character
   * Returns existing card or creates new with dictionary pre-fill
   */
  async function openCard(character) {
    error.value = null
    streamingContent.value = ''
    
    // Check for existing card
    const existing = getMarkdownCardByCharacter(character)
    if (existing) {
      currentCard.value = existing
      return existing
    }
    
    // Build template from dictionary
    const { template, lookup } = await buildTemplate(character)
    
    // Create new unsaved card
    currentCard.value = {
      id: null, // Not saved yet
      character,
      content: template,
      lookup,
      isNew: true
    }
    
    return currentCard.value
  }

  /**
   * Generate card content with streaming
   */
  async function generate(character, existingContent = '') {
    if (!character) {
      error.value = 'No character to generate from'
      return null
    }
    
    loading.value = true
    error.value = null
    streamingContent.value = existingContent
    
    try {
      const client = getClient()
      const lookup = await lookupChinese(character)
      const dictContext = formatForLLM(lookup)
      const prompt = buildMarkdownPrompt(character, dictContext)
      
      // Stream the response
      let fullContent = ''
      
      await client.stream({
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful Chinese language learning assistant. Generate flashcard content in markdown format exactly as requested. Do not wrap in code blocks.' 
          },
          { role: 'user', content: prompt }
        ]
      }, (chunk) => {
        fullContent = chunk.fullContent
        streamingContent.value = fullContent
      })
      
      // Update current card with generated content
      if (currentCard.value) {
        currentCard.value.content = fullContent
        currentCard.value.lookup = lookup
      }
      
      return fullContent
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Generate from freeform input (not in dictionary)
   */
  async function generateFreeform(input) {
    if (!input) {
      error.value = 'No input to generate from'
      return null
    }
    
    loading.value = true
    error.value = null
    streamingContent.value = ''
    
    try {
      const client = getClient()
      const prompt = buildFreeformMarkdownPrompt(input)
      
      let fullContent = ''
      
      await client.stream({
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful Chinese language learning assistant. Generate flashcard content in markdown format exactly as requested. Do not wrap in code blocks.' 
          },
          { role: 'user', content: prompt }
        ]
      }, (chunk) => {
        fullContent = chunk.fullContent
        streamingContent.value = fullContent
      })
      
      // Extract character from generated content for the card
      const character = extractCharacterForIndex(fullContent)
      
      currentCard.value = {
        id: null,
        character,
        content: fullContent,
        isNew: true
      }
      
      return fullContent
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Regenerate content for current card
   */
  async function regenerate() {
    if (!currentCard.value?.character) {
      error.value = 'No card to regenerate'
      return null
    }
    
    return generate(currentCard.value.character, '')
  }

  /**
   * Save the current card
   */
  function save(content) {
    if (!currentCard.value) {
      error.value = 'No card to save'
      return null
    }
    
    const cardData = {
      ...currentCard.value,
      content: content || currentCard.value.content
    }
    
    // Remove transient properties
    delete cardData.lookup
    delete cardData.isNew
    
    const saved = currentCard.value.id 
      ? saveMarkdownCard(cardData)
      : saveMarkdownCard(createMarkdownCard(cardData.content))
    
    currentCard.value = saved
    onCardSaved?.(saved)
    
    return saved
  }

  /**
   * Clear current card state
   */
  function clear() {
    currentCard.value = null
    streamingContent.value = ''
    error.value = null
  }

  /**
   * Clear error
   */
  function clearError() {
    error.value = null
  }

  return {
    loading,
    error,
    streamingContent,
    currentCard,
    openCard,
    generate,
    generateFreeform,
    regenerate,
    save,
    clear,
    clearError
  }
}

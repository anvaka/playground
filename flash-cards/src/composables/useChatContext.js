/**
 * Chat context composable - manages global chat panel state
 * Singleton pattern - shared across all components
 */

import { ref, computed } from 'vue'
import { lookupChinese } from '../services/dictionary.js'

// Singleton state
const showChat = ref(false)
const chatKey = ref(0)
const chatContext = ref({
  cardId: null,
  cardContent: '',
  cardCharacter: '',
  initialQuery: '',
  threadId: null,
  ephemeralContext: null
})

/**
 * Build ephemeral context message from dictionary entry
 */
function buildEphemeralContext(entry, lookup) {
  const parts = []
  
  // Character and pinyin
  parts.push(`**${entry.simplified}** (${entry.pinyin})`)
  if (entry.traditional !== entry.simplified) {
    parts.push(`Traditional: ${entry.traditional}`)
  }
  
  // Definitions
  if (entry.definitions?.length) {
    parts.push('')
    parts.push('**Meaning:**')
    parts.push(entry.definitions.join('; '))
  }
  
  // HSK level
  if (entry.hskLevel) {
    parts.push('')
    parts.push(`**HSK Level:** ${entry.hskLevel}`)
  }
  
  // Components breakdown
  if (lookup?.ids) {
    parts.push('')
    parts.push('**Components:**')
    parts.push(`${entry.simplified}: ${lookup.ids.decomposition}`)
  }
  if (lookup?.componentIds?.length) {
    for (const comp of lookup.componentIds) {
      parts.push(`- ${comp.character}: ${comp.decomposition}`)
    }
  }
  
  parts.push('')
  parts.push('---')
  parts.push('*Ask me anything about this word, or <a href="#" data-action="create-card">create card</a> to make a flashcard.*')
  
  return {
    word: entry.simplified,
    content: parts.join('\n')
  }
}

export function useChatContext() {
  /**
   * Open chat for an existing card
   */
  function openForCard({ cardId, cardContent, cardCharacter }) {
    chatContext.value = {
      cardId,
      cardContent,
      cardCharacter,
      initialQuery: '',
      threadId: null,
      ephemeralContext: null
    }
    showChat.value = true
  }

  /**
   * Open chat with a freeform query (e.g., from search)
   */
  function openWithQuery(query) {
    chatContext.value = {
      cardId: null,
      cardContent: '',
      cardCharacter: '',
      initialQuery: query,
      threadId: null,
      ephemeralContext: null
    }
    chatKey.value++
    showChat.value = true
  }

  /**
   * Open chat for a new word with dictionary context
   */
  async function openForWord(simplified, entry = null, lookup = null) {
    // If no lookup provided, fetch it
    if (!lookup) {
      lookup = await lookupChinese(simplified)
    }
    if (!entry) {
      entry = lookup?.cedict?.[0] || { simplified, definitions: [], pinyin: '' }
    }
    
    chatContext.value = {
      cardId: null,
      cardContent: '',
      cardCharacter: simplified,
      initialQuery: '',
      threadId: null,
      ephemeralContext: buildEphemeralContext(entry, lookup)
    }
    chatKey.value++
    showChat.value = true
  }

  /**
   * Open global chat (no context)
   */
  function openGlobal() {
    chatContext.value = {
      cardId: null,
      cardContent: '',
      cardCharacter: '',
      initialQuery: '',
      threadId: null,
      ephemeralContext: null
    }
    chatKey.value++
    showChat.value = true
  }

  /**
   * Open existing thread
   */
  function openThread(threadId) {
    chatContext.value = {
      cardId: null,
      cardContent: '',
      cardCharacter: '',
      initialQuery: '',
      threadId,
      ephemeralContext: null
    }
    chatKey.value++
    showChat.value = true
  }

  /**
   * Close chat panel
   */
  function close() {
    showChat.value = false
  }

  /**
   * Update context after card changes (e.g., after saving)
   */
  function updateCardContext({ cardId, cardContent, cardCharacter }) {
    chatContext.value = {
      ...chatContext.value,
      cardId,
      cardContent,
      cardCharacter
    }
  }

  return {
    // State (readonly access)
    isOpen: computed(() => showChat.value),
    context: computed(() => chatContext.value),
    chatKey: computed(() => chatKey.value),
    
    // Actions
    openForCard,
    openWithQuery,
    openForWord,
    openGlobal,
    openThread,
    close,
    updateCardContext
  }
}

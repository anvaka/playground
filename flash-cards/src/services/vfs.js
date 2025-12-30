/**
 * Virtual Filesystem Service
 * Provides shell-like interface for LLM to interact with the app
 */

import { 
  getMarkdownCards, 
  getMarkdownCard, 
  getCardCounts,
  getDueCards,
  getNewCards,
  searchMarkdownCards
} from './markdownStorage.js'
import { lookupChinese } from './dictionary.js'

/**
 * App context - set by the UI layer
 */
let appContext = {
  currentView: 'home',
  currentCardId: null,
  currentCardContent: null,
  navigate: null,  // function to navigate
  createCard: null, // function to create card
  editCard: null    // function to edit card
}

/**
 * Set app context from UI
 */
export function setAppContext(ctx) {
  appContext = { ...appContext, ...ctx }
}

/**
 * Get current app context for system prompt
 */
export function getAppContextSummary() {
  const parts = [`View: ${appContext.currentView}`]
  
  if (appContext.currentCardId && appContext.currentCardContent) {
    // Extract character from content
    const charMatch = appContext.currentCardContent.match(/^#\s*Front\s*\n([^\n(]+)/m)
    const char = charMatch?.[1]?.trim() || 'unknown'
    parts.push(`Card: ${char} (id: ${appContext.currentCardId})`)
  }
  
  return parts.join('\n')
}

/**
 * Parse command string into parts, respecting quotes
 */
function parseCommandParts(command) {
  const parts = []
  let current = ''
  let inQuotes = false
  let quoteChar = null
  
  for (let i = 0; i < command.length; i++) {
    const char = command[i]
    
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true
      quoteChar = char
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false
      quoteChar = null
    } else if (char === ' ' && !inQuotes) {
      if (current) {
        parts.push(current)
        current = ''
      }
    } else {
      current += char
    }
  }
  
  if (current) {
    parts.push(current)
  }
  
  return parts
}

/**
 * Execute a shell command
 * @param {string} command - Command string (e.g., "ls /cards", "cat /srs/stats")
 * @returns {Promise<{success: boolean, output: string, action?: object}>}
 */
export async function executeCommand(command) {
  const trimmed = command.trim()
  const parts = parseCommandParts(trimmed)
  const cmd = parts[0]
  const args = parts.slice(1)

  try {
    switch (cmd) {
      case 'ls':
        return handleLs(args[0] || '/')
      
      case 'cat':
        return await handleCat(args[0])
      
      case 'lookup':
        return await handleLookup(args.join(' '))
      
      case 'search':
        return handleSearch(args.join(' '))
      
      case 'navigate':
        return handleNavigate(args[0])
      
      case 'create-card':
        return handleCreateCard(args.join(' '))
      
      case 'edit-card':
        // args[0] = cardId, args[1] = section, args[2] = content (if provided)
        return handleEditCard(args[0], args[1], args[2])
      
      case 'help':
        return { success: true, output: getHelpText() }
      
      default:
        return { success: false, output: `Unknown command: ${cmd}. Type 'help' for available commands.` }
    }
  } catch (err) {
    return { success: false, output: `Error: ${err.message}` }
  }
}

/**
 * Handle 'ls' command
 */
function handleLs(path) {
  if (path === '/' || path === '') {
    return {
      success: true,
      output: `cards/\nsrs/`
    }
  }
  
  if (path === '/cards' || path === '/cards/') {
    const cards = getMarkdownCards()
    if (cards.length === 0) {
      return { success: true, output: '(no cards)' }
    }
    
    const lines = cards.map(c => {
      const status = c.due === null ? 'new' : 'learning'
      return `${c.id}  ${c.character}  [${status}]`
    })
    return { success: true, output: lines.join('\n') }
  }
  
  if (path === '/srs' || path === '/srs/') {
    return {
      success: true,
      output: `stats\nqueue\nnew`
    }
  }
  
  return { success: false, output: `Cannot list: ${path}` }
}

/**
 * Handle 'cat' command
 */
async function handleCat(path) {
  if (!path) {
    return { success: false, output: 'Usage: cat <path>' }
  }

  // /cards/<id>
  const cardMatch = path.match(/^\/cards\/(.+)$/)
  if (cardMatch) {
    const card = getMarkdownCard(cardMatch[1])
    if (!card) {
      return { success: false, output: `Card not found: ${cardMatch[1]}` }
    }
    return { success: true, output: card.content }
  }

  // /srs/stats
  if (path === '/srs/stats') {
    const counts = getCardCounts()
    return {
      success: true,
      output: JSON.stringify({
        due: counts.dueCount,
        new: counts.newCount,
        total: counts.totalCount
      }, null, 2)
    }
  }

  // /srs/queue - next due cards
  if (path === '/srs/queue') {
    const due = getDueCards()
    const preview = due.slice(0, 5).map(c => ({
      id: c.id,
      character: c.character,
      due: c.due || 'new'
    }))
    return {
      success: true,
      output: JSON.stringify(preview, null, 2)
    }
  }

  // /srs/new - new cards only
  if (path === '/srs/new') {
    const newCards = getNewCards()
    const preview = newCards.slice(0, 5).map(c => ({
      id: c.id,
      character: c.character
    }))
    return {
      success: true,
      output: JSON.stringify(preview, null, 2)
    }
  }

  // /session/card - current card content
  if (path === '/session/card') {
    if (!appContext.currentCardContent) {
      return { success: false, output: 'No card currently open' }
    }
    return { success: true, output: appContext.currentCardContent }
  }

  return { success: false, output: `Cannot read: ${path}` }
}

/**
 * Handle 'lookup' command - dictionary lookup
 */
async function handleLookup(word) {
  if (!word) {
    return { success: false, output: 'Usage: lookup <word>' }
  }

  const result = await lookupChinese(word)
  
  if (!result.cedict?.length && !result.ids) {
    return { success: false, output: `Not found: ${word}` }
  }

  const parts = []
  
  if (result.cedict?.length) {
    const entry = result.cedict[0]
    parts.push(`${entry.simplified} (${entry.pinyin})`)
    parts.push(`Definitions: ${entry.definitions.join('; ')}`)
    if (entry.hskLevel) {
      parts.push(`HSK Level: ${entry.hskLevel}`)
    }
  }
  
  if (result.ids) {
    parts.push(`Components: ${result.ids.decomposition}`)
  }
  
  if (result.componentIds?.length) {
    parts.push('Character breakdown:')
    for (const comp of result.componentIds) {
      parts.push(`  ${comp.character}: ${comp.decomposition}`)
    }
  }

  return { success: true, output: parts.join('\n') }
}

/**
 * Handle 'search' command
 */
function handleSearch(query) {
  if (!query) {
    return { success: false, output: 'Usage: search <query>' }
  }

  const results = searchMarkdownCards(query)
  
  if (results.length === 0) {
    return { success: true, output: `No cards matching: ${query}` }
  }

  const lines = results.slice(0, 10).map(c => `${c.id}  ${c.character}`)
  if (results.length > 10) {
    lines.push(`... and ${results.length - 10} more`)
  }
  
  return { success: true, output: lines.join('\n') }
}

/**
 * Handle 'navigate' command
 */
function handleNavigate(target) {
  if (!target) {
    return { success: false, output: 'Usage: navigate <target>\nTargets: home, srs, explore, explore:N, card:<id>' }
  }

  // Return action for UI to execute
  return {
    success: true,
    output: `Navigating to ${target}...`,
    action: { type: 'navigate', target }
  }
}

/**
 * Handle 'create-card' command
 * @param {string} intent - Full user intent, e.g., "grammar card for 在" or just "在"
 */
function handleCreateCard(intent) {
  if (!intent) {
    return { success: false, output: 'Usage: create-card "<intent>"' }
  }

  // Return action - UI will handle the two-phase flow
  return {
    success: true,
    output: `Creating card...`,
    action: { type: 'create-card', intent }
  }
}

/**
 * Handle 'edit-card' command
 * Can be called with just section (triggers generation) or with content (direct edit)
 */
function handleEditCard(cardId, section, content) {
  if (!cardId || !section) {
    return { 
      success: false, 
      output: 'Usage: edit-card <card-id> <section> [content]\nSections: front, hint, back, meaning, examples, related, components, image, answer, pattern, usage, contrast' 
    }
  }

  // Validate section
  const validSections = ['front', 'hint', 'back', 'meaning', 'examples', 'related', 'components', 'image', 'answer', 'pattern', 'usage', 'contrast', 'memory']
  if (!validSections.includes(section)) {
    return { success: false, output: `Invalid section: ${section}\nValid: ${validSections.join(', ')}` }
  }

  // If content provided, return it as a direct edit action
  if (content) {
    // Unescape newlines and other escape sequences
    const unescapedContent = content
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
    
    return {
      success: true,
      output: `Edit ready for ${section} section.`,
      action: { type: 'direct-edit', cardId, section, content: unescapedContent }
    }
  }

  // No content - return action for UI to handle (will prompt for content)
  return {
    success: true,
    output: `Ready to edit ${section} section...`,
    action: { type: 'edit-card', cardId, section }
  }
}

/**
 * Parse commands from LLM response
 * Returns array of command strings found in ```sh blocks
 * Deduplicates consecutive identical commands
 */
export function parseCommands(content) {
  const commands = []
  const regex = /```sh\n([\s\S]*?)```/g
  let match
  
  while ((match = regex.exec(content)) !== null) {
    const cmdBlock = match[1].trim()
    // Split by newlines in case multiple commands (though we prefer one at a time)
    const lines = cmdBlock.split('\n').filter(l => l.trim() && !l.startsWith('#'))
    for (const line of lines) {
      // Skip if this is the same as the last command (dedup)
      if (commands.length === 0 || commands[commands.length - 1] !== line) {
        commands.push(line)
      }
    }
  }
  
  return commands
}

/**
 * Get text content without command blocks (for display)
 */
export function getDisplayText(content) {
  return content
    .replace(/```sh\n[\s\S]*?```/g, '')
    .trim()
}

/**
 * Help text
 */
function getHelpText() {
  return `Available commands:

ls /cards              - List saved cards
ls /srs                - List SRS resources
cat /cards/<id>        - Read a card's content
cat /srs/stats         - Get SRS statistics
cat /srs/queue         - See next due cards
cat /session/card      - Current card content
lookup <word>          - Dictionary lookup
search <query>         - Search cards
navigate <target>      - Go to home|srs|explore|explore:N|card:<id>
create-card <word>     - Create a new flashcard
edit-card <id> <section> - Edit a card section`
}

/**
 * Build minimal system prompt
 */
export function buildShellSystemPrompt() {
  const context = getAppContextSummary()
  
  return `You're a Chinese learning assistant with app access.

Language rules:
- Respond in English unless user explicitly requests Chinese
- Always include pinyin (with tone marks) for any Chinese characters
- When given Chinese text without a clear task, explain it like a teacher — don't respond as if you're in a conversation

Context:
${context}

Commands (output in \`\`\`sh blocks - they run automatically, user sees results):
  ls /cards              - list saved cards
  cat /cards/<id>        - read a card
  cat /srs/stats         - study statistics  
  cat /srs/queue         - next due cards
  lookup <word>          - dictionary lookup
  search <query>         - search cards
  navigate <target>      - go to home|srs|explore|explore:N|card:<id>
  create-card "<intent>" - create flashcard (always include the Chinese word)
  edit-card <id> <section> "<content>" - edit card section with new content

Commands execute automatically - don't ask user to run them.
When editing, provide the complete new section content in quotes.
One command per response. Wait for output before running more.

IMPORTANT - Create vs Edit:
- "new card", "make a card for", "flashcard for [sentence]" → create-card immediately
- Do NOT check existing cards (ls/cat) when user asks for a new card
- Only use ls/cat/edit-card when user explicitly asks to "edit", "update", or "see" existing cards

IMPORTANT: For create-card, always include the Chinese word in the intent.
If user says "create card" while discussing 坐, output: create-card "坐"
If user says "grammar card please", output: create-card "grammar card for 坐"
If user says "make a flashcard for [sentence], drop the X", output: create-card "cloze card for X: [sentence]"

Example:
User: "create a grammar card for 在"
You: \`\`\`sh
create-card "grammar card for 在"
\`\`\`
(System has its own format guide - don't add instructions, just pass the request)
Done - no more commands needed.`
}

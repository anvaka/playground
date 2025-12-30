<template>
  <div class="card-chat">
    <!-- Header -->
    <div class="chat-header">
      <div class="chat-header-top">
        <div class="chat-title">Chat</div>
        <div class="chat-actions">
          <button 
            v-if="currentThread && messages.length > 0"
            class="btn-icon" 
            @click="startNewThread"
            title="New conversation"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button 
            class="btn-icon" 
            @click="$emit('open-settings')"
            title="LLM Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <button class="btn-icon" @click="$emit('close')" title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <!-- Context indicator -->
      <div v-if="cardCharacter" class="chat-context">
        Discussing: <strong>{{ cardCharacter }}</strong>
      </div>
    </div>

    <!-- Thread selector -->
    <div v-if="threads.length > 1" class="thread-selector">
      <select v-model="selectedThreadId" @change="loadThread(selectedThreadId)">
        <option v-for="thread in threads" :key="thread.id" :value="thread.id">
          {{ thread.title || formatThreadDate(thread.updated) }}
        </option>
      </select>
    </div>

    <!-- Messages -->
    <div class="chat-messages" ref="messagesContainer" @click="handleMessagesClick">
      <div v-if="messages.length === 0 && !isStreaming" class="chat-empty">
        <p>Ask questions, explore your cards, or create new ones.</p>
      </div>
      
      <div 
        v-for="msg in messages" 
        :key="msg.id" 
        class="chat-message"
        :class="[msg.role, { 'command-result': msg.isCommandResult }]"
      >
        <div class="message-role">{{ getRoleLabel(msg) }}</div>
        <div class="message-content">
          <div v-if="msg.role === 'assistant'" v-html="renderMarkdown(getMessageDisplayContent(msg))"></div>
          <div v-else-if="msg.isCommandResult" class="command-output"><pre>{{ msg.content }}</pre></div>
          <div v-else>{{ msg.content }}</div>
        </div>
        
        <!-- Generated card action -->
        <div v-if="msg.generatedCard && !msg.applied" class="action-prompt">
          <button class="btn btn-small btn-primary" @click="applyGeneratedCard(msg)">
            Save Card
          </button>
        </div>
        
        <!-- Pending edit action -->
        <div v-if="msg.pendingEdit && !msg.applied" class="action-prompt">
          <button class="btn btn-small btn-primary" @click="applyPendingEdit(msg)">
            Apply Edit
          </button>
        </div>
        
        <div v-if="msg.applied" class="action-applied">✓ Applied</div>
      </div>

      <!-- Streaming message -->
      <div v-if="isStreaming" class="chat-message assistant">
        <div class="message-role">Assistant</div>
        <div class="message-content">
          <div v-if="streamingContent" v-html="renderMarkdown(streamingContent)"></div>
          <span v-else class="typing-indicator">
            <span></span><span></span><span></span>
          </span>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="chat-input-container">
      <textarea
        ref="inputRef"
        v-model="inputText"
        class="chat-input"
        placeholder="Ask about this card..."
        rows="1"
        @keydown.enter.exact.prevent="sendMessage"
        @input="autoResize"
      ></textarea>
      <button 
        class="btn btn-small btn-primary send-btn" 
        @click="sendMessage"
        :disabled="!inputText.trim() || isStreaming"
      >
        Send
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick, computed } from 'vue'
import {
  getAllThreads,
  getThread,
  createThread,
  addMessage,
  updateMessage,
  updateThreadTitle,
  getOrCreateCurrentThread
} from '../services/chatStorage.js'
import { 
  executeCommand, 
  parseCommands, 
  getDisplayText,
  buildShellSystemPrompt,
  setAppContext
} from '../services/vfs.js'
import { buildMarkdownPrompt, renderMarkdown } from '../services/cardMarkdown.js'
import { formatForLLM } from '../services/dictionary.js'
import { useSpeech } from '../composables/useSpeech.js'
import { useLLM } from '@anvaka/vue-llm'
import { useRouter } from '../composables/useRouter.js'
import { useChatContext } from '../composables/useChatContext.js'

const props = defineProps({
  currentView: {
    type: String,
    default: 'home'
  }
})

const { client } = useLLM()
const router = useRouter()
const chat = useChatContext()

const emit = defineEmits(['close', 'edit-card', 'create-card', 'open-settings'])

const { speak } = useSpeech()

// Computed for template access
const cardCharacter = computed(() => chat.context.value.cardCharacter)

// State
const threads = ref([])
const currentThread = ref(null)
const selectedThreadId = ref(null)
const messages = ref([])
const inputText = ref('')
const isStreaming = ref(false)
const streamingContent = ref('')
const messagesContainer = ref(null)
const inputRef = ref(null)
const pendingAction = ref(null) // Action waiting for user confirmation

// Update app context when chat context changes
watch([() => chat.context.value.cardId, () => chat.context.value.cardContent, () => props.currentView], () => {
  setAppContext({
    currentView: props.currentView,
    currentCardId: chat.context.value.cardId,
    currentCardContent: chat.context.value.cardContent
  })
}, { immediate: true })

// Load threads on mount
onMounted(async () => {
  await loadThreads()
  inputRef.value?.focus()
  
  // If a specific thread was requested, load it
  if (chat.context.value.threadId) {
    await loadThread(chat.context.value.threadId)
    return
  }
  
  // If there's an initial query, start a fresh thread and send it
  if (chat.context.value.initialQuery) {
    await startNewThread()
    inputText.value = chat.context.value.initialQuery
    await nextTick()
    await sendMessage()
    return
  }
  
  // If there's ephemeral context (dictionary lookup), show it without persisting
  if (chat.context.value.ephemeralContext) {
    await startNewThread()
    // Add ephemeral message (not persisted)
    messages.value.push({
      id: 'ephemeral-context',
      role: 'assistant',
      content: chat.context.value.ephemeralContext.content,
      timestamp: new Date().toISOString(),
      isEphemeral: true
    })
    await scrollToBottom()
  }
})

async function loadThreads() {
  threads.value = await getAllThreads()
  
  if (threads.value.length > 0) {
    await loadThread(threads.value[0].id)
  } else {
    // No threads yet - will create one on first message
    currentThread.value = null
    selectedThreadId.value = null
    messages.value = []
  }
}

async function loadThread(threadId) {
  const thread = await getThread(threadId)
  if (thread) {
    currentThread.value = thread
    selectedThreadId.value = thread.id
    messages.value = thread.messages || []
    await scrollToBottom()
  }
}

async function startNewThread() {
  currentThread.value = null
  selectedThreadId.value = null
  messages.value = []
  inputText.value = ''
  await nextTick()
  inputRef.value?.focus()
}

function handleMessagesClick(event) {
  const target = event.target
  
  // Handle inline speak icons
  if (target.classList.contains('inline-speak')) {
    const text = decodeURIComponent(target.dataset.speak || '')
    if (text) {
      speak(text)
    }
    return
  }
  
  // Handle create-card links
  if (target.tagName === 'A' && target.dataset.action === 'create-card') {
    event.preventDefault()
    inputText.value = 'Create card'
    sendMessage()
  }
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isStreaming.value) return

  inputText.value = ''
  autoResize()

  // Check if we have ephemeral context that needs to be persisted
  const hasEphemeralContext = messages.value.some(m => m.isEphemeral)
  
  // Create thread if needed
  const isNewThread = !currentThread.value
  if (isNewThread) {
    currentThread.value = await createThread()
    selectedThreadId.value = currentThread.value.id
    threads.value.unshift(currentThread.value)
    
    // If we had ephemeral context, persist it as assistant message
    if (hasEphemeralContext && chat.context.value.ephemeralContext) {
      await addMessage(currentThread.value.id, 'assistant', chat.context.value.ephemeralContext.content)
      // Remove ephemeral flag from the displayed message
      const ephemeralMsg = messages.value.find(m => m.isEphemeral)
      if (ephemeralMsg) {
        ephemeralMsg.isEphemeral = false
      }
    }
  }

  // Add user message
  const userMsgData = await addMessage(currentThread.value.id, 'user', text)
  const userMsg = userMsgData.messages[userMsgData.messages.length - 1]
  messages.value.push(userMsg)

  // Auto-title new threads from first user message
  if (isNewThread) {
    // Use word from ephemeral context if available, otherwise first message
    const title = chat.context.value.ephemeralContext?.word 
      ? `${chat.context.value.ephemeralContext.word} - ${generateThreadTitle(text)}`
      : generateThreadTitle(text)
    await updateThreadTitle(currentThread.value.id, title)
    currentThread.value.title = title
  }

  await scrollToBottom()
  await generateResponse()
}

// Max continuation depth to prevent runaway loops
const MAX_CONTINUATION_DEPTH = 5

async function generateResponse(systemOverride = null, depth = 0) {
  if (depth >= MAX_CONTINUATION_DEPTH) {
    console.warn('Max continuation depth reached')
    return
  }
  
  isStreaming.value = true
  streamingContent.value = ''

  try {
    const systemPrompt = systemOverride || buildShellSystemPrompt()

    // Build message history for context (last 10 messages)
    // The current user message is already in messages.value (added by sendMessage)
    const historyMessages = messages.value.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }))

    let fullContent = ''

    await client.stream({
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages
      ]
    }, (chunk) => {
      fullContent = chunk.fullContent
      streamingContent.value = fullContent
    })

    // Parse any commands from the response
    const commands = parseCommands(fullContent)
    
    // Save assistant message
    const updatedThread = await addMessage(currentThread.value.id, 'assistant', fullContent)
    const assistantMsg = updatedThread.messages[updatedThread.messages.length - 1]
    messages.value.push(assistantMsg)

    // Execute commands if any, then let LLM continue reasoning
    if (commands.length > 0) {
      const shouldContinue = await executeCommandsSequentially(commands)
      if (shouldContinue) {
        // LLM issued commands - let it see results and continue
        await generateResponse(null, depth + 1)
        return // recursive call handles thread refresh
      }
    }

    // Refresh threads list
    threads.value = await getAllThreads()

  } catch (err) {
    const errorMsg = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Error: ${err.message}`,
      timestamp: new Date().toISOString()
    }
    messages.value.push(errorMsg)
  } finally {
    isStreaming.value = false
    streamingContent.value = ''
    await scrollToBottom()
  }
}

/**
 * Execute commands from LLM response
 * Stops execution when hitting a command that requires user interaction
 * @returns {boolean} Whether LLM should continue (had commands but no blocking action)
 */
async function executeCommandsSequentially(commands) {
  let hadCommands = commands.length > 0
  
  for (const cmd of commands) {
    const result = await executeCommand(cmd)
    
    // Add command result as a system message for context
    const resultMsg = {
      id: Date.now().toString(),
      role: 'system',
      content: `$ ${cmd}\n${result.output}`,
      timestamp: new Date().toISOString(),
      isCommandResult: true
    }
    
    // Save to thread
    if (currentThread.value) {
      await addMessage(currentThread.value.id, 'system', resultMsg.content, { isCommandResult: true })
    }
    messages.value.push(resultMsg)
    await scrollToBottom()
    
    // Handle actions that need UI interaction
    if (result.action) {
      const shouldStop = await handleAction(result.action)
      // Stop executing more commands if this action needs user interaction
      if (shouldStop) {
        return false // Don't continue LLM - waiting for user
      }
    }
  }
  
  return hadCommands // Continue LLM if we ran commands
}

/**
 * Handle navigation targets from LLM commands
 */
function handleNavigate(target) {
  // Parse target: home, srs, explore, explore:N, card:<id>
  if (target === 'home') {
    router.goHome()
  } else if (target === 'srs') {
    router.goToReview()
  } else if (target.startsWith('explore')) {
    const level = parseInt(target.split(':')[1]) || 1
    router.goToExplore(level)
  } else if (target.startsWith('card:')) {
    const cardId = target.slice(5)
    router.goToCard(cardId)
  }
}

/**
 * Handle actions from commands
 * @returns {boolean} Whether to stop executing more commands
 */
async function handleAction(action) {
  switch (action.type) {
    case 'navigate':
      handleNavigate(action.target)
      return true  // Navigation is terminal - don't continue LLM
      
    case 'create-card':
      // Two-phase: ask LLM to generate card content with format guide
      pendingAction.value = action
      await generateCardContent(action.intent)
      return true  // Stop - wait for user to save/dismiss card
      
    case 'direct-edit':
      // LLM provided content directly - show confirmation
      const editMsg = {
        id: Date.now().toString(),
        role: 'assistant',
        content: action.content,
        timestamp: new Date().toISOString(),
        pendingEdit: { cardId: action.cardId, section: action.section, content: action.content }
      }
      if (currentThread.value) {
        await addMessage(currentThread.value.id, 'assistant', action.content, { 
          pendingEdit: editMsg.pendingEdit 
        })
      }
      messages.value.push(editMsg)
      await scrollToBottom()
      return true  // Stop - wait for user to apply/dismiss
      
    case 'edit-card':
      // No content provided - ask LLM to generate
      pendingAction.value = action
      await generateEditContent(action.cardId, action.section, action.userRequest)
      return true  // Stop - wait for user to apply/dismiss edit
  }
  return false
}

/**
 * Generate card content with format guide
 * @param {string} intent - Full user intent, e.g., "grammar card for 在" or just "在"
 */
async function generateCardContent(intent) {
  const { lookupChinese } = await import('../services/dictionary.js')
  
  // Extract Chinese characters from intent for dictionary lookup
  const chineseMatch = intent.match(/[\u4e00-\u9fff]+/)
  const word = chineseMatch ? chineseMatch[0] : intent
  
  const dictResult = await lookupChinese(word)
  const dictContext = formatForLLM(dictResult)
  
  // Use intent as the input - it contains both the word and the context (e.g., "grammar card")
  const prompt = buildMarkdownPrompt(intent, dictContext)

  isStreaming.value = true
  streamingContent.value = ''
  
  try {
    let fullContent = ''
    
    await client.stream({
      messages: [
        { role: 'system', content: 'You are a helpful Chinese language learning assistant. Generate flashcard content in markdown format exactly as requested. Do not wrap in code blocks.' },
        { role: 'user', content: prompt }
      ]
    }, (chunk) => {
      fullContent = chunk.fullContent
      streamingContent.value = fullContent
    })
    
    // Save the generated content
    const metadata = { 
      generatedCard: { word, content: fullContent }
    }
    const updatedThread = await addMessage(currentThread.value.id, 'assistant', fullContent, metadata)
    const assistantMsg = updatedThread.messages[updatedThread.messages.length - 1]
    messages.value.push(assistantMsg)
    
  } finally {
    isStreaming.value = false
    streamingContent.value = ''
    pendingAction.value = null
    await scrollToBottom()
  }
}

/**
 * Generate edit content for a section
 */
async function generateEditContent(cardId, section, userRequest) {
  const { getMarkdownCard } = await import('../services/markdownStorage.js')
  const { parseCardSections } = await import('../services/cardMarkdown.js')
  const card = getMarkdownCard(cardId)
  
  if (!card) {
    messages.value.push({
      id: Date.now().toString(),
      role: 'system',
      content: `Card not found: ${cardId}`,
      timestamp: new Date().toISOString()
    })
    return
  }
  
  // Extract just the section content
  const sections = parseCardSections(card.content)
  const currentSectionContent = sections[section] || '(empty)'
  
  const prompt = `Edit the "${section}" section based on this request: "${userRequest}"

Current ${section} content:
${currentSectionContent}

Output ONLY the new content for this section (no header, no explanation). Make minimal changes to fulfill the request.`

  isStreaming.value = true
  streamingContent.value = ''
  
  try {
    let fullContent = ''
    
    await client.stream({
      messages: [
        { role: 'system', content: `You are editing a Chinese flashcard section. Output only the updated content for the ${section} section - no section header, no explanation. Make minimal targeted changes.` },
        { role: 'user', content: prompt }
      ]
    }, (chunk) => {
      fullContent = chunk.fullContent
      streamingContent.value = fullContent
    })
    
    // Save with edit metadata
    const metadata = {
      pendingEdit: { cardId, section, content: fullContent }
    }
    const updatedThread = await addMessage(currentThread.value.id, 'assistant', fullContent, metadata)
    const assistantMsg = updatedThread.messages[updatedThread.messages.length - 1]
    messages.value.push(assistantMsg)
    
  } finally {
    isStreaming.value = false
    streamingContent.value = ''
    pendingAction.value = null
    await scrollToBottom()
  }
}

/**
 * Apply generated card
 */
async function applyGeneratedCard(msg) {
  const { generatedCard } = msg
  if (generatedCard) {
    emit('create-card', { 
      word: generatedCard.word, 
      content: generatedCard.content 
    })
    msg.applied = true
    
    // Persist the applied state
    if (currentThread.value) {
      await updateMessage(currentThread.value.id, msg.id, { applied: true })
    }
  }
}

/**
 * Apply pending edit
 */
async function applyPendingEdit(msg) {
  const { pendingEdit } = msg
  if (pendingEdit) {
    emit('edit-card', {
      cardId: pendingEdit.cardId,
      section: pendingEdit.section,
      content: pendingEdit.content
    })
    msg.applied = true
    
    // Persist the applied state
    if (currentThread.value) {
      await updateMessage(currentThread.value.id, msg.id, { applied: true })
    }
  }
}

function getRoleLabel(msg) {
  if (msg.role === 'user') return 'You'
  if (msg.isCommandResult) return 'System'
  return 'Assistant'
}

function getMessageDisplayContent(msg) {
  // For assistant messages, strip command blocks for display
  return getDisplayText(msg.content)
}

function formatThreadDate(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * Generate a thread title from the first user message
 * Truncates to ~40 chars at word boundary
 */
function generateThreadTitle(message) {
  const maxLength = 40
  const cleaned = message.trim().replace(/\\n+/g, ' ')
  
  if (cleaned.length <= maxLength) {
    return cleaned
  }
  
  // Find last space before maxLength
  const truncated = cleaned.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  
  if (lastSpace > 20) {
    return truncated.slice(0, lastSpace) + '…'
  }
  
  return truncated + '…'
}

async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function autoResize() {
  const el = inputRef.value
  if (el) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }
}
</script>

<style scoped>
.card-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--card-bg);
}

.chat-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.chat-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-title {
  font-weight: 500;
}

.chat-context {
  margin-top: 6px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.chat-context strong {
  color: var(--text);
}

.chat-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  border-radius: var(--radius);
  cursor: pointer;
}

.btn-icon:hover {
  background: var(--bg);
  color: var(--text);
}

.thread-selector {
  padding: 8px 16px;
  border-bottom: 1px solid var(--border);
}

.thread-selector select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--text);
  font-size: 0.85rem;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-empty {
  color: var(--text-muted);
  font-size: 0.9rem;
  padding: 20px 0;
}

.chat-empty p {
  margin: 0;
}

.chat-message {
  font-size: 0.9rem;
  line-height: 1.5;
}

.message-role {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.message-content {
  color: var(--text);
}

.message-content :deep(p) {
  margin: 0 0 8px 0;
}

.message-content :deep(p:last-child) {
  margin-bottom: 0;
}

.message-content :deep(code) {
  background: var(--bg);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.85em;
}

.message-content :deep(pre) {
  background: var(--bg);
  padding: 8px;
  border-radius: var(--radius);
  overflow-x: auto;
  margin: 8px 0;
}

.message-content :deep(ul),
.message-content :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.typing-indicator {
  display: inline-flex;
  gap: 4px;
}

.typing-indicator span {
  width: 5px;
  height: 5px;
  background: var(--text-muted);
  border-radius: 50%;
  animation: typing 1.4s ease-in-out infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.3;
  }
  30% {
    opacity: 1;
  }
}

/* Command result messages */
.chat-message.command-result {
  font-size: 0.8rem;
  opacity: 0.8;
}

.chat-message.command-result .message-role {
  color: var(--secondary);
}

.command-output {
  background: var(--bg);
  border-radius: var(--radius);
  padding: 8px;
  overflow-x: auto;
}

.command-output pre {
  margin: 0;
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Action prompts */
.action-prompt {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.action-applied {
  margin-top: 8px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Input area */
.chat-input-container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
}

.chat-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card-bg);
  color: var(--text);
  font-size: 0.9rem;
  line-height: 1.4;
  resize: none;
  max-height: 120px;
  font-family: inherit;
}

.chat-input:focus {
  outline: none;
  border-color: var(--secondary);
}

.chat-input::placeholder {
  color: var(--text-muted);
}

.send-btn {
  flex-shrink: 0;
}

/* Inline speak icons after Chinese text */
.message-content :deep(.inline-speak) {
  display: inline;
  margin-left: 2px;
  font-size: 0.7em;
  color: var(--text-muted);
  opacity: 0.4;
  cursor: pointer;
  transition: opacity 0.15s ease, color 0.15s ease;
  user-select: none;
  vertical-align: middle;
}

.message-content :deep(.inline-speak:hover) {
  opacity: 1;
  color: var(--secondary);
}
</style>

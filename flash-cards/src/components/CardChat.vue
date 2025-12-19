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
          {{ formatThreadDate(thread.updated) }}
        </option>
      </select>
    </div>

    <!-- Messages -->
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="messages.length === 0 && !isStreaming" class="chat-empty">
        <p>Ask questions about this card, request changes, or discuss grammar.</p>
      </div>
      
      <div 
        v-for="msg in messages" 
        :key="msg.id" 
        class="chat-message"
        :class="msg.role"
      >
        <div class="message-role">{{ msg.role === 'user' ? 'You' : 'Assistant' }}</div>
        <div class="message-content">
          <div v-if="msg.role === 'assistant'" v-html="renderMarkdown(getDisplayContent(msg.content))"></div>
          <div v-else>{{ msg.content }}</div>
        </div>
        
        <!-- Tool call UI -->
        <div v-if="msg.toolCall && !msg.toolApplied" class="tool-call">
          <div class="tool-call-header">
            <span class="tool-name">{{ getToolDescription(msg.toolCall) }}</span>
          </div>
          <div v-if="msg.toolCall.preview" class="tool-preview">
            <pre>{{ msg.toolCall.preview }}</pre>
          </div>
          <div class="tool-actions">
            <button 
              class="btn btn-small btn-primary" 
              @click="applyTool(msg)"
              :disabled="msg.applying"
            >
              {{ msg.applying ? 'Applying...' : 'Apply' }}
            </button>
            <button 
              class="btn btn-small" 
              @click="dismissTool(msg)"
              :disabled="msg.applying"
            >
              Dismiss
            </button>
          </div>
        </div>
        <div v-else-if="msg.toolApplied" class="tool-applied">
          Applied
        </div>
      </div>

      <!-- Streaming message -->
      <div v-if="isStreaming" class="chat-message assistant">
        <div class="message-role">Assistant</div>
        <div class="message-content">
          <div v-if="streamingContent" v-html="renderMarkdown(getDisplayContent(streamingContent))"></div>
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
import { ref, watch, onMounted, nextTick } from 'vue'
import { marked } from 'marked'
import {
  getThreadsForCard,
  getThread,
  createThread,
  addMessage,
  updateMessage
} from '../services/chatStorage.js'
import { buildChatSystemPrompt, parseToolCall } from '../services/cardMarkdown.js'

const props = defineProps({
  cardId: {
    type: String,
    required: true
  },
  cardContent: {
    type: String,
    default: ''
  },
  cardCharacter: {
    type: String,
    default: ''
  },
  initialQuery: {
    type: String,
    default: ''
  },
  getClient: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['close', 'edit-card', 'create-card', 'open-settings'])

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

// Load threads on mount and when cardId changes
watch(() => props.cardId, async (newId) => {
  if (newId) {
    await loadThreads()
  }
}, { immediate: true })

async function loadThreads() {
  threads.value = await getThreadsForCard(props.cardId)
  
  if (threads.value.length > 0) {
    await loadThread(threads.value[0].id)
  } else {
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

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isStreaming.value) return

  inputText.value = ''
  autoResize()

  // Create thread if needed
  if (!currentThread.value) {
    currentThread.value = await createThread(props.cardId)
    selectedThreadId.value = currentThread.value.id
    threads.value.unshift(currentThread.value)
  }

  // Add user message
  const userMsgData = await addMessage(currentThread.value.id, 'user', text)
  const userMsg = userMsgData.messages[userMsgData.messages.length - 1]
  messages.value.push(userMsg)

  await scrollToBottom()
  await generateResponse(text)
}

async function generateResponse(userMessage) {
  isStreaming.value = true
  streamingContent.value = ''

  try {
    const client = props.getClient()
    const systemPrompt = buildChatSystemPrompt(props.cardCharacter, props.cardContent)

    // Build message history for context (last 10 messages)
    const historyMessages = messages.value.slice(-10).map(m => ({
      role: m.role === 'tool' ? 'assistant' : m.role,
      content: m.content
    }))

    let fullContent = ''

    await client.stream({
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: userMessage }
      ]
    }, (chunk) => {
      fullContent = chunk.fullContent
      streamingContent.value = fullContent
    })

    // Check for tool calls
    const toolCall = parseToolCall(fullContent)
    const metadata = toolCall ? { toolCall } : {}

    // Save to storage
    const updatedThread = await addMessage(currentThread.value.id, 'assistant', fullContent, metadata)
    const assistantMsg = updatedThread.messages[updatedThread.messages.length - 1]
    messages.value.push(assistantMsg)

    // Refresh threads list
    threads.value = await getThreadsForCard(props.cardId)

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

async function applyTool(msg) {
  if (msg.applying || msg.toolApplied) return
  
  msg.applying = true
  const { toolCall } = msg
  
  try {
    if (toolCall.name === 'editCardSection' || toolCall.name === 'replaceCard') {
      emit('edit-card', {
        section: toolCall.args?.section,
        content: toolCall.args?.content || toolCall.args?.newContent,
        fullContent: toolCall.name === 'replaceCard' ? toolCall.args?.content : null
      })
    } else if (toolCall.name === 'createCard') {
      // Pass both word and content (if generated)
      emit('create-card', { 
        word: toolCall.args?.word,
        content: toolCall.args?.content 
      })
    }

    msg.toolApplied = true
    msg.applying = false
    
    // Persist the applied state
    if (currentThread.value) {
      await updateMessage(currentThread.value.id, msg.id, { toolApplied: true })
    }
  } catch (err) {
    msg.applying = false
    console.error('Failed to apply tool:', err)
  }
}

function dismissTool(msg) {
  msg.toolCall = null
}

function getToolDescription(toolCall) {
  switch (toolCall.name) {
    case 'editCardSection':
      return `Edit ${toolCall.args?.section || 'section'}`
    case 'replaceCard':
      return 'Replace card content'
    case 'createCard':
      const hasContent = !!toolCall.args?.content
      return hasContent 
        ? `Create card: ${toolCall.args?.word}` 
        : `Create card for "${toolCall.args?.word}" (no content)`
    case 'lookupDictionary':
      return `Look up "${toolCall.args?.word}"`
    default:
      return toolCall.name
  }
}

function renderMarkdown(text) {
  if (!text) return ''
  try {
    return marked.parse(text)
  } catch {
    return text
  }
}

/**
 * Strip tool call markup from content for display
 * Shows card content preview when a card is being generated
 */
function getDisplayContent(content) {
  if (!content) return ''
  
  // Check if there's a createCard or replaceCard with content being streamed
  // Look for "content": " followed by the card markdown
  const contentMatch = content.match(/"content"\s*:\s*"([\s\S]*?)(?:"(?:\s*\})|$)/)
  if (contentMatch) {
    // Extract text before the tool call
    const beforeTool = content.split('<tool>')[0].trim()
    
    // Unescape the JSON string content
    let cardContent = contentMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
    
    // Build display: any intro text + card preview
    const parts = []
    if (beforeTool) {
      parts.push(beforeTool)
    }
    parts.push('\n\n---\n**Card preview:**\n\n' + cardContent)
    return parts.join('')
  }
  
  // No card content being streamed - use simple stripping
  // Remove complete tool calls
  let result = content
    .replace(/<tool>[\s\S]*?<\/tool>/g, '')
    .replace(/<args>[\s\S]*?<\/args>/g, '')
  
  // Handle incomplete tool calls during streaming
  const toolStart = result.indexOf('<tool>')
  if (toolStart !== -1) {
    result = result.substring(0, toolStart)
  }
  
  const argsStart = result.indexOf('<args>')
  if (argsStart !== -1) {
    result = result.substring(0, argsStart)
  }
  
  return result.trim()
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

onMounted(async () => {
  inputRef.value?.focus()
  
  // If there's an initial query, send it automatically
  if (props.initialQuery) {
    inputText.value = props.initialQuery
    await nextTick()
    await sendMessage()
  }
})
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

/* Tool call UI */
.tool-call {
  margin-top: 12px;
  padding: 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.tool-call-header {
  margin-bottom: 8px;
}

.tool-name {
  font-size: 0.85rem;
  color: var(--text);
}

.tool-preview {
  margin-bottom: 10px;
}

.tool-preview pre {
  margin: 0;
  padding: 8px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.8rem;
  max-height: 120px;
  overflow: auto;
}

.tool-actions {
  display: flex;
  gap: 8px;
}

.tool-applied {
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
</style>

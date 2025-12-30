/**
 * Chat storage service using IndexedDB
 * Stores global conversation threads (not tied to specific cards)
 */

const DB_NAME = 'flashcards-chats'
const DB_VERSION = 2  // Bump version for schema change
const STORE_NAME = 'threads'

let dbPromise = null

/**
 * Generate a unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

/**
 * Initialize and get the database connection
 */
function getDB() {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // Delete old store if exists (schema change)
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME)
      }
      
      // Create threads store with updated indexes
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      store.createIndex('updated', 'updated', { unique: false })
    }
  })

  return dbPromise
}

/**
 * Get all chat threads (global)
 * @returns {Promise<Array>} Threads sorted by updated date (newest first)
 */
export async function getAllThreads() {
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const threads = request.result || []
      // Sort by updated date, newest first
      threads.sort((a, b) => new Date(b.updated) - new Date(a.updated))
      resolve(threads)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get a single thread by ID
 * @param {string} threadId - Thread ID
 * @returns {Promise<Object|null>} Thread object or null
 */
export async function getThread(threadId) {
  const db = await getDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(threadId)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Create a new chat thread
 * @param {string} title - Optional title for the thread
 * @returns {Promise<Object>} Created thread object
 */
export async function createThread(title = null) {
  const db = await getDB()
  const now = new Date().toISOString()

  const thread = {
    id: generateId(),
    title,  // Can be set later based on first message
    created: now,
    updated: now,
    messages: []
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.add(thread)

    request.onsuccess = () => resolve(thread)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Update the title of a thread
 * @param {string} threadId - Thread ID
 * @param {string} title - New title
 * @returns {Promise<Object>} Updated thread
 */
export async function updateThreadTitle(threadId, title) {
  const db = await getDB()
  const thread = await getThread(threadId)

  if (!thread) {
    throw new Error(`Thread not found: ${threadId}`)
  }

  thread.title = title
  thread.updated = new Date().toISOString()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(thread)

    request.onsuccess = () => resolve(thread)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Add a message to a thread
 * @param {string} threadId - Thread ID
 * @param {string} role - 'user' | 'assistant' | 'tool'
 * @param {string} content - Message content
 * @param {Object} metadata - Optional metadata (tool calls, etc.)
 * @returns {Promise<Object>} Updated thread
 */
export async function addMessage(threadId, role, content, metadata = {}) {
  const db = await getDB()
  const thread = await getThread(threadId)

  if (!thread) {
    throw new Error(`Thread not found: ${threadId}`)
  }

  const message = {
    id: generateId(),
    role,
    content,
    timestamp: new Date().toISOString(),
    ...metadata
  }

  thread.messages.push(message)
  thread.updated = message.timestamp

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(thread)

    request.onsuccess = () => resolve(thread)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Update the last assistant message (for streaming)
 * @param {string} threadId - Thread ID
 * @param {string} content - Updated content
 * @returns {Promise<Object>} Updated thread
 */
export async function updateLastAssistantMessage(threadId, content) {
  const db = await getDB()
  const thread = await getThread(threadId)

  if (!thread) {
    throw new Error(`Thread not found: ${threadId}`)
  }

  // Find last assistant message
  for (let i = thread.messages.length - 1; i >= 0; i--) {
    if (thread.messages[i].role === 'assistant') {
      thread.messages[i].content = content
      thread.updated = new Date().toISOString()
      break
    }
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(thread)

    request.onsuccess = () => resolve(thread)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Delete a thread
 * @param {string} threadId - Thread ID to delete
 * @returns {Promise<void>}
 */
export async function deleteThread(threadId) {
  const db = await getDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(threadId)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get the most recent thread (or create one if none exist)
 * @returns {Promise<Object>} Most recent thread
 */
export async function getOrCreateCurrentThread() {
  const threads = await getAllThreads()
  
  if (threads.length > 0) {
    return threads[0]  // Most recent
  }
  
  // Create a new thread
  return createThread()
}

/**
 * Update a specific message in a thread (for marking tool as applied)
 * @param {string} threadId - Thread ID
 * @param {string} messageId - Message ID to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated thread
 */
export async function updateMessage(threadId, messageId, updates) {
  const db = await getDB()
  const thread = await getThread(threadId)

  if (!thread) {
    throw new Error(`Thread not found: ${threadId}`)
  }

  const msgIndex = thread.messages.findIndex(m => m.id === messageId)
  if (msgIndex >= 0) {
    thread.messages[msgIndex] = { ...thread.messages[msgIndex], ...updates }
    thread.updated = new Date().toISOString()
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(thread)

    request.onsuccess = () => resolve(thread)
    request.onerror = () => reject(request.error)
  })
}

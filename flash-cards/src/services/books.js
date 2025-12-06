/**
 * Book storage service using IndexedDB
 * Stores reader books with their pages, translations, and reading progress
 */

const DB_NAME = 'flashcards-reader'
const DB_VERSION = 1
const STORE_NAME = 'books'

let db = null

/**
 * Open/create the IndexedDB database
 */
async function openDB() {
  if (db) return db
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }
    
    request.onupgradeneeded = (e) => {
      const database = e.target.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

/**
 * Deep clone to remove Vue reactivity (required for IndexedDB storage)
 */
function toPlainObject(obj) {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Save or update a book
 */
export async function saveBook(book) {
  const database = await openDB()
  // Clone to remove Vue reactivity - IndexedDB can't store reactive proxies
  const plainBook = toPlainObject(book)
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(plainBook)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(plainBook)
  })
}

/**
 * Get a single book by ID
 */
export async function getBook(id) {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || null)
  })
}

/**
 * Get all books, sorted by most recently created
 */
export async function getAllBooks() {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const books = request.result || []
      books.sort((a, b) => new Date(b.created) - new Date(a.created))
      resolve(books)
    }
  })
}

/**
 * Delete a book by ID
 */
export async function deleteBook(id) {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Generate a unique book ID
 */
export function generateBookId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// ============ Page Chunking ============

// Chinese sentence endings, English sentence endings, or paragraph breaks (2+ newlines)
const SENTENCE_ENDINGS_ZH = /[。！？]+/g
const SENTENCE_ENDINGS_EN = /[.!?]+(?=\s|$)|\n{2,}/g
const TARGET_PAGE_SIZE = 300  // characters for Chinese, words for English

/**
 * Check if text contains Chinese characters
 */
export function containsChinese(text) {
  return /[\u4e00-\u9fff]/.test(text)
}

/**
 * Normalize text by collapsing single newlines into spaces (for English)
 * Preserves paragraph breaks (2+ newlines)
 */
function normalizeEnglishText(text) {
  // First, normalize paragraph breaks to a consistent marker
  // Then collapse single newlines to spaces
  // Finally, restore paragraph breaks
  return text
    .replace(/\r\n/g, '\n')           // normalize line endings
    .replace(/\n{2,}/g, '\n\n')       // normalize multiple newlines to exactly 2
    .replace(/(?<!\n)\n(?!\n)/g, ' ') // single newline -> space
    .replace(/  +/g, ' ')             // collapse multiple spaces
}

/**
 * Chunk text into pages, breaking at sentence boundaries
 * Returns array of { start, end, translated, segments }
 */
export function chunkIntoPages(text) {
  const isChinese = containsChinese(text)
  const pages = []
  
  // For English, normalize the text first to handle line-wrapped paragraphs
  const workingText = isChinese ? text : normalizeEnglishText(text)
  const sentencePattern = isChinese ? SENTENCE_ENDINGS_ZH : SENTENCE_ENDINGS_EN
  
  // Split into sentences
  const sentences = []
  let lastEnd = 0
  
  for (const match of workingText.matchAll(sentencePattern)) {
    const sentenceEnd = match.index + match[0].length
    const sentenceText = workingText.slice(lastEnd, sentenceEnd).trim()
    if (sentenceText) {
      sentences.push({
        text: sentenceText,
        start: lastEnd,
        end: sentenceEnd
      })
    }
    lastEnd = sentenceEnd
  }
  
  // Trailing text without sentence ending
  const trailingText = workingText.slice(lastEnd).trim()
  if (trailingText) {
    sentences.push({
      text: trailingText,
      start: lastEnd,
      end: workingText.length
    })
  }
  
  // Handle empty or very short text
  if (sentences.length === 0) {
    return [{
      start: 0,
      end: workingText.length,
      text: workingText,
      translated: null,
      segments: null
    }]
  }
  
  // Group sentences into pages
  let currentPage = { 
    start: sentences[0].start, 
    end: sentences[0].end,
    sentences: [sentences[0]]
  }
  let currentSize = 0
  
  for (const sentence of sentences) {
    const sentenceSize = isChinese 
      ? sentence.text.length  // character count
      : sentence.text.split(/\s+/).filter(Boolean).length  // word count
    
    if (currentSize + sentenceSize > TARGET_PAGE_SIZE && currentSize > 0) {
      // Finalize current page and start new one
      currentPage.text = currentPage.sentences.map(s => s.text).join(' ')
      pages.push(currentPage)
      currentPage = { 
        start: sentence.start, 
        end: sentence.end,
        sentences: [sentence]
      }
      currentSize = sentenceSize
    } else {
      // Add to current page
      currentPage.end = sentence.end
      currentPage.sentences.push(sentence)
      currentSize += sentenceSize
    }
  }
  
  // Don't forget last page
  if (currentPage.sentences && currentPage.sentences.length > 0) {
    currentPage.text = currentPage.sentences.map(s => s.text).join(' ')
    pages.push(currentPage)
  }
  
  // Return clean page objects
  return pages.map(p => ({
    start: p.start,
    end: p.end,
    text: p.text,
    translated: null,
    segments: null
  }))
}

/**
 * Create a new book object
 */
export function createBook({ sourceText, targetLevel }) {
  const sourceLanguage = containsChinese(sourceText) ? 'zh' : 'en'
  const pages = chunkIntoPages(sourceText)
  
  return {
    id: generateBookId(),
    created: new Date().toISOString(),
    title: 'Untitled',
    sourceText,
    sourceLanguage,
    targetLevel,
    pages,
    currentPage: 0
  }
}

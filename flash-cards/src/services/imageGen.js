/**
 * Image generation service using OpenAI's gpt-image-1
 * Stores generated images in IndexedDB to avoid localStorage limits
 */

const DB_NAME = 'flashcards-images'
const DB_VERSION = 1
const STORE_NAME = 'images'

let dbPromise = null

/**
 * Initialize IndexedDB connection
 */
function getDB() {
  if (dbPromise) return dbPromise
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'cardId' })
      }
    }
  })
  
  return dbPromise
}

/**
 * Generate an image using OpenAI's gpt-image-1
 * @param {string} prompt - Image generation prompt
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<string>} - Base64 encoded image data
 */
export async function generateImage(prompt, apiKey) {
  if (!apiKey) {
    throw new Error('OpenAI API key not provided')
  }
  
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1024',
      quality: 'medium',
      n: 1
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Image generation failed: ${error}`)
  }
  
  const data = await response.json()
  
  // gpt-image-1 returns b64_json by default
  if (data.data?.[0]?.b64_json) {
    return data.data[0].b64_json
  }
  
  // If URL is returned, fetch and convert to base64
  if (data.data?.[0]?.url) {
    return await urlToBase64(data.data[0].url)
  }
  
  throw new Error('Unexpected response format from image API')
}

/**
 * Convert image URL to base64
 */
async function urlToBase64(url) {
  const response = await fetch(url)
  const blob = await response.blob()
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      // Remove data URL prefix to get pure base64
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Save image to IndexedDB
 * @param {string} cardId - Card ID to associate image with
 * @param {string} base64Data - Base64 encoded image data
 */
export async function saveImage(cardId, base64Data) {
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    
    const request = store.put({
      cardId,
      data: base64Data,
      savedAt: new Date().toISOString()
    })
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get image from IndexedDB
 * @param {string} cardId - Card ID
 * @returns {Promise<string|null>} - Base64 data or null if not found
 */
export async function getImage(cardId) {
  if (!cardId) return null
  
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    
    const request = store.get(cardId)
    
    request.onsuccess = () => {
      resolve(request.result?.data || null)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Delete image from IndexedDB
 * @param {string} cardId - Card ID
 */
export async function deleteImage(cardId) {
  if (!cardId) return
  
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    
    const request = store.delete(cardId)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Check if image exists for a card
 * @param {string} cardId - Card ID
 * @returns {Promise<boolean>}
 */
export async function hasImage(cardId) {
  const image = await getImage(cardId)
  return !!image
}

/**
 * Convert base64 to data URL for display
 * @param {string} base64Data - Base64 encoded image
 * @returns {string} - Data URL
 */
export function toDataUrl(base64Data) {
  if (!base64Data) return null
  // Handle if already a data URL
  if (base64Data.startsWith('data:')) return base64Data
  return `data:image/png;base64,${base64Data}`
}

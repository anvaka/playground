/**
 * Image generation service using OpenAI's gpt-image-1
 * Stores images as Blobs in IndexedDB for efficient storage
 * Supports multiple images per card via card://cardId/img/N URLs
 */

const DB_NAME = 'flashcards-images'
const DB_VERSION = 2 // Upgraded for Blob storage + multi-image support
const STORE_NAME = 'images'

const MAX_IMAGE_DIMENSION = 1200
const JPEG_QUALITY = 0.85

let dbPromise = null

/**
 * Initialize IndexedDB connection with migration support
 */
function getDB() {
  if (dbPromise) return dbPromise
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      const oldVersion = event.oldVersion
      
      if (oldVersion < 1) {
        // Fresh install - create store with new schema
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      } else if (oldVersion < 2) {
        // Migration from v1: change keyPath from 'cardId' to 'id'
        // Delete old store and create new one (data migration happens separately)
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME)
        }
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
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
    const blob = await urlToBlob(data.data[0].url)
    return blobToBase64(blob)
  }
  
  throw new Error('Unexpected response format from image API')
}

/**
 * Convert Blob to base64 string (for legacy compatibility)
 */
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Generate image ID from cardId and index
 * Format: cardId/img/N
 */
function makeImageId(cardId, index = 0) {
  return `${cardId}/img/${index}`
}

/**
 * Parse image ID to extract cardId and index
 */
function parseImageId(imageId) {
  const match = imageId.match(/^(.+)\/img\/(\d+)$/)
  if (!match) return null
  return { cardId: match[1], index: parseInt(match[2], 10) }
}

/**
 * Get next available image index for a card
 * @param {string} cardId - Card ID
 * @returns {Promise<number>} - Next available index
 */
export async function getNextImageIndex(cardId) {
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAllKeys()
    
    request.onsuccess = () => {
      const keys = request.result
      const prefix = `${cardId}/img/`
      const indices = keys
        .filter(k => k.startsWith(prefix))
        .map(k => parseInt(k.slice(prefix.length), 10))
        .filter(n => !isNaN(n))
      
      resolve(indices.length === 0 ? 0 : Math.max(...indices) + 1)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Convert image URL to Blob
 */
async function urlToBlob(url) {
  const response = await fetch(url)
  return response.blob()
}

/**
 * Resize image blob if it exceeds max dimensions
 * @param {Blob} blob - Original image blob
 * @param {number} maxDimension - Maximum width or height
 * @returns {Promise<Blob>} - Resized blob (or original if small enough)
 */
export async function resizeImageBlob(blob, maxDimension = MAX_IMAGE_DIMENSION) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      
      const { width, height } = img
      
      // No resize needed
      if (width <= maxDimension && height <= maxDimension) {
        resolve(blob)
        return
      }
      
      // Calculate new dimensions preserving aspect ratio
      const ratio = Math.min(maxDimension / width, maxDimension / height)
      const newWidth = Math.round(width * ratio)
      const newHeight = Math.round(height * ratio)
      
      // Draw to canvas
      const canvas = document.createElement('canvas')
      canvas.width = newWidth
      canvas.height = newHeight
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, newWidth, newHeight)
      
      // Check for transparency to decide format
      const hasAlpha = blob.type === 'image/png'
      const outputType = hasAlpha ? 'image/png' : 'image/jpeg'
      const quality = hasAlpha ? undefined : JPEG_QUALITY
      
      canvas.toBlob(
        (resizedBlob) => resolve(resizedBlob),
        outputType,
        quality
      )
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for resizing'))
    }
    
    img.src = url
  })
}

/**
 * Save image Blob to IndexedDB
 * @param {string} cardId - Card ID
 * @param {number} index - Image index (0-based)
 * @param {Blob} blob - Image blob
 */
export async function saveImageBlob(cardId, index, blob) {
  const db = await getDB()
  const id = makeImageId(cardId, index)
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    
    const request = store.put({
      id,
      cardId,
      index,
      blob,
      mimeType: blob.type,
      size: blob.size,
      savedAt: new Date().toISOString()
    })
    
    request.onsuccess = () => resolve(id)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Save image to IndexedDB (legacy base64 API - converts to Blob)
 * @param {string} cardId - Card ID to associate image with
 * @param {string} base64Data - Base64 encoded image data
 */
export async function saveImage(cardId, base64Data) {
  // Convert base64 to Blob for storage
  const byteChars = atob(base64Data)
  const byteNumbers = new Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: 'image/png' })
  
  // Save as index 0 (primary image)
  return saveImageBlob(cardId, 0, blob)
}

/**
 * Get image Blob from IndexedDB by full image ID
 * @param {string} imageId - Full image ID (cardId/img/N)
 * @returns {Promise<{blob: Blob, mimeType: string}|null>}
 */
export async function getImageBlob(imageId) {
  if (!imageId) return null
  
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    
    const request = store.get(imageId)
    
    request.onsuccess = () => {
      const result = request.result
      if (!result) {
        resolve(null)
        return
      }
      resolve({ blob: result.blob, mimeType: result.mimeType })
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get image from IndexedDB (legacy API - returns base64)
 * @param {string} cardId - Card ID
 * @returns {Promise<string|null>} - Base64 data or null if not found
 */
export async function getImage(cardId) {
  if (!cardId) return null
  
  // Try new format first (cardId/img/0)
  const imageId = makeImageId(cardId, 0)
  const result = await getImageBlob(imageId)
  
  if (!result) return null
  
  // Convert Blob back to base64 for legacy compatibility
  return blobToBase64(result.blob)
}

/**
 * Get image as Object URL for display
 * @param {string} imageId - Full image ID (cardId/img/N)
 * @returns {Promise<string|null>} - Object URL or null
 */
export async function getImageAsObjectURL(imageId) {
  const result = await getImageBlob(imageId)
  if (!result) return null
  return URL.createObjectURL(result.blob)
}

/**
 * Get all images for a card
 * @param {string} cardId - Card ID
 * @returns {Promise<Array<{id: string, index: number, blob: Blob}>>}
 */
export async function getAllCardImages(cardId) {
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    
    request.onsuccess = () => {
      const all = request.result || []
      const cardImages = all
        .filter(item => item.cardId === cardId)
        .sort((a, b) => a.index - b.index)
      resolve(cardImages)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Delete a specific image from IndexedDB
 * @param {string} imageId - Full image ID (cardId/img/N)
 */
export async function deleteImageById(imageId) {
  if (!imageId) return
  
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    
    const request = store.delete(imageId)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Delete image from IndexedDB (legacy API - deletes primary image)
 * @param {string} cardId - Card ID
 */
export async function deleteImage(cardId) {
  if (!cardId) return
  return deleteImageById(makeImageId(cardId, 0))
}

/**
 * Delete all images for a card
 * @param {string} cardId - Card ID
 */
export async function deleteAllCardImages(cardId) {
  if (!cardId) return
  
  const images = await getAllCardImages(cardId)
  for (const img of images) {
    await deleteImageById(img.id)
  }
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

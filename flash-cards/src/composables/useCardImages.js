/**
 * Composable for resolving card:// image URLs to object URLs
 * Manages lifecycle of created object URLs to prevent memory leaks
 */

import { ref, onUnmounted } from 'vue'
import { getImageAsObjectURL } from '../services/imageGen.js'

/**
 * Parse card:// URL to extract image ID
 * @param {string} url - URL like card://cardId/img/0
 * @returns {string|null} - Image ID or null if not a card:// URL
 */
export function parseCardImageUrl(url) {
  if (!url || !url.startsWith('card://')) return null
  return url.slice(7) // Remove 'card://' prefix
}

/**
 * Check if a URL is a card:// URL
 */
export function isCardImageUrl(url) {
  return url?.startsWith('card://')
}

/**
 * Composable for managing card:// image resolution
 * Tracks object URLs and revokes them on unmount
 */
export function useCardImages() {
  const objectUrls = ref(new Map()) // imageId -> objectUrl
  const loading = ref(new Set())
  const errors = ref(new Map()) // imageId -> error message

  /**
   * Resolve a card:// URL to an object URL
   * Returns cached URL if already resolved
   */
  async function resolveImageUrl(cardUrl) {
    const imageId = parseCardImageUrl(cardUrl)
    if (!imageId) return cardUrl // Not a card:// URL, return as-is

    // Return cached URL
    if (objectUrls.value.has(imageId)) {
      return objectUrls.value.get(imageId)
    }

    // Skip if already loading
    if (loading.value.has(imageId)) {
      return null
    }

    loading.value.add(imageId)
    errors.value.delete(imageId)

    try {
      const objectUrl = await getImageAsObjectURL(imageId)
      if (objectUrl) {
        objectUrls.value.set(imageId, objectUrl)
        return objectUrl
      } else {
        errors.value.set(imageId, 'Image not found')
        return null
      }
    } catch (err) {
      errors.value.set(imageId, err.message)
      return null
    } finally {
      loading.value.delete(imageId)
    }
  }

  /**
   * Check if an image is currently loading
   */
  function isLoading(cardUrl) {
    const imageId = parseCardImageUrl(cardUrl)
    return imageId ? loading.value.has(imageId) : false
  }

  /**
   * Get error for an image
   */
  function getError(cardUrl) {
    const imageId = parseCardImageUrl(cardUrl)
    return imageId ? errors.value.get(imageId) : null
  }

  /**
   * Revoke all object URLs to free memory
   */
  function cleanup() {
    for (const url of objectUrls.value.values()) {
      URL.revokeObjectURL(url)
    }
    objectUrls.value.clear()
    loading.value.clear()
    errors.value.clear()
  }

  // Cleanup on unmount
  onUnmounted(cleanup)

  return {
    resolveImageUrl,
    isLoading,
    getError,
    cleanup,
    objectUrls
  }
}

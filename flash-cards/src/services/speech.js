/**
 * Chinese text-to-speech service using Web Speech API
 * Optimized for rapid sequential playback in games
 * Works across macOS, Windows, iOS, and Android
 */

let chineseVoice = null
let voiceSearchDone = false
let currentUtterance = null

/**
 * Check if speech synthesis is available
 */
export function isSupported() {
  return 'speechSynthesis' in window
}

/**
 * Score a voice for quality - higher is better
 * Prefers premium/neural voices across platforms
 */
function scoreVoice(voice) {
  let score = 0
  
  // Prefer zh-CN over zh-TW for mainland Mandarin
  if (voice.lang === 'zh-CN') score += 10
  else if (voice.lang === 'zh-TW') score += 5
  else if (voice.lang.startsWith('zh')) score += 1
  
  // Premium voices by platform - much higher quality
  const premiumNames = [
    'Tingting', 'Sinji', 'Meijia', 'Lili',  // macOS
    'Xiaoxiao', 'Yunyang', 'Xiaoyi',         // Windows 11 neural
    'Google',                                 // Chrome/Android
  ]
  if (premiumNames.some(n => voice.name.includes(n))) score += 100
  
  // Avoid "compact" or low-quality variants
  if (voice.name.toLowerCase().includes('compact')) score -= 50
  
  // Strongly prefer local voices - network voices often fail on Android
  if (voice.localService) score += 200
  
  return score
}

/**
 * Find the best Chinese voice from available voices
 */
function findBestChineseVoice() {
  const voices = speechSynthesis.getVoices()
  if (voices.length === 0) return null
  
  // Filter to Chinese voices and sort by quality score
  const chineseVoices = voices
    .filter(v => v.lang.startsWith('zh'))
    .map(v => ({ voice: v, score: scoreVoice(v) }))
    .sort((a, b) => b.score - a.score)
  
  return chineseVoices[0]?.voice || null
}

/**
 * Ensure we have searched for voices (handles async loading in Chrome/Android)
 */
function ensureVoiceReady() {
  return new Promise((resolve) => {
    // Already found a voice
    if (chineseVoice) {
      resolve(chineseVoice)
      return
    }
    
    // Try to find now
    const found = findBestChineseVoice()
    if (found) {
      chineseVoice = found
      voiceSearchDone = true
      resolve(found)
      return
    }
    
    // If we've already tried and failed, don't block
    if (voiceSearchDone) {
      resolve(null)
      return
    }
    
    // Wait for voices to load (Chrome/Android loads async)
    const onVoicesChanged = () => {
      const voice = findBestChineseVoice()
      chineseVoice = voice
      voiceSearchDone = true
      speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
      resolve(voice)
    }
    
    speechSynthesis.addEventListener('voiceschanged', onVoicesChanged)
    
    // Timeout fallback - Android can be slower, give it more time
    setTimeout(() => {
      if (!voiceSearchDone) {
        voiceSearchDone = true
        chineseVoice = findBestChineseVoice()
        speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
        resolve(chineseVoice)
      }
    }, 2000)
  })
}

/**
 * Pre-warm the speech engine by finding the voice early
 * Call this on app/game init for faster first speak
 */
export function preload() {
  if (isSupported()) {
    ensureVoiceReady()
  }
}

/**
 * Speak Chinese text - optimized for rapid sequential calls
 * Cancels any ongoing speech immediately for responsive feedback
 * 
 * @param {string} text - Chinese text to speak
 * @param {Object} options - Optional settings
 * @param {number} options.rate - Speech rate 0.1-2 (default: 1.0 for snappy response)
 * @returns {Promise<void>} Resolves when speech ends or is cancelled
 */
export async function speak(text, { rate = 1.0 } = {}) {
  if (!isSupported() || !text) return Promise.resolve()
  
  // Cancel any ongoing speech immediately for responsive feel
  stop()
  
  // Try to get voice, but don't block if unavailable
  const voice = await ensureVoiceReady()
  
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = rate
    
    // Use found voice, or let browser pick default for zh-CN
    if (voice) {
      utterance.voice = voice
    }
    
    currentUtterance = utterance
    
    utterance.onend = () => {
      currentUtterance = null
      resolve()
    }
    utterance.onerror = () => {
      currentUtterance = null
      resolve()
    }
    
    // Android Chrome fix: ensure clean state
    speechSynthesis.cancel()
    
    // Short delay for Android stability
    setTimeout(() => {
      speechSynthesis.speak(utterance)
      
      // Resume in case it's paused (can happen on Android)
      if (speechSynthesis.paused) {
        speechSynthesis.resume()
      }
      
      // Timeout fallback - speech can get stuck on Android
      const timeoutMs = Math.max(5000, text.length * 500)
      setTimeout(() => {
        if (currentUtterance === utterance) {
          currentUtterance = null
          resolve()
        }
      }, timeoutMs)
    }, 50)
  })
}

/**
 * Stop any ongoing speech immediately
 */
export function stop() {
  if (isSupported()) {
    speechSynthesis.cancel()
    currentUtterance = null
  }
}

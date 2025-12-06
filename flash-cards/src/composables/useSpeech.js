/**
 * Speech composable - reactive wrapper for text-to-speech
 */

import { ref, onUnmounted } from 'vue'
import { speak as speakService, stop as stopService, isSupported as checkSupported, preload } from '../services/speech.js'

/**
 * Create speech composable for Chinese TTS
 * @returns {{ speak: Function, stop: Function, isSpeaking: import('vue').Ref<boolean>, isSupported: boolean }}
 */
export function useSpeech() {
  const isSpeaking = ref(false)
  const isSupported = checkSupported()
  
  // Pre-warm the speech engine for faster first playback
  if (isSupported) {
    preload()
  }
  
  async function speak(text, options) {
    if (!isSupported || !text) return
    
    isSpeaking.value = true
    try {
      await speakService(text, options)
    } finally {
      isSpeaking.value = false
    }
  }
  
  function stop() {
    stopService()
    isSpeaking.value = false
  }
  
  // Cleanup on component unmount
  onUnmounted(() => {
    stop()
  })
  
  return {
    speak,
    stop,
    isSpeaking,
    isSupported
  }
}

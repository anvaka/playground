/**
 * Reader composable - manages book state, page navigation, and translation
 */

import { ref, computed } from 'vue'
import { 
  getAllBooks, 
  getBook, 
  saveBook, 
  deleteBook, 
  createBook,
  containsChinese 
} from '../services/books.js'
import { lookupChinese, formatDefinitions, isInDictionary } from '../services/dictionary.js'

// Re-export for components
export { isInDictionary }

// Lazy-loaded segmenter
let segmentFn = null

/**
 * Load pinyin-pro segmenter on demand
 */
async function loadSegmenter() {
  if (segmentFn) return segmentFn
  
  const [{ segment, addDict }, CompleteDict] = await Promise.all([
    import('pinyin-pro'),
    import('@pinyin-pro/data/complete').then(m => m.default)
  ])
  
  addDict(CompleteDict)
  segmentFn = segment
  return segmentFn
}

/**
 * Segment Chinese text into words with pinyin
 */
async function segmentText(chineseText) {
  const segment = await loadSegmenter()
  const result = segment(chineseText)
  
  return result.map(item => ({
    text: item.origin,
    pinyin: item.result
  }))
}

/**
 * Look up meaning for a segment from CEDICT
 */
export async function getSegmentMeaning(text) {
  const lookup = await lookupChinese(text)
  if (lookup.cedict?.[0]) {
    return formatDefinitions(lookup.cedict[0].definitions, 3)
  }
  return ''
}

/**
 * Get pinyin for text using pinyin-pro
 */
export async function getTextPinyin(text) {
  const segment = await loadSegmenter()
  const result = segment(text)
  return result.map(item => item.result).join(' ')
}

/**
 * Build translation prompt with context
 * For first page, also requests a title suggestion
 */
function buildTranslationPrompt(book, pageIndex) {
  const page = book.pages[pageIndex]
  const pageText = book.sourceText.slice(page.start, page.end)
  
  // Get context from adjacent pages for continuity
  let prevContext = ''
  let nextContext = ''
  
  if (pageIndex > 0) {
    const prevPage = book.pages[pageIndex - 1]
    const prevText = book.sourceText.slice(prevPage.start, prevPage.end)
    const sentences = prevText.split(/[。！？.!?\n]+/).filter(Boolean)
    prevContext = sentences.slice(-2).join('。')
  }
  
  if (pageIndex < book.pages.length - 1) {
    const nextPage = book.pages[pageIndex + 1]
    const nextText = book.sourceText.slice(nextPage.start, nextPage.end)
    const sentences = nextText.split(/[。！？.!?\n]+/).filter(Boolean)
    nextContext = sentences.slice(0, 2).join('。')
  }
  
  // Level-specific guidelines
  const levelConfig = {
    'hsk1-2': {
      vocab: '~300 basic words',
      guidelines: `- Natural sentence flow, not fragmented
- Keep the original style and tone
- Simplify or skip complex details
- Combine related ideas into single sentences`
    },
    'hsk3-4': {
      vocab: '~1200 words, common idioms OK',
      guidelines: `- Natural sentence flow
- Keep the original style and tone
- Can use common idioms with context
- Simplify obscure references`
    },
    'hsk5-6': {
      vocab: '~2500+ words',
      guidelines: `- Natural Chinese expression
- Preserve literary style when possible
- Avoid obscure classical expressions`
    },
    'natural': {
      vocab: 'no restrictions',
      guidelines: `- Translate naturally and accurately
- Preserve the author's voice and style
- Prioritize fluency and accuracy`
    }
  }
  
  const config = levelConfig[book.targetLevel] || levelConfig.natural
  
  // Build context section if available
  let contextSection = ''
  if (prevContext || nextContext) {
    contextSection = `
For continuity, here is surrounding context (DO NOT translate this):
${prevContext ? `Previous: ${prevContext}` : ''}
${nextContext ? `Next: ${nextContext}` : ''}
`
  }

  // For first page, request title in JSON format
  const needsTitle = pageIndex === 0 && book.title === 'Untitled'
  
  if (needsTitle) {
    return `Rewrite this in simple Chinese for learners (${book.targetLevel} level, ${config.vocab}).

Guidelines:
${config.guidelines}
${contextSection}
Text to translate:
${pageText}

Return JSON with a short title (2-5 words, in the source language) and the Chinese translation:
{"title": "Short Title Here", "translation": "Chinese text here..."}`
  }

  return `Rewrite this in simple Chinese for learners (${book.targetLevel} level, ${config.vocab}).

Guidelines:
${config.guidelines}
${contextSection}
Text to translate:
${pageText}

Chinese version:`
}

/**
 * Build prompt for back-translating simplified Chinese to English
 * Returns JSON array of {zh, en} pairs - LLM controls sentence boundaries
 */
function buildBackTranslationPrompt(chineseText) {
  return `Split this Chinese text into sentences and translate each to English.
Return a JSON array where each element has "zh" (the Chinese sentence) and "en" (English translation).

Chinese text:
${chineseText}

Return ONLY valid JSON, no other text:
[{"zh": "第一句中文。", "en": "First sentence in English."}, ...]`
}

/**
 * Build prompt for generating a title from text
 */
function buildTitlePrompt(text, sourceLanguage) {
  const lang = sourceLanguage === 'zh' ? 'Chinese' : 'English'
  return `Generate a short title (2-5 words) for this ${lang} text. Return only the title, nothing else.

Text:
${text.slice(0, 500)}

Title:`
}

/**
 * Create the reader composable
 */
export function useReader(getLLMClient) {
  const books = ref([])
  const currentBook = ref(null)
  const loading = ref(false)
  const translating = ref(false)
  const backTranslating = ref(false)
  const error = ref(null)
  const backTranslationError = ref(null)
  
  // Current page data
  const currentPageIndex = computed(() => currentBook.value?.currentPage ?? 0)
  const currentPage = computed(() => currentBook.value?.pages?.[currentPageIndex.value] ?? null)
  const totalPages = computed(() => currentBook.value?.pages?.length ?? 0)
  
  // Get original text for current page
  const currentPageOriginal = computed(() => {
    if (!currentBook.value || !currentPage.value) return ''
    return currentBook.value.sourceText.slice(currentPage.value.start, currentPage.value.end)
  })
  
  /**
   * Load all books from IndexedDB
   */
  async function loadBooks() {
    loading.value = true
    error.value = null
    try {
      books.value = await getAllBooks()
    } catch (err) {
      error.value = 'Failed to load books: ' + err.message
      console.error(err)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Open a book for reading
   */
  async function openBook(bookId) {
    loading.value = true
    error.value = null
    try {
      currentBook.value = await getBook(bookId)
      if (!currentBook.value) {
        throw new Error('Book not found')
      }
    } catch (err) {
      error.value = 'Failed to open book: ' + err.message
      console.error(err)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Close current book
   */
  function closeBook() {
    currentBook.value = null
  }
  
  /**
   * Create a new book and open it
   */
  async function createNewBook({ sourceText, targetLevel }) {
    loading.value = true
    error.value = null
    try {
      const book = createBook({ sourceText, targetLevel })
      await saveBook(book)
      books.value = await getAllBooks()
      currentBook.value = book
      return book
    } catch (err) {
      error.value = 'Failed to create book: ' + err.message
      console.error(err)
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Generate a title for a book using LLM
   */
  async function generateTitle(book) {
    try {
      const client = getLLMClient()
      if (!client) return
      
      const prompt = buildTitlePrompt(book.sourceText, book.sourceLanguage)
      const response = await client.stream({
        messages: [{ role: 'user', content: prompt }]
      })
      
      const title = response.trim().replace(/^["']|["']$/g, '')
      if (title && title.length < 100) {
        book.title = title
      }
    } catch (err) {
      console.error('Title generation failed:', err)
      // Non-fatal, keep 'Untitled'
    }
  }
  
  /**
   * Delete a book
   */
  async function removeBook(bookId) {
    loading.value = true
    error.value = null
    try {
      await deleteBook(bookId)
      books.value = await getAllBooks()
      if (currentBook.value?.id === bookId) {
        currentBook.value = null
      }
    } catch (err) {
      error.value = 'Failed to delete book: ' + err.message
      console.error(err)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Navigate to a specific page
   */
  async function goToPage(pageIndex) {
    if (!currentBook.value) return
    if (pageIndex < 0 || pageIndex >= currentBook.value.pages.length) return
    
    currentBook.value.currentPage = pageIndex
    await saveBook(currentBook.value)
    
    // Translate page if needed
    await ensurePageTranslated(pageIndex)
  }
  
  /**
   * Go to next page
   */
  async function nextPage() {
    await goToPage(currentPageIndex.value + 1)
  }
  
  /**
   * Go to previous page
   */
  async function prevPage() {
    await goToPage(currentPageIndex.value - 1)
  }

  /**
   * Ensure current page is translated and segmented
   */
  async function ensurePageTranslated(pageIndex = currentPageIndex.value) {
    if (!currentBook.value) return
    
    const page = currentBook.value.pages[pageIndex]
    if (!page) return
    
    // For Chinese source with "natural" level, just segment without translation
    if (currentBook.value.sourceLanguage === 'zh' && currentBook.value.targetLevel === 'natural') {
      if (!page.segments) {
        translating.value = true
        try {
          const text = currentBook.value.sourceText.slice(page.start, page.end)
          page.translated = text  // Same as source
          page.segments = await segmentText(text)
          
          // Generate title for first page if needed
          if (pageIndex === 0 && currentBook.value.title === 'Untitled') {
            await generateTitle(currentBook.value)
          }
          
          await saveBook(currentBook.value)
        } catch (err) {
          error.value = 'Segmentation failed: ' + err.message
          console.error(err)
        } finally {
          translating.value = false
        }
      }
      // Always ensure back-translation for proper sentence splitting
      if (!page.backTranslation) {
        await ensureBackTranslation(pageIndex)
      }
      return
    }
    
    // Need translation
    if (!page.translated) {
      translating.value = true
      error.value = null
      try {
        const client = getLLMClient()
        if (!client) {
          throw new Error('LLM not configured. Please configure in Settings.')
        }
        
        const prompt = buildTranslationPrompt(currentBook.value, pageIndex)
        const response = await client.stream({
          messages: [{ role: 'user', content: prompt }]
        })
        
        // First page with 'Untitled' returns JSON with title
        const needsTitle = pageIndex === 0 && currentBook.value.title === 'Untitled'
        if (needsTitle) {
          const jsonMatch = response.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0])
              if (parsed.title) {
                currentBook.value.title = parsed.title
              }
              page.translated = (parsed.translation || response).trim()
            } catch {
              // JSON parse failed, use response as-is
              page.translated = response.trim()
            }
          } else {
            page.translated = response.trim()
          }
        } else {
          page.translated = response.trim()
        }
        
        page.segments = await segmentText(page.translated)
        await saveBook(currentBook.value)
      } catch (err) {
        error.value = 'Translation failed: ' + err.message
        console.error(err)
      } finally {
        translating.value = false
      }
    } else if (!page.segments) {
      // Has translation but no segments
      translating.value = true
      try {
        page.segments = await segmentText(page.translated)
        await saveBook(currentBook.value)
      } catch (err) {
        error.value = 'Segmentation failed: ' + err.message
        console.error(err)
      } finally {
        translating.value = false
      }
    }
    
    // Always ensure back-translation for proper sentence splitting
    if (!page.backTranslation) {
      await ensureBackTranslation(pageIndex)
    }
  }
  
  /**
   * Ensure back-translation (Chinese → English) exists for current page
   * Returns array of {zh, en} sentence pairs for interleaved display
   */
  async function ensureBackTranslation(pageIndex = currentPageIndex.value) {
    if (!currentBook.value) return
    
    const page = currentBook.value.pages[pageIndex]
    if (!page?.translated || page.backTranslation) return
    
    backTranslating.value = true
    backTranslationError.value = null
    try {
      const client = getLLMClient()
      if (!client) {
        throw new Error('LLM not configured. Please configure in Settings.')
      }
      
      const prompt = buildBackTranslationPrompt(page.translated)
      const response = await client.stream({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 40000  // Need more tokens for JSON with all sentence pairs
      })
      
      console.log('Back-translation response:', response)
      
      // Parse JSON response - array of {zh, en} pairs
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        // Segment each Chinese sentence for ruby rendering
        const pairs = await Promise.all(parsed.map(async (pair) => ({
          zh: pair.zh,
          en: pair.en,
          segments: await segmentText(pair.zh)
        })))
        page.backTranslation = pairs
      } else {
        console.error('No JSON array found in response:', response)
        throw new Error('Invalid response format - no JSON array found')
      }
      await saveBook(currentBook.value)
    } catch (err) {
      backTranslationError.value = 'Back-translation failed: ' + err.message
      console.error(err)
    } finally {
      backTranslating.value = false
    }
  }
  
  /**
   * Retry back-translation for current page
   */
  async function retryBackTranslation() {
    if (!currentBook.value || !currentPage.value) return
    
    // Clear existing back-translation only
    currentPage.value.backTranslation = null
    backTranslationError.value = null
    
    await ensureBackTranslation()
  }
  
  /**
   * Retry translation for current page
   */
  async function retryTranslation() {
    if (!currentBook.value || !currentPage.value) return
    
    // Clear existing translation
    currentPage.value.translated = null
    currentPage.value.segments = null
    
    await ensurePageTranslated()
  }
  
  /**
   * Update display settings for current book
   */
  async function updateDisplaySettings(settings) {
    if (!currentBook.value) return
    currentBook.value.displaySettings = settings
    await saveBook(currentBook.value)
  }
  
  return {
    // State
    books,
    currentBook,
    loading,
    translating,
    backTranslating,
    error,
    backTranslationError,
    
    // Computed
    currentPageIndex,
    currentPage,
    totalPages,
    currentPageOriginal,
    
    // Actions
    loadBooks,
    openBook,
    closeBook,
    createNewBook,
    removeBook,
    goToPage,
    nextPage,
    prevPage,
    ensurePageTranslated,
    ensureBackTranslation,
    retryTranslation,
    retryBackTranslation,
    updateDisplaySettings
  }
}

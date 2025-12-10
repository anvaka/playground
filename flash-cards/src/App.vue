<template>
  <div class="app">
    <header class="header">
      <h1 class="header-title" @click="goHome">Chinese Flashcards</h1>
      <div class="header-actions">
        <button class="btn btn-small" @click="showSettings = true">Settings</button>
      </div>
    </header>
    
    <!-- Global Search Bar (always visible except during games) -->
    <SearchBar 
      v-if="!router.isGames.value"
      ref="searchBarRef"
      placeholder="Search Chinese or English..."
      @select="handleDictSelect"
      @freeform="handleFreeform"
    />
    
    <!-- URL Loading State -->
    <div v-if="cardState.urlLoading.value" class="card loading-card">
      <p>Loading card...</p>
    </div>
    
    <!-- Deck Browser (home view) -->
    <DeckBrowser
      v-if="router.isHome.value && !cardState.urlLoading.value"
      :user-cards="savedCards"
      @openDeck="handleOpenDeck"
      @openGames="handleOpenGames"
      @openReader="handleOpenReader"
    />
    
    <!-- Deck View (browsing a specific deck, not viewing a card) -->
    <DeckView
      v-else-if="router.isDeck.value"
      :title="deckNav.activeDeckTitle.value"
      :cards="deckNav.activeDeckCards.value"
      @back="handleCloseDeck"
      @selectCard="handleSelectCardFromDeck"
    />
    
    <!-- Flash Match Setup -->
    <FlashMatchSetup
      v-if="router.isGames.value && router.gameStage.value === 'setup'"
      @back="handleBackFromGameSetup"
      @start="handleStartFlashMatch"
    />
    
    <!-- Flash Match Game -->
    <FlashMatchGame
      v-if="router.isGames.value && router.gameStage.value === 'play'"
      :game="flashMatch"
      @quit="handleQuitFlashMatch"
      @finished="handleGameFinished"
    />
    
    <!-- Flash Match Results -->
    <FlashMatchResults
      v-if="router.isGames.value && router.gameStage.value === 'results'"
      :game="flashMatch"
      @back="handleBackFromGameResults"
      @setup="handleBackToGameSetup"
      @playAgain="handlePlayFlashMatchAgain"
      @navigateToCard="handleNavigateFromGame"
    />
    
    <!-- Reader Home -->
    <ReaderHome
      v-if="router.isReader.value && router.readerStage.value === 'home'"
      :books="reader.books.value"
      :loading="reader.loading.value"
      @back="handleCloseReader"
      @newBook="handleNewBook"
      @openBook="handleOpenBook"
      @deleteBook="handleDeleteBook"
    />
    
    <!-- Book Creator -->
    <BookCreator
      v-if="router.isReader.value && router.readerStage.value === 'create'"
      @cancel="handleCancelBookCreate"
      @create="handleCreateBook"
    />
    
    <!-- Reading View -->
    <ReadingView
      v-if="router.isReader.value && router.readerStage.value === 'reading' && reader.currentBook.value"
      :book="reader.currentBook.value"
      :page="reader.currentPage.value"
      :current-page-index="reader.currentPageIndex.value"
      :total-pages="reader.totalPages.value"
      :original-text="reader.currentPageOriginal.value"
      :translating="reader.translating.value"
      :back-translating="reader.backTranslating.value"
      :error="reader.error.value"
      :back-translation-error="reader.backTranslationError.value"
      :on-add-word="handleAddWordFromReader"
      @back="handleCloseBook"
      @prevPage="reader.prevPage()"
      @nextPage="reader.nextPage()"
      @translate="reader.ensurePageTranslated()"
      @backTranslate="reader.ensureBackTranslation()"
      @retry="reader.retryTranslation()"
      @retryBackTranslation="reader.retryBackTranslation()"
      @openWord="handleOpenWordFromReader"
      @miniCardChange="readerHasMiniCard = $event"
      @settingsChange="reader.updateDisplaySettings($event)"
    />
    
    <!-- Error display -->
    <div v-if="displayError" class="card error-card">
      <p class="error-text">{{ displayError }}</p>
      <p v-if="isJsonParseError" class="error-hint">LLM generated invalid JSON. This happens occasionally - try again.</p>
      <div class="error-actions">
        <button v-if="canRetryGeneration" class="btn btn-small" @click="handleRetry">Retry</button>
        <button class="btn btn-small btn-secondary" @click="clearError">Dismiss</button>
      </div>
    </div>
    
    <!-- Navigation header when browsing cards in a deck -->
    <div v-if="isBrowsingCards" ref="studyHeaderRef" class="study-header">
      <button class="btn btn-small" @click="handleCloseCard">← Back</button>
      <h2 class="study-header-title">{{ deckNav.activeDeckTitle.value }}</h2>
      <div class="study-header-nav">
        <button 
          class="nav-btn" 
          @click="handlePrevCard" 
          :disabled="deckNav.currentIndex.value === 0"
          title="Previous (←)"
        >
          ‹
        </button>
        <div class="study-progress">
          {{ deckNav.currentIndex.value + 1 }} / {{ deckNav.displayOrder.value.length }}
        </div>
        <button 
          class="nav-btn" 
          @click="handleNextCard" 
          :disabled="deckNav.currentIndex.value === deckNav.displayOrder.value.length - 1"
          title="Next (→)"
        >
          ›
        </button>
      </div>
      <button class="btn btn-small" @click="handleShuffleDeck" title="Shuffle">Shuffle</button>
    </div>
    
    <!-- Trivia Card View -->
    <TriviaCardView
      v-if="cardState.currentCard.value && cardState.currentCard.value.type === 'trivia' && !router.isGames.value && !router.isReader.value"
      :card="cardState.currentCard.value"
      :key="'trivia-' + cardState.currentCard.value.id"
      :initial-flipped="cardState.isNewCard.value"
      :show-close="!isBrowsingCards"
      :scroll-target-ref="studyHeaderRef"
      @delete="handleDelete"
      @close="handleCloseCard"
      @navigate="handleNavigateToWord"
    />
    
    <!-- Vocabulary/Phrase Card View -->
    <CardView 
      v-else-if="cardState.currentCard.value && !router.isGames.value && !router.isReader.value"
      :card="cardState.currentCard.value"
      :key="'vocab-' + cardState.currentCard.value.id"
      :is-new="cardState.isNewCard.value"
      :loading="cardGen.loading.value"
      :initial-flipped="cardState.isNewCard.value"
      :show-close="!isBrowsingCards"
      :hsk-badge="cardState.currentHskBadge.value"
      :is-in-collection="cardState.isCurrentCardInCollection.value"
      :regenerated-data="regeneratedData"
      :scroll-target-ref="studyHeaderRef"
      @generate="handleGenerate"
      @regenerate="handleRegenerate"
      @clearRegenerated="regeneratedData = null"
      @save="handleSaveCard"
      @delete="handleDelete"
      @close="handleCloseCard"
      @addToCollection="handleAddToCollection"
      @navigate="handleNavigateToWord"
    />
    
    <!-- Settings Modal -->
    <Settings 
      v-if="showSettings"
      @close="showSettings = false"
      @saved="loadCards"
    />

    <!-- LLM Config Modal -->
    <Teleport to="body">
      <LLMConfigModal 
        :is-visible="showLLMConfig"
        @close="showLLMConfig = false"
        @config-changed="handleLLMConfigChanged"
      />
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useLLM, LLMConfigModal } from '@anvaka/vue-llm'

import SearchBar from './components/SearchBar.vue'
import CardView from './components/CardView.vue'
import TriviaCardView from './components/TriviaCardView.vue'
import Settings from './components/Settings.vue'
import DeckBrowser from './components/DeckBrowser.vue'
import DeckView from './components/DeckView.vue'
import FlashMatchSetup from './components/games/FlashMatchSetup.vue'
import FlashMatchGame from './components/games/FlashMatchGame.vue'
import FlashMatchResults from './components/games/FlashMatchResults.vue'
import ReaderHome from './components/reader/ReaderHome.vue'
import BookCreator from './components/reader/BookCreator.vue'
import ReadingView from './components/reader/ReadingView.vue'

import { initDictionary } from './services/dictionary.js'
import { getLocalCards, saveCard, createCard, getCardByCharacter } from './services/storage.js'

import { useAppRouter } from './composables/useAppRouter.js'
import { useDeckNavigation } from './composables/useDeckNavigation.js'
import { useCardState } from './composables/useCardState.js'
import { useCardGeneration } from './composables/useCardGeneration.js'
import { useFlashMatch } from './composables/useFlashMatch.js'
import { useReader } from './composables/useReader.js'

// ============ Core State ============

const { client, getActiveProviderId, refresh } = useLLM()

const showSettings = ref(false)
const showLLMConfig = ref(false)
const savedCards = ref([])
const regeneratedData = ref(null)
const studyHeaderRef = ref(null)
const searchBarRef = ref(null)

// Flash match game state
const flashMatch = useFlashMatch()

// Reader state
const reader = useReader(() => client)
const readerHasMiniCard = ref(false)  // Track if mini-card is open in reader

function loadCards() {
  savedCards.value = getLocalCards()
}

function isConfigured() {
  return !!getActiveProviderId()
}

// ============ Composables Setup ============

// Card state management
const cardState = useCardState({
  savedCards,
  loadCards
})

// Deck navigation
const deckNav = useDeckNavigation({
  savedCards,
  onCardChange: (card) => {
    cardState.currentCard.value = card
    cardState.currentDictLookup.value = null
    cardState.updateHskBadge()
    // Update card index in URL without pushing new history entry
    router.updateCardIndex(deckNav.currentIndex.value)
  }
})

// Card generation
const cardGen = useCardGeneration({
  getClient: () => client,
  loadCards,
  onCardGenerated: (card) => {
    cardState.markAsGenerated(card)
  }
})

// Unified app router
const router = useAppRouter({
  onNavigate: handleRouteChange
})

/**
 * Handle route changes from browser back/forward navigation or initial load
 */
async function handleRouteChange(route) {
  // Clear states that don't match the new route
  if (route.view === 'home') {
    cardState.closeCard()
    deckNav.closeDeck()
    flashMatch.resetGame()
    reader.closeBook()
  } else if (route.view === 'deck') {
    cardState.closeCard()
    flashMatch.resetGame()
    reader.closeBook()
    if (route.deck) {
      await deckNav.openDeck(route.deck)
    }
  } else if (route.view === 'card') {
    flashMatch.resetGame()
    reader.closeBook()
    // Restore deck context if present
    if (route.deck && (!deckNav.activeDeck.value || JSON.stringify(deckNav.activeDeck.value) !== JSON.stringify(route.deck))) {
      await deckNav.openDeck(route.deck)
    } else if (!route.deck && deckNav.activeDeck.value) {
      deckNav.closeDeck()
    }
    // Restore card
    if (route.card) {
      await restoreCardFromRoute(route)
    }
  } else if (route.view === 'games') {
    cardState.closeCard()
    deckNav.closeDeck()
    reader.closeBook()
    // If navigating directly to play/results without active game, redirect to setup
    if ((route.gameStage === 'play' || route.gameStage === 'results') && flashMatch.status.value === 'setup') {
      router.goToGames('setup')
      return
    }
  } else if (route.view === 'reader') {
    cardState.closeCard()
    deckNav.closeDeck()
    flashMatch.resetGame()
    // Handle reader state
    if (route.readerStage === 'reading' && route.bookId) {
      await reader.loadBooks()
      await reader.openBook(route.bookId)
    } else if (route.readerStage === 'home') {
      reader.closeBook()
      await reader.loadBooks()
    }
  }
}

/**
 * Restore card state from route
 */
async function restoreCardFromRoute(route) {
  if (!route.card) return
  
  // Check if card is in current deck
  if (deckNav.activeDeck.value && deckNav.activeDeckCards.value.length > 0) {
    const deckCard = deckNav.findCardInDeck(route.card)
    if (deckCard) {
      deckNav.openCardFromDeck(deckCard)
      cardState.openSavedCard(deckCard)
      if (typeof route.cardIndex === 'number' && route.cardIndex >= 0) {
        deckNav.currentIndex.value = route.cardIndex
      }
      return
    }
  }
  
  // Fall back to opening by character
  await cardState.openCardByCharacter(route.card)
  if (!deckNav.activeDeck.value) {
    deckNav.clearNavigation()
  }
}

// ============ Computed ============

const isBrowsingCards = computed(() => {
  return cardState.currentCard.value && 
         !cardState.isNewCard.value && 
         deckNav.displayOrder.value.length > 0 &&
         router.hasDeckContext.value
})

const displayError = computed(() => cardState.error.value || cardGen.error.value)

const isJsonParseError = computed(() => {
  const err = displayError.value
  return err && (err.includes('JSON') || err.includes('position') || err.includes('Unexpected'))
})

const canRetryGeneration = computed(() => {
  return cardState.pendingFreeformQuery.value || cardState.pendingDictEntry.value
})

// ============ Event Handlers ============

async function handleNavigateToWord(character) {
  // Navigate to a related word - opens without deck context
  deckNav.clearNavigation()
  await cardState.openCardByCharacter(character)
  router.goToCard(character)
}

async function handleDictSelect(entry) {
  const result = await cardState.handleDictSelect(entry, {
    findCardInDeck: deckNav.findCardInDeck,
    openCardFromDeck: deckNav.openCardFromDeck,
    activeDeck: deckNav.activeDeck,
    activeDeckCards: deckNav.activeDeckCards
  })
  
  if (result.action === 'openSaved') {
    if (deckNav.activeDeck.value) {
      const idx = deckNav.activeDeckCards.value.findIndex(c => c.id === result.card.id)
      if (idx >= 0) {
        deckNav.displayOrder.value = deckNav.activeDeckCards.value.map((_, i) => i)
        deckNav.currentIndex.value = idx
      }
      router.goToCard(entry.simplified, deckNav.activeDeck.value, idx)
    } else {
      deckNav.setupSavedCardsNavigation(result.card)
      router.goToCard(entry.simplified)
    }
  } else if (result.action === 'newCard' || result.action === 'openHsk') {
    deckNav.clearNavigation()
    router.goToCard(entry.simplified)
  } else if (result.action === 'openDeck') {
    router.goToCard(entry.simplified, deckNav.activeDeck.value)
  }
}

async function handleFreeform(query) {
  if (!isConfigured()) {
    showLLMConfig.value = true
    return
  }
  
  cardState.handleFreeform(query)
  deckNav.clearNavigation()
  router.goToCard(query)
  
  await cardGen.generateFromFreeform(cardState.pendingFreeformQuery.value)
}

async function handleGenerate() {
  if (!isConfigured()) {
    showLLMConfig.value = true
    return
  }
  
  if (cardState.pendingFreeformQuery.value) {
    await cardGen.generateFromFreeform(cardState.pendingFreeformQuery.value)
  } else if (cardState.pendingDictEntry.value) {
    await cardGen.generateFromDictEntry(cardState.pendingDictEntry.value)
  } else {
    cardState.error.value = 'No dictionary entry to generate from'
  }
}

async function handleRegenerate() {
  if (!isConfigured()) {
    showLLMConfig.value = true
    return
  }
  
  if (!cardState.currentCard.value) {
    cardState.error.value = 'No card to regenerate'
    return
  }
  
  const result = await cardGen.regenerateCard(cardState.currentCard.value)
  if (result) {
    regeneratedData.value = result
  }
}

function handleSaveCard(card) {
  cardState.saveCurrentCard(card)
}

function handleAddToCollection() {
  cardState.addCurrentToCollection()
}

// ============ Game Handlers ============

function handleOpenGames() {
  router.goToGames('setup')
}

function handleBackFromGameSetup() {
  flashMatch.resetGame()
  router.goHome()
}

function handleBackFromGameResults() {
  flashMatch.resetGame()
  router.goToGames('setup')
}

function handleBackToGameSetup() {
  router.goToGames('setup')
}

async function handleStartFlashMatch(config) {
  flashMatch.mode.value = config.mode
  flashMatch.hidePinyin.value = config.hidePinyin
  flashMatch.selectedTags.value = config.tags
  flashMatch.timeLimit.value = config.timeLimit
  
  try {
    await flashMatch.initGame()
    router.goToGames('play')
  } catch (err) {
    cardState.error.value = err.message
  }
}

function handleQuitFlashMatch() {
  flashMatch.resetGame()
  router.goToGames('setup')
}

function handleGameFinished() {
  router.goToGames('results')
}

async function handlePlayFlashMatchAgain() {
  try {
    await flashMatch.initGame()
    router.goToGames('play')
  } catch (err) {
    cardState.error.value = err.message
    router.goToGames('setup')
  }
}

async function handleNavigateFromGame(character) {
  flashMatch.resetGame()
  await cardState.openCardByCharacter(character)
  router.goToCard(character)
}

// ============ Reader Handlers ============

async function handleOpenReader() {
  await reader.loadBooks()
  router.goToReader('home')
}

function handleCloseReader() {
  reader.closeBook()
  router.goHome()
}

function handleNewBook() {
  router.goToReader('create')
}

function handleCancelBookCreate() {
  router.goToReader('home')
}

async function handleOpenBook(bookId) {
  await reader.openBook(bookId)
  if (reader.currentBook.value) {
    router.goToReader('reading', bookId)
  }
}

function handleCloseBook() {
  reader.closeBook()
  router.goToReader('home')
}

async function handleCreateBook(bookData) {
  const book = await reader.createNewBook(bookData)
  if (book) {
    router.goToReader('reading', book.id)
  }
}

async function handleDeleteBook(bookId) {
  await reader.removeBook(bookId)
}

function handleAddWordFromReader({ text, pinyin, meaning, bookTitle, bookId }) {
  // Check if card already exists
  const existing = getCardByCharacter(text, pinyin)
  if (existing) {
    return { success: false, reason: 'exists' }
  }
  
  // Create a card from the reader word
  const card = createCard({
    character: text,
    pinyin: pinyin,
    meaning: meaning,
    translation: meaning,
    tags: ['user', 'reader', `book:${bookTitle}`],
    sourceBookId: bookId
  })
  
  saveCard(card)
  loadCards()
  return { success: true, card }
}

async function handleOpenWordFromReader(character) {
  // Prepopulate search with the word - search overlay appears on top of reader
  // Don't close reader so user can easily go back
  if (searchBarRef.value) {
    await searchBarRef.value.prepopulateSearch(character)
  }
}

async function handleOpenDeck(deckInfo) {
  await deckNav.openDeck(deckInfo)
  router.goToDeck(deckInfo)
}

function handleCloseDeck() {
  deckNav.closeDeck()
  router.goHome()
}

function handleSelectCardFromDeck(card, shuffledOrder) {
  deckNav.openCardFromDeck(card, shuffledOrder)
  cardState.openSavedCard(card)
  router.goToCard(card.character, deckNav.activeDeck.value, deckNav.currentIndex.value)
}

function handlePrevCard() {
  deckNav.prevCard()
}

function handleNextCard() {
  deckNav.nextCard()
}

function handleShuffleDeck() {
  deckNav.shuffleCurrentDeck()
}

function handleCloseCard() {
  cardState.closeCard()
  
  if (deckNav.activeDeck.value) {
    router.goToDeck(deckNav.activeDeck.value)
  } else {
    deckNav.clearNavigation()
    router.goHome()
  }
}

function handleDelete() {
  if (!confirm('Delete this card?')) return
  
  const cardId = cardState.currentCard.value.id
  const wasUserDeck = deckNav.activeDeck.value?.type === 'user'
  
  cardState.handleDelete(cardId)
  
  // If browsing a deck, try to move to next card
  if (isBrowsingCards.value && deckNav.displayOrder.value.length > 1) {
    const nextCard = deckNav.removeFromDisplayOrder(cardId)
    if (nextCard) {
      cardState.currentCard.value = nextCard
      cardState.updateHskBadge()
      router.replace({ card: nextCard.character, cardIndex: deckNav.currentIndex.value })
    } else {
      handleCloseCard()
    }
  } else {
    handleCloseCard()
  }
  
  // Refresh deck cards if in user deck (without navigating)
  if (wasUserDeck && deckNav.activeDeck.value) {
    deckNav.openDeck(deckNav.activeDeck.value)
  }
}

function clearError() {
  cardState.error.value = null
  cardGen.error.value = null
}

async function handleRetry() {
  clearError()
  await handleGenerate()
}

async function handleLLMConfigChanged() {
  try {
    await refresh()
  } catch {}
}

// ============ Keyboard Navigation ============

function goHome() {
  cardState.closeCard()
  deckNav.closeDeck()
  flashMatch.resetGame()
  reader.closeBook()
  router.goHome()
}

function handleKeyDown(e) {
  if (e.key === 'Escape') {
    // Modal checks first - prevent navigation while modals are open
    if (showSettings.value) {
      showSettings.value = false
    } else if (showLLMConfig.value) {
      showLLMConfig.value = false
    } else if (router.isGames.value && router.gameStage.value === 'play') {
      // Don't allow escape during game - must click quit
      return
    } else if (router.isGames.value) {
      if (router.gameStage.value === 'results') {
        handleBackFromGameResults()
      } else {
        handleBackFromGameSetup()
      }
    } else if (router.isReader.value && router.readerStage.value === 'reading') {
      // If mini-card is open, let ReadingView handle it
      if (readerHasMiniCard.value) {
        return  // ReadingView will close mini-card and emit miniCardChange(false)
      }
      handleCloseBook()
    } else if (router.isReader.value && router.readerStage.value === 'create') {
      handleCancelBookCreate()
    } else if (router.isReader.value && router.readerStage.value === 'home') {
      handleCloseReader()
    } else if (cardState.currentCard.value) {
      handleCloseCard()
    } else if (deckNav.activeDeck.value) {
      handleCloseDeck()
    }
  }
  
  // Arrow key navigation - only when browsing cards in a deck (not in reader)
  const activeEl = document.activeElement
  const isTextInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')
  
  if (isBrowsingCards.value && !isTextInput && !router.isReader.value) {
    if (e.key === 'ArrowLeft') {
      handlePrevCard()
    } else if (e.key === 'ArrowRight') {
      handleNextCard()
    }
  }
}

// ============ Lifecycle ============

onMounted(async () => {
  document.addEventListener('keydown', handleKeyDown)
  await initDictionary()
  loadCards()
  
  // Initialize router and restore state from URL
  const initialRoute = router.init()
  await handleRouteChange(initialRoute)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

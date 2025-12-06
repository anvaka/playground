<template>
  <div class="app">
    <header class="header">
      <h1 class="header-title" @click="goHome">Chinese Flashcards</h1>
      <div class="header-actions">
        <button class="btn btn-small" @click="showSettings = true">Settings</button>
      </div>
    </header>
    
    <!-- Global Search Bar (always visible) -->
    <SearchBar 
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
      v-if="!cardState.currentCard.value && !deckNav.activeDeck.value && !cardState.urlLoading.value && !gameView && !readerView"
      :user-cards="savedCards"
      @openDeck="handleOpenDeck"
      @openGames="handleOpenGames"
      @openReader="handleOpenReader"
    />
    
    <!-- Deck View (browsing a specific deck) -->
    <DeckView
      v-if="!cardState.currentCard.value && deckNav.activeDeck.value && !gameView && !readerView"
      :title="deckNav.activeDeckTitle.value"
      :cards="deckNav.activeDeckCards.value"
      @back="handleCloseDeck"
      @selectCard="handleSelectCardFromDeck"
    />
    
    <!-- Flash Match Setup -->
    <FlashMatchSetup
      v-if="gameView === 'flash-match-setup'"
      @back="handleCloseGames"
      @start="handleStartFlashMatch"
    />
    
    <!-- Flash Match Game -->
    <FlashMatchGame
      v-if="gameView === 'flash-match-play'"
      :game="flashMatch"
      @quit="handleQuitFlashMatch"
      @finished="gameView = 'flash-match-results'"
    />
    
    <!-- Flash Match Results -->
    <FlashMatchResults
      v-if="gameView === 'flash-match-results'"
      :game="flashMatch"
      @back="handleCloseGames"
      @setup="gameView = 'flash-match-setup'"
      @playAgain="handlePlayFlashMatchAgain"
      @navigateToCard="handleNavigateFromGame"
    />
    
    <!-- Reader Home -->
    <ReaderHome
      v-if="readerView === 'home'"
      :books="reader.books.value"
      :loading="reader.loading.value"
      @back="handleCloseReader"
      @newBook="readerView = 'create'"
      @openBook="handleOpenBook"
      @deleteBook="handleDeleteBook"
    />
    
    <!-- Book Creator -->
    <BookCreator
      v-if="readerView === 'create'"
      @cancel="readerView = 'home'"
      @create="handleCreateBook"
    />
    
    <!-- Reading View -->
    <ReadingView
      v-if="readerView === 'reading' && reader.currentBook.value"
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
    
    <!-- Navigation header when browsing cards -->
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
      v-if="cardState.currentCard.value && cardState.currentCard.value.type === 'trivia'"
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
      v-else-if="cardState.currentCard.value"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

import { useRouter } from './composables/useRouter.js'
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

// Game state
const gameView = ref(null)  // null | 'browser' | 'flash-match-setup' | 'flash-match-play' | 'flash-match-results'
const flashMatch = useFlashMatch()

// Reader state
const readerView = ref(null)  // null | 'home' | 'create' | 'reading'
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
    router.replaceHistoryState()
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

// Router / history management
const router = useRouter({
  getState: () => ({
    activeDeck: deckNav.activeDeck.value,
    currentCard: cardState.currentCard.value,
    currentIndex: deckNav.currentIndex.value
  }),
  onRestore: async ({ deckInfo, cardChar }) => {
    // Open deck first
    if (deckInfo) {
      await deckNav.openDeck(deckInfo)
    }
    
    // Then open card
    if (cardChar) {
      if (deckNav.activeDeck.value && deckNav.activeDeckCards.value.length > 0) {
        const deckCard = deckNav.findCardInDeck(cardChar)
        if (deckCard) {
          deckNav.openCardFromDeck(deckCard)
          cardState.openSavedCard(deckCard)
          return
        }
      }
      await cardState.openCardByCharacter(cardChar)
      deckNav.clearNavigation()
    }
  },
  onPopState: async (state) => {
    if (!state) {
      // No state = home
      cardState.closeCard()
      deckNav.closeDeck()
      return
    }
    
    // Restore deck
    if (state.deck && (!deckNav.activeDeck.value || JSON.stringify(deckNav.activeDeck.value) !== JSON.stringify(state.deck))) {
      await deckNav.openDeck(state.deck)
    } else if (!state.deck && deckNav.activeDeck.value) {
      deckNav.closeDeck()
    }
    
    // Restore card
    if (state.card) {
      if (deckNav.activeDeck.value && deckNav.activeDeckCards.value.length > 0) {
        const deckCard = deckNav.findCardInDeck(state.card)
        if (deckCard) {
          deckNav.openCardFromDeck(deckCard)
          cardState.openSavedCard(deckCard)
          if (typeof state.cardIndex === 'number' && state.cardIndex >= 0) {
            deckNav.currentIndex.value = state.cardIndex
          }
          return
        }
      }
      await cardState.openCardByCharacter(state.card)
    } else if (cardState.currentCard.value) {
      cardState.closeCard()
      if (!deckNav.activeDeck.value) {
        deckNav.clearNavigation()
      }
    }
  }
})

// ============ Computed ============

const isBrowsingCards = computed(() => {
  return cardState.currentCard.value && !cardState.isNewCard.value && deckNav.displayOrder.value.length > 0
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
  // Navigate to a related word - similar to opening by character
  deckNav.clearNavigation()
  await cardState.openCardByCharacter(character)
  router.pushHistoryState()
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
    } else {
      deckNav.setupSavedCardsNavigation(result.card)
    }
  } else if (result.action === 'newCard' || result.action === 'openHsk') {
    deckNav.clearNavigation()
  }
  
  router.pushHistoryState()
}

async function handleFreeform(query) {
  if (!isConfigured()) {
    showLLMConfig.value = true
    return
  }
  
  cardState.handleFreeform(query)
  deckNav.clearNavigation()
  router.pushHistoryState()
  
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
  gameView.value = 'flash-match-setup'
}

function handleCloseGames() {
  gameView.value = null
  flashMatch.resetGame()
}

async function handleStartFlashMatch(config) {
  flashMatch.mode.value = config.mode
  flashMatch.hidePinyin.value = config.hidePinyin
  flashMatch.selectedTags.value = config.tags
  flashMatch.timeLimit.value = config.timeLimit
  
  try {
    await flashMatch.initGame()
    gameView.value = 'flash-match-play'
  } catch (err) {
    cardState.error.value = err.message
  }
}

function handleQuitFlashMatch() {
  gameView.value = 'flash-match-setup'
  flashMatch.resetGame()
}

async function handlePlayFlashMatchAgain() {
  try {
    await flashMatch.initGame()
    gameView.value = 'flash-match-play'
  } catch (err) {
    cardState.error.value = err.message
    gameView.value = 'flash-match-setup'
  }
}

async function handleNavigateFromGame(character) {
  gameView.value = null
  flashMatch.resetGame()
  await cardState.openCardByCharacter(character)
  router.pushHistoryState()
}

// ============ Reader Handlers ============

async function handleOpenReader() {
  readerView.value = 'home'
  await reader.loadBooks()
}

function handleCloseReader() {
  readerView.value = null
  reader.closeBook()
}

async function handleOpenBook(bookId) {
  await reader.openBook(bookId)
  if (reader.currentBook.value) {
    readerView.value = 'reading'
  }
}

function handleCloseBook() {
  reader.closeBook()
  readerView.value = 'home'
}

async function handleCreateBook(bookData) {
  const book = await reader.createNewBook(bookData)
  if (book) {
    readerView.value = 'reading'
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
  router.pushHistoryState()
}

function handleCloseDeck() {
  deckNav.closeDeck()
  router.pushHistoryState()
}

function handleSelectCardFromDeck(card, shuffledOrder) {
  deckNav.openCardFromDeck(card, shuffledOrder)
  cardState.openSavedCard(card)
  router.pushHistoryState()
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
  
  if (!deckNav.activeDeck.value) {
    deckNav.clearNavigation()
  }
  
  router.pushHistoryState()
}

function handleDelete() {
  if (!confirm('Delete this card?')) return
  
  const cardId = cardState.currentCard.value.id
  cardState.handleDelete(cardId)
  
  // If browsing, move to next card or close
  if (isBrowsingCards.value && deckNav.displayOrder.value.length > 1) {
    const nextCard = deckNav.removeFromDisplayOrder(cardId)
    if (nextCard) {
      cardState.currentCard.value = nextCard
      cardState.updateHskBadge()
    } else {
      handleCloseCard()
    }
  } else {
    handleCloseCard()
  }
  
  // Refresh deck cards if in user deck
  if (deckNav.activeDeck.value?.type === 'user') {
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
  gameView.value = null
  flashMatch.resetGame()
  readerView.value = null
  reader.closeBook()
  router.pushHistoryState()
}

function handleKeyDown(e) {
  if (e.key === 'Escape') {
    if (showLLMConfig.value) {
      showLLMConfig.value = false
    } else if (gameView.value === 'flash-match-play') {
      // Don't allow escape during game - must click quit
      return
    } else if (gameView.value) {
      handleCloseGames()
    } else if (readerView.value === 'reading') {
      // If mini-card is open, let ReadingView handle it
      if (readerHasMiniCard.value) {
        return  // ReadingView will close mini-card and emit miniCardChange(false)
      }
      handleCloseBook()
    } else if (readerView.value === 'create') {
      readerView.value = 'home'
    } else if (readerView.value === 'home') {
      handleCloseReader()
    } else if (cardState.currentCard.value) {
      handleCloseCard()
    } else if (deckNav.activeDeck.value) {
      handleCloseDeck()
    } else if (showSettings.value) {
      showSettings.value = false
    }
  }
  
  // Skip card navigation when focus is on text input elements
  const activeEl = document.activeElement
  const isTextInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')
  
  if (isBrowsingCards.value && !isTextInput) {
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
  router.restoreFromUrl()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

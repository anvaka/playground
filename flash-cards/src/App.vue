<template>
  <div class="app">
    <!-- Compact Header: Menu | Search | Settings -->
    <header class="app-header">
      <button 
        class="header-btn menu-btn" 
        @click="showMenu = !showMenu"
        title="Menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      
      <div class="header-search">
        <SearchBar 
          placeholder="Search Chinese or English..."
          @select="handleDictSelect"
          @freeform="handleFreeform"
        />
      </div>
    </header>

    <!-- Side Panel -->
    <div class="side-panel" :class="{ open: showMenu }">
      <div class="side-panel-backdrop" @click="showMenu = false"></div>
      <nav class="side-panel-content">
        <div class="side-panel-header">
          <span class="side-panel-title">Menu</span>
          <button class="side-panel-close" @click="showMenu = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <button class="menu-item" :class="{ active: router.isHome.value }" @click="navigateHome">
          Cards
        </button>
        <button class="menu-item" :class="{ active: router.isExplore.value }" @click="navigateExplore">
          Explore
        </button>
        <button class="menu-item disabled" disabled>
          Games
          <span class="menu-badge">Soon</span>
        </button>
        <button class="menu-item" :class="{ active: router.isReview.value }" @click="navigateReview">
          SRS Review
          <span v-if="cardCounts.dueCount + cardCounts.newCount > 0" class="menu-badge due">{{ cardCounts.dueCount + cardCounts.newCount }}</span>
        </button>
        <button class="menu-item disabled" disabled>
          Reader
          <span class="menu-badge">Soon</span>
        </button>
        <div class="menu-spacer"></div>
        <button class="menu-item" @click="openSettings">
          Settings
        </button>
      </nav>
    </div>

    <!-- Main Content Area -->
    <main class="app-content">
      <!-- Home: Card List -->
      <div v-if="router.isHome.value" class="card-list-view">
        <div v-if="savedCards.length === 0" class="empty-state">
          <p>No cards yet.</p>
          <p class="empty-hint">Search for a word above to create your first card.</p>
        </div>
        <div v-else class="cards-list">
          <div 
            v-for="card in savedCards" 
            :key="card.id" 
            class="card-list-item"
            @click="openCard(card)"
          >
            <span class="card-character">{{ card.character }}</span>
            <button 
              class="delete-btn"
              @click.stop="deleteCard(card.id)"
              title="Delete card"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Card Editor -->
      <div v-else-if="router.isCard.value" class="card-editor-view">
        <div class="editor-nav">
          <button class="back-btn" @click="goBack">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span>Back</span>
          </button>
        </div>
        
        <MarkdownCardEditor
          v-if="currentCard"
          ref="cardEditorRef"
          :card="currentCard"
          :get-client="() => client"
          @saved="handleSaved"
          @open-chat="handleOpenChat"
        />
      </div>

      <!-- SRS Review -->
      <SRSReviewView 
        v-else-if="router.isReview.value"
        @done="handleReviewDone"
      />

      <!-- Explore HSK Words -->
      <ExploreView
        v-else-if="router.isExplore.value"
        ref="exploreView"
        :initial-level="router.exploreLevel.value"
        @select-word="handleExploreSelect"
        @change-level="handleExploreLevel"
      />
    </main>

    <!-- Bottom Nav (prepared but hidden for now) -->
    <!-- 
    <nav class="bottom-nav">
      <button class="nav-item" :class="{ active: router.isHome.value }">Cards</button>
      <button class="nav-item">Games</button>
      <button class="nav-item">SRS</button>
      <button class="nav-item">Reader</button>
    </nav>
    -->

    <!-- LLM Config Modal -->
    <Teleport to="body">
      <LLMConfigModal 
        :is-visible="showLLMConfig"
        @close="showLLMConfig = false"
        @config-changed="handleLLMConfigChanged"
      />
    </Teleport>

    <!-- Global Chat Panel (slides in from right) -->
    <Teleport to="body">
      <Transition name="chat-slide">
        <div v-if="showChat" class="chat-overlay">
          <div class="chat-backdrop" @click="showChat = false"></div>
          <aside class="chat-panel">
            <CardChat
              :key="chatContext.cardId + (chatContext.initialQuery || '')"
              :card-id="chatContext.cardId"
              :card-content="chatContext.cardContent"
              :card-character="chatContext.cardCharacter"
              :initial-query="chatContext.initialQuery"
              :get-client="() => client"
              @close="showChat = false"
              @edit-card="handleChatEditCard"
              @create-card="handleChatCreateCard"
              @open-settings="openSettingsFromChat"
            />
          </aside>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useLLM, LLMConfigModal } from '@anvaka/vue-llm'

import SearchBar from './components/SearchBar.vue'
import MarkdownCardEditor from './components/MarkdownCardEditor.vue'
import SRSReviewView from './components/SRSReviewView.vue'
import ExploreView from './components/ExploreView.vue'
import CardChat from './components/CardChat.vue'

import { useRouter } from './composables/useRouter.js'
import { initDictionary, lookupChinese } from './services/dictionary.js'
import { 
  getMarkdownCards, 
  deleteMarkdownCard, 
  getMarkdownCardByCharacter,
  getMarkdownCard,
  getCardCounts,
  createMarkdownCard,
  saveMarkdownCard
} from './services/markdownStorage.js'
import { buildCardTemplate } from './services/cardMarkdown.js'

// ============ Router ============

const router = useRouter()

// ============ Core State ============

const { client, getActiveProviderId, refresh } = useLLM()

const showLLMConfig = ref(false)
const showMenu = ref(false)
const showChat = ref(false)
const chatContext = ref({ cardId: '', cardContent: '', cardCharacter: '' })
const savedCards = ref([])
const currentCard = ref(null)
const cardCounts = ref({ newCount: 0, dueCount: 0, totalCount: 0 })
const exploreView = ref(null)
const cardEditorRef = ref(null)

function loadCards() {
  savedCards.value = getMarkdownCards()
  cardCounts.value = getCardCounts()
}

function isConfigured() {
  return !!getActiveProviderId()
}

// ============ Route Handling ============

// Load card when route changes
watch(() => router.route.value, async (route) => {
  showMenu.value = false
  
  if (route.name === 'home') {
    currentCard.value = null
    showChat.value = false
  } else if (route.name === 'card') {
    // Load existing card by ID
    const card = getMarkdownCard(route.id)
    if (card) {
      currentCard.value = card
    } else {
      // Card not found, go home
      router.goHome()
    }
  } else if (route.name === 'card-new') {
    // Create new card from query
    // Skip if we already have a card with content (created from chat)
    if (currentCard.value?.content && currentCard.value?.isNew) {
      return
    }
    if (route.query) {
      await createCardFromQuery(route.query)
    } else {
      currentCard.value = { id: null, character: '', content: '', isNew: true }
    }
  }
}, { immediate: true })

async function createCardFromQuery(query) {
  // Check for existing card first
  const existing = getMarkdownCardByCharacter(query)
  if (existing) {
    router.goToCard(existing.id)
    return
  }
  
  // Try dictionary lookup
  const lookup = await lookupChinese(query)
  if (lookup) {
    const template = buildCardTemplate(query, lookup)
    currentCard.value = {
      id: null,
      character: query,
      content: template,
      isNew: true
    }
  } else {
    // Freeform - no dictionary match
    currentCard.value = { 
      id: null, 
      character: query, 
      content: '', 
      isNew: true 
    }
  }
}

// ============ Navigation ============

function navigateHome() {
  router.goHome()
}

function goBack() {
  history.back()
}

function navigateReview() {
  showMenu.value = false
  router.goToReview()
}

function navigateExplore() {
  showMenu.value = false
  router.goToExplore(1)
}

function handleExploreSelect(simplified) {
  router.goToNewCard(simplified)
}

function handleExploreLevel(level) {
  router.goToExplore(level)
}

function handleReviewDone() {
  loadCards() // refresh counts
  router.goHome()
}

function openSettings() {
  showMenu.value = false
  showLLMConfig.value = true
}

function openCard(card) {
  router.goToCard(card.id)
}

// ============ Search Handlers ============

async function handleDictSelect(entry) {
  // Check for existing card first
  const existing = getMarkdownCardByCharacter(entry.simplified)
  if (existing) {
    router.goToCard(existing.id)
    return
  }
  
  // Navigate to new card with query
  router.goToNewCard(entry.simplified)
}

function handleFreeform(query) {
  if (!isConfigured()) {
    showLLMConfig.value = true
    return
  }
  
  // Open chat with the query - let the AI tutor handle it
  chatContext.value = { 
    cardId: 'freeform', 
    cardContent: '', 
    cardCharacter: '',
    initialQuery: query
  }
  showChat.value = true
}

// ============ Card Actions ============

function handleSaved(saved) {
  currentCard.value = saved
  loadCards()
  // Refresh explore view if it exists (to update "in deck" status)
  exploreView.value?.refresh()
  // Update URL to reflect saved card ID
  if (saved.id) {
    router.goToCard(saved.id)
  }
}

function deleteCard(cardId) {
  if (!confirm('Delete this card?')) return
  deleteMarkdownCard(cardId)
  loadCards()
  if (currentCard.value?.id === cardId) {
    router.goHome()
  }
}

async function handleLLMConfigChanged() {
  try {
    await refresh()
  } catch {}
}

// ============ Chat Handlers ============

function handleOpenChat({ cardId, cardContent, cardCharacter }) {
  chatContext.value = { cardId, cardContent, cardCharacter, initialQuery: '' }
  showChat.value = true
}

function handleChatEditCard({ section, content, fullContent }) {
  if (cardEditorRef.value) {
    cardEditorRef.value.applyCardEdit({ section, content, fullContent })
    // Update chat context with new content
    chatContext.value.cardContent = cardEditorRef.value.getContent()
  }
}

function handleChatCreateCard({ word, content }) {
  showChat.value = false
  
  if (content) {
    // Content was generated in chat - save the card immediately
    const newCard = createMarkdownCard(content)
    const saved = saveMarkdownCard(newCard)
    loadCards() // refresh card list
    currentCard.value = saved
    router.goToCard(saved.id)
  } else {
    // No content - navigate to new card (old flow)
    router.goToNewCard(word)
  }
}

async function createCardWithContent(word, content) {
  // Extract character from content or use word
  const character = word || content.match(/^#\s*Front\s*\n([^\n(]+)/m)?.[1]?.trim() || 'new'
  
  currentCard.value = {
    id: null,
    character,
    content,
    isNew: true
  }
  
  // Navigate to card-new view
  router.goToNewCard(character)
}

function openSettingsFromChat() {
  showLLMConfig.value = true
}

// ============ Keyboard Navigation ============

function handleKeyDown(e) {
  if (e.key === 'Escape') {
    if (showLLMConfig.value) {
      showLLMConfig.value = false
    } else if (showChat.value) {
      showChat.value = false
    } else if (showMenu.value) {
      showMenu.value = false
    } else if (router.isCard.value) {
      router.goHome()
    }
  }
}

// ============ Lifecycle ============

onMounted(async () => {
  document.addEventListener('keydown', handleKeyDown)
  router.init()
  await initDictionary()
  loadCards()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
/* App Layout */
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Header */
.app-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: var(--radius);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  flex-shrink: 0;
}

.header-btn:hover {
  background: var(--bg);
  color: var(--text);
}

.header-search {
  flex: 1;
  min-width: 0;
}

/* Menu Dropdown */
.side-panel {
  position: fixed;
  inset: 0;
  z-index: 200;
  pointer-events: none;
}

.side-panel.open {
  pointer-events: auto;
}

.side-panel-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.side-panel.open .side-panel-backdrop {
  opacity: 1;
}

.side-panel-content {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 260px;
  max-width: 80vw;
  background: var(--card-bg);
  border-right: 1px solid var(--border);
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1);
  transform: translateX(-100%);
  transition: transform 0.2s ease;
  display: flex;
  flex-direction: column;
}

.side-panel.open .side-panel-content {
  transform: translateX(0);
}

.side-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.side-panel-title {
  font-weight: 500;
  color: var(--text);
}

.side-panel-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: var(--radius);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.side-panel-close:hover {
  background: var(--bg);
  color: var(--text);
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 16px;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 0.95rem;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.menu-item:hover:not(.disabled) {
  background: var(--bg);
}

.menu-item.active {
  background: var(--bg);
  color: var(--secondary);
  border-left: 3px solid var(--secondary);
}

.menu-item.disabled {
  color: var(--text-muted);
  cursor: not-allowed;
}

.menu-badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  background: var(--bg);
  border-radius: 4px;
  color: var(--text-muted);
}

.menu-badge.due {
  background: var(--secondary);
  color: white;
}

.menu-spacer {
  flex: 1;
  min-height: 20px;
}

/* Main Content */
.app-content {
  flex: 1;
  padding: 16px 0;
}

/* Card List View */
.card-list-view {
  max-width: 600px;
  margin: 0 auto;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-state p {
  margin: 0;
}

.empty-hint {
  margin-top: 8px !important;
  font-size: 0.9rem;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.card-list-item:hover {
  background: var(--bg);
  border-color: var(--border-hover);
}

.card-character {
  font-size: 1.25rem;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: var(--radius);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.delete-btn:hover {
  background: rgba(220, 53, 69, 0.1);
  color: var(--danger);
}

/* Card Editor View */
.card-editor-view {
  margin: 0 auto;
}

.editor-nav {
  margin-bottom: 16px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card-bg);
  color: var(--text);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.back-btn:hover {
  background: var(--bg);
  border-color: var(--border-hover);
}

/* Bottom Nav (prepared, commented out in template) */
.bottom-nav {
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
  background: var(--card-bg);
  border-top: 1px solid var(--border);
  position: sticky;
  bottom: 0;
}

.nav-item {
  flex: 1;
  padding: 12px 8px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.75rem;
  cursor: pointer;
  transition: color 0.15s ease;
}

.nav-item:hover,
.nav-item.active {
  color: var(--secondary);
}

/* Global Chat Panel */
.chat-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
}

.chat-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
}

.chat-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  max-width: 100vw;
  background: var(--card-bg);
  border-left: 1px solid var(--border);
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.1);
}

/* Chat slide transition */
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: opacity 0.2s ease;
}

.chat-slide-enter-active .chat-panel,
.chat-slide-leave-active .chat-panel {
  transition: transform 0.2s ease;
}

.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
}

.chat-slide-enter-from .chat-panel,
.chat-slide-leave-to .chat-panel {
  transform: translateX(100%);
}

@media (max-width: 480px) {
  .chat-panel {
    width: 100vw;
  }
}
</style>

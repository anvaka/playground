<template>
  <div class="deck-view">
    <!-- Header -->
    <div class="deck-view-header">
      <button class="btn btn-small" @click="$emit('back')">← Back</button>
      <h2 class="deck-view-title">{{ title }}</h2>
      <div class="deck-view-actions">
        <button class="btn btn-small" @click="shuffleCards">Shuffle</button>
      </div>
    </div>
    
    <!-- Card grid -->
    <div class="deck-view-grid">
      <div 
        v-for="card in displayedCards"
        :key="card.id"
        class="deck-card-item"
        :class="{ 'trivia-item': card.type === 'trivia' }"
        @click="handleSelectCard(card)"
      >
        <template v-if="card.type === 'trivia'">
          <span class="card-item-label">Q:</span>
          <span class="card-item-question">{{ truncate(card.question, 30) }}</span>
        </template>
        <template v-else>
          <span class="card-item-char">{{ card.character }}</span>
          <span class="card-item-pinyin">{{ card.pinyin }}</span>
        </template>
      </div>
    </div>
    
    <!-- Load more / pagination for large decks -->
    <div v-if="hasMore" class="deck-view-more">
      <button class="btn" @click="loadMore">Load more ({{ remaining }} remaining)</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Cards'
  },
  cards: {
    type: Array,
    required: true
  },
  pageSize: {
    type: Number,
    default: 500
  }
})

const emit = defineEmits(['back', 'selectCard'])

// Pagination state
const displayCount = ref(props.pageSize)
const shuffledCards = ref([...props.cards])
const isShuffled = ref(false)

// Reset when cards change
watch(() => props.cards, (newCards) => {
  shuffledCards.value = [...newCards]
  displayCount.value = props.pageSize
  isShuffled.value = false
}, { immediate: true })

const displayedCards = computed(() => {
  return shuffledCards.value.slice(0, displayCount.value)
})

const hasMore = computed(() => displayCount.value < shuffledCards.value.length)
const remaining = computed(() => shuffledCards.value.length - displayCount.value)

function loadMore() {
  displayCount.value += props.pageSize
}

function shuffleCards() {
  const arr = [...shuffledCards.value]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  shuffledCards.value = arr
  displayCount.value = props.pageSize
  isShuffled.value = true
}

function handleSelectCard(card) {
  // If shuffled, emit the shuffled order along with the card
  if (isShuffled.value) {
    // Build display order: indices into props.cards that match shuffledCards order
    const displayOrder = shuffledCards.value.map(c => props.cards.findIndex(orig => orig.id === c.id))
    emit('selectCard', card, displayOrder)
  } else {
    emit('selectCard', card, null)
  }
}

function truncate(str, len) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}
</script>

<style scoped>
.deck-view {
  padding: 8px 0;
}

.deck-view-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: 20px;
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border);
}

.deck-view-title {
  flex: 1;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.deck-view-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.deck-view-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.deck-card-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px var(--spacing-md);
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  min-width: 80px;
  position: relative;
}

.deck-card-item:hover {
  border-color: var(--secondary);
  box-shadow: var(--shadow);
}

.card-item-char {
  font-size: 1.75rem;
  margin-bottom: 4px;
}

.card-item-pinyin {
  font-size: 0.8rem;
  color: var(--secondary);
}

/* Trivia items */
.deck-card-item.trivia-item {
  flex-direction: row;
  min-width: 180px;
  max-width: 280px;
  gap: var(--spacing-sm);
  align-items: flex-start;
}

.card-item-label {
  font-weight: 600;
  color: var(--secondary);
  font-size: 0.9rem;
}

.card-item-question {
  font-size: 0.85rem;
  color: var(--text);
  line-height: 1.3;
}

.deck-view-more {
  margin-top: 20px;
  text-align: center;
}
</style>

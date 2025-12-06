<template>
  <BaseCard
    :card="card"
    :show-close="showClose"
    :can-edit="false"
    :initial-flipped="initialFlipped"
    :scroll-target-ref="scrollTargetRef"
    @delete="$emit('delete')"
    @close="$emit('close')"
  >
    <!-- Front: Question -->
    <template #front>
      <div class="trivia-label">Question</div>
      <div class="trivia-question">{{ card.question }}</div>
    </template>

    <!-- Compact header for back side -->
    <template #back-header>
      <span class="back-header-question">{{ card.question }}</span>
    </template>
    
    <!-- Back: Answer + Explanation -->
    <template #back>
      <section class="card-view-section">
        <h4>Answer</h4>
        <p class="trivia-answer"><MarkdownText :text="card.answer" /></p>
      </section>

      <section class="card-view-section" v-if="card.explanation">
        <h4>Explanation</h4>
        <p><MarkdownText :text="card.explanation" /></p>
      </section>

      <section class="card-view-section" v-if="card.relatedWords?.length">
        <h4>Related Words</h4>
        <div class="related-words">
          <a 
            v-for="(word, i) in card.relatedWords" 
            :key="i"
            :href="'?card=' + encodeURIComponent(word.zh)"
            class="related-word"
            @click.prevent="$emit('navigate', word.zh)"
          >
            <span class="related-zh">{{ word.zh }}</span>
            <span class="related-pinyin">{{ word.pinyin }}</span>
            <span class="related-en">{{ word.en }}</span>
          </a>
        </div>
      </section>

      <section class="card-view-section" v-if="card.memoryStory">
        <h4>Memory Tip</h4>
        <p><MarkdownText :text="card.memoryStory" /></p>
      </section>
    </template>
  </BaseCard>
</template>

<script setup>
import BaseCard from './BaseCard.vue'
import MarkdownText from './MarkdownText.vue'

defineProps({
  card: {
    type: Object,
    required: true
  },
  initialFlipped: {
    type: Boolean,
    default: false
  },
  showClose: {
    type: Boolean,
    default: true
  },
  scrollTargetRef: {
    type: Object,
    default: null
  }
})

defineEmits(['delete', 'close', 'navigate'])
</script>

<style scoped>
.trivia-label {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.trivia-question {
  font-size: 1.4rem;
  line-height: 1.5;
  max-width: 90%;
  text-align: center;
}

.related-words {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.related-word {
  background: var(--bg);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.related-word:hover {
  background: var(--surface-active);
}

.related-zh {
  font-size: 1.1rem;
}

.related-pinyin {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.related-en {
  color: var(--text-secondary);
  font-size: 0.85rem;
}
</style>

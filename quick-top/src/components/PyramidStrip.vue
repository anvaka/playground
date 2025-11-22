<script setup>
import { computed } from 'vue'

const props = defineProps({
  letters: {
    type: Array,
    default: () => []
  },
  tiers: {
    type: Array,
    default: () => [1, 2, 4]
  }
})

const emit = defineEmits(['tile-hover', 'tile-leave', 'tile-click'])

const tierOffsets = computed(() => {
  const offsets = []
  props.tiers.reduce((acc, value, idx) => {
    offsets[idx] = acc
    return acc + value
  }, 0)
  return offsets
})

function tierItems(items = [], tierIndex) {
  const start = tierOffsets.value[tierIndex] ?? 0
  const limit = props.tiers[tierIndex] ?? 0
  if (limit <= 0) {
    return []
  }

  return items.slice(start, start + limit)
}

function gridTemplate(count) {
  const columns = Math.max(count, 1)
  return `repeat(${columns}, minmax(0, 1fr))`
}

function handleHover(letter, tile, event) {
  emit('tile-hover', {
    tile: { ...tile, letter },
    event
  })
}

function handleLeave() {
  emit('tile-leave')
}

function handleClick(letter, tile) {
  emit('tile-click', { ...tile, letter })
}
</script>

<template>
  <div class="pyramid-strip" role="list" aria-label="Audible autocomplete pyramid strip">
    <article v-for="entry in letters" :key="entry.letter" class="letter-column" role="listitem">
      <header class="letter-heading">
        <span>{{ entry.letter.toUpperCase() }}</span>
      </header>

      <div
        v-for="(tierSize, tierIndex) in tiers"
        :key="`${entry.letter}-tier-${tierIndex}`"
        class="tier"
        :class="`tier-${tierIndex}`"
        :style="{ gridTemplateColumns: gridTemplate(tierItems(entry.items, tierIndex).length) }"
      >
        <button
          v-for="tile in tierItems(entry.items, tierIndex)"
          :key="tile.asin"
          class="cover-tile"
          type="button"
          :aria-label="`${tile.title} by ${tile.author}`"
          @mouseenter="(event) => handleHover(entry.letter, tile, event)"
          @mousemove="(event) => handleHover(entry.letter, tile, event)"
          @focus="(event) => handleHover(entry.letter, tile, event)"
          @mouseleave="handleLeave"
          @blur="handleLeave"
          @click="() => handleClick(entry.letter, tile)"
        >
          <img :src="tile.cover || tile.image" :alt="tile.title" loading="lazy" />
        </button>
      </div>
    </article>
  </div>
</template>

<style scoped>
.pyramid-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 1.5rem;
  padding-bottom: 1.5rem;
}

.letter-column {
  width: min(100%, 500px);
  justify-self: center;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem;
  border-radius: 1.25rem;
  border: 1px solid rgba(148, 163, 184, 0.15);
  background: rgba(15, 23, 42, 0.45);
}

.letter-heading {
  font-weight: 600;
  letter-spacing: 0.2rem;
  font-size: 0.85rem;
  text-align: center;
  color: #bae6fd;
}

.tier {
  display: grid;
  gap: 0.45rem;
  width: 100%;
}

.tier-0 {
  --tier-scale: 1;
}

.tier-1 {
  --tier-scale: 0.88;
}

.tier-2 {
  --tier-scale: 0.78;
}

.cover-tile {
  position: relative;
  width: 100%;
  border: none;
  padding: 0;
  border-radius: 0.85rem;
  overflow: hidden;
  cursor: pointer;
  background: rgba(15, 23, 42, 0.4);
  transition: transform 120ms ease, box-shadow 120ms ease;
  aspect-ratio: 1 / 1;
  transform: scale(var(--tier-scale));
  transform-origin: top center;
}

.cover-tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-tile:hover,
.cover-tile:focus-visible {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.6);
  transform: scale(calc(var(--tier-scale) + 0.05));
  outline: none;
}

@media (max-width: 768px) {
  .pyramid-strip {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .letter-column {
    width: min(100%, 420px);
  }
}
</style>

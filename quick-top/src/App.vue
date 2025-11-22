<script setup>
import { onMounted, ref } from 'vue'

import PyramidStrip from './components/PyramidStrip.vue'
import { normalizeLetters } from './lib/letters'

const tiers = [1, 2, 4]
const maxItems = tiers.reduce((sum, value) => sum + value, 0)

const DATA_URL = `${import.meta.env.BASE_URL}audible-suggestions.json`

const letters = ref([])
const loading = ref(true)
const error = ref(null)
const lastUpdated = ref('')
const tooltip = ref({
  visible: false,
  letter: '',
  title: '',
  author: '',
  asin: '',
  x: 0,
  y: 0
})

async function loadData() {
  try {
    const response = await fetch(DATA_URL)
    if (!response.ok) {
      throw new Error(`Failed to load suggestions (${response.status})`)
    }

    const payload = await response.json()
    letters.value = normalizeLetters(payload.letters ?? {}, { maxItems })
    lastUpdated.value = payload.timestamp ?? ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

function retry() {
  loading.value = true
  error.value = null
  letters.value = []
  loadData()
}

function handleHover({ tile, event }) {
  const coords = pointerPosition(event)
  tooltip.value = {
    visible: true,
    letter: tile.letter,
    title: tile.title,
    author: tile.author,
    asin: tile.asin,
    x: coords.x,
    y: coords.y
  }
}

function hideTooltip() {
  tooltip.value.visible = false
}

function openTile(tile) {
  window.open(`https://www.audible.com/pd/${tile.asin}`, '_blank', 'noopener')
}

function pointerPosition(event) {
  if (event && 'clientX' in event && typeof event.clientX === 'number') {
    return { x: event.clientX + 16, y: event.clientY + 16 }
  }

  const rect = event?.target?.getBoundingClientRect?.()
  if (rect) {
    return { x: rect.right + 12, y: rect.top + rect.height / 2 }
  }

  return { x: 0, y: 0 }
}
</script>

<template>
  <main class="app-shell">
    <header class="app-header">
      <div>
        <h1>Audible Autocomplete Atlas</h1>
        <p>Alphabetical pyramid strip of search suggestions</p>
      </div>
      <div class="meta">
        <span v-if="lastUpdated">Captured {{ new Date(lastUpdated).toLocaleString() }}</span>
        <span v-else>Awaiting dataset…</span>
      </div>
    </header>

    <section v-if="error" class="state error">
      <p>{{ error }}</p>
      <button type="button" @click="retry" :disabled="loading">Retry</button>
    </section>

    <section v-else class="canvas">
      <PyramidStrip
        v-if="!loading || letters.length"
        :letters="letters"
        :tiers="tiers"
        @tile-hover="handleHover"
        @tile-leave="hideTooltip"
        @tile-click="openTile"
      />
      <div v-if="loading" class="state loading">
        <p>Loading data…</p>
      </div>
    </section>

    <div
      v-if="tooltip.visible"
      class="tooltip"
      :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
    >
      <p class="tooltip-letter">{{ tooltip.letter.toUpperCase() }}</p>
      <p class="tooltip-title">{{ tooltip.title }}</p>
      <p class="tooltip-author">{{ tooltip.author }}</p>
    </div>
  </main>
</template>

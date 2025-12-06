<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <h2>Settings</h2>
      
      <!-- LLM Provider Section -->
      <div class="editor-field">
        <label>LLM Provider</label>
        <div class="provider-row">
          <ProviderSelector @changed="handleProviderChange" @open-config="showConfigModal = true" />
          <button class="btn btn-small" @click="showConfigModal = true">Configure</button>
        </div>
      </div>
      
      <hr style="margin: 20px 0; border: none; border-top: 1px solid var(--border);" />
      
      <div class="editor-field">
        <label>Data Management</label>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-small" @click="handleExport">Export Cards</button>
          <label class="btn btn-small" style="cursor: pointer;">
            Import Cards
            <input 
              type="file" 
              accept=".json" 
              @change="handleImport" 
              style="display: none;"
            />
          </label>
        </div>
        <p v-if="importMessage" class="text-muted" style="margin-top: 8px; font-size: 0.85rem;">
          {{ importMessage }}
        </p>
      </div>
      
      <div class="modal-actions">
        <button class="btn btn-primary" @click="$emit('close')">Done</button>
      </div>
    </div>
  </div>
  
  <!-- LLM Config Modal - uses Teleport to body to avoid z-index issues -->
  <Teleport to="body">
    <LLMConfigModal 
      :is-visible="showConfigModal"
      @close="showConfigModal = false"
      @config-changed="handleConfigSaved"
    />
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ProviderSelector, LLMConfigModal, useLLM } from '@anvaka/vue-llm'
import { exportCards, importCards } from '../services/storage.js'

const emit = defineEmits(['close', 'saved'])

const { refresh } = useLLM()

const showConfigModal = ref(false)
const importMessage = ref('')

function handleKeyDown(e) {
  if (e.key === 'Escape') {
    if (showConfigModal.value) {
      showConfigModal.value = false
    } else {
      emit('close')
    }
    e.stopPropagation()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

async function handleProviderChange() {
  try {
    await refresh()
  } catch {}
  emit('saved')
}

async function handleConfigSaved() {
  try {
    await refresh()
  } catch {}
  emit('saved')
}

function handleExport() {
  exportCards()
}

async function handleImport(event) {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    const text = await file.text()
    const result = importCards(text)
    importMessage.value = `Imported ${result.added} new cards (${result.total} total)`
    emit('saved')
  } catch (err) {
    importMessage.value = 'Import failed: ' + err.message
  }
  
  event.target.value = ''
}
</script>

<style scoped>
.provider-row {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}
</style>

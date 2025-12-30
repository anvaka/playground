<template>
  <div class="thread-list-container">
    <div class="section-header">Conversations</div>
    <div class="thread-list">
      <div v-if="threads.length === 0" class="thread-empty">
        No conversations yet
      </div>
      <div 
        v-for="thread in threads" 
        :key="thread.id" 
        class="thread-item"
        @click="openThread(thread)"
      >
        <span class="thread-title">{{ thread.title || formatThreadDate(thread.updated) }}</span>
        <button 
          class="thread-delete-btn"
          @click.stop="handleDelete(thread.id)"
          title="Delete conversation"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAllThreads, deleteThread as deleteThreadFromStorage } from '../services/chatStorage.js'
import { useChatContext } from '../composables/useChatContext.js'

const emit = defineEmits(['thread-opened'])

const chat = useChatContext()
const threads = ref([])

async function loadThreads() {
  threads.value = await getAllThreads()
}

function formatThreadDate(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function openThread(thread) {
  chat.openThread(thread.id)
  emit('thread-opened')
}

async function handleDelete(threadId) {
  if (!confirm('Delete this conversation?')) return
  await deleteThreadFromStorage(threadId)
  await loadThreads()
}

// Expose refresh method for parent to call
defineExpose({ refresh: loadThreads })

onMounted(loadThreads)
</script>

<style scoped>
.thread-list-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; /* Critical for flex overflow to work */
  overflow: hidden;
}

.section-header {
  padding: 12px 16px 8px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.thread-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
  min-height: 0;
}

.thread-empty {
  padding: 12px 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: center;
}

.thread-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 8px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.thread-item:hover {
  background: var(--bg);
}

.thread-title {
  flex: 1;
  font-size: 0.85rem;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thread-delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: var(--radius);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.thread-item:hover .thread-delete-btn {
  opacity: 1;
}

.thread-delete-btn:hover {
  background: rgba(220, 53, 69, 0.1);
  color: var(--danger);
}
</style>

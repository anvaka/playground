<template>
  <div class="reader-home">
    <div class="reader-header">
      <button class="btn btn-small" @click="$emit('back')">← Back</button>
      <h2>Reader</h2>
    </div>
    
    <!-- New Book Button -->
    <button class="new-book-btn" @click="$emit('newBook')">
      <span class="new-book-icon">+</span>
      <span>New Book</span>
    </button>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      Loading books...
    </div>
    
    <!-- Empty State -->
    <div v-else-if="books.length === 0" class="empty-state">
      <p>No books yet</p>
      <p class="text-muted">Create a book by pasting any text</p>
    </div>
    
    <!-- Book List -->
    <div v-else class="book-list">
      <div 
        v-for="book in books" 
        :key="book.id" 
        class="book-item"
        @click="$emit('openBook', book.id)"
      >
        <div class="book-icon">📖</div>
        <div class="book-info">
          <div class="book-title">{{ book.title }}</div>
          <div class="book-meta">
            <span class="book-progress">
              Page {{ book.currentPage + 1 }}/{{ book.pages.length }}
            </span>
            <span class="book-level">{{ levelLabels[book.targetLevel] }}</span>
          </div>
        </div>
        <button 
          class="book-delete" 
          @click.stop="handleDelete(book)"
          title="Delete book"
        >×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  books: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['back', 'newBook', 'openBook', 'deleteBook'])

const levelLabels = {
  'hsk1-2': 'Beginner',
  'hsk3-4': 'Intermediate',
  'hsk5-6': 'Advanced',
  'natural': 'Natural'
}

function handleDelete(book) {
  if (confirm(`Delete "${book.title}"?`)) {
    emit('deleteBook', book.id)
  }
}
</script>

<style scoped>
.reader-home {
  padding: 8px 0;
}

.reader-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: 20px;
}

.reader-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.new-book-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-md);
  margin-bottom: 20px;
  background: var(--card-bg);
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 1rem;
  color: var(--text);
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.new-book-btn:hover {
  border-color: var(--primary);
  background: var(--bg);
}

.new-book-icon {
  font-size: 1.5rem;
  font-weight: 300;
  color: var(--primary);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}

.empty-state p {
  margin: 8px 0;
}

.book-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.book-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 12px var(--spacing-md);
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.book-item:hover {
  border-color: var(--secondary);
  box-shadow: var(--shadow);
}

.book-icon {
  font-size: 1.5rem;
}

.book-info {
  flex: 1;
  min-width: 0;
}

.book-title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-meta {
  display: flex;
  gap: var(--spacing-sm);
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.book-level {
  background: var(--surface-hover);
  border-radius: 4px;
}

.book-delete {
  padding: 4px 8px;
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
}

.book-item:hover .book-delete {
  opacity: 1;
}

.book-delete:hover {
  color: var(--danger);
}
</style>

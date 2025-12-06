<template>
  <span class="markdown-text" v-html="renderedHtml"></span>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  text: {
    type: String,
    default: ''
  }
})

const renderedHtml = computed(() => {
  if (!props.text) return ''
  return marked.parse(props.text, { breaks: true })
})
</script>

<style scoped>
.markdown-text {
  /* Inherit text styles from parent */
}

.markdown-text :deep(p) {
  margin: 0.5em 0;
}

.markdown-text :deep(p:first-child) {
  margin-top: 0;
}

.markdown-text :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-text :deep(ul),
.markdown-text :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.markdown-text :deep(li) {
  margin: 0.25em 0;
}

.markdown-text :deep(code) {
  background: rgba(128, 128, 128, 0.2);
  padding: 0.1em 0.3em;
  border-radius: 3px;
  font-size: 0.9em;
}

.markdown-text :deep(pre) {
  background: rgba(128, 128, 128, 0.15);
  padding: 0.5em;
  border-radius: 4px;
  overflow-x: auto;
}

.markdown-text :deep(strong) {
  font-weight: 600;
}

.markdown-text :deep(em) {
  font-style: italic;
}

.markdown-text :deep(a) {
  color: var(--secondary);
  text-decoration: underline;
}

.markdown-text :deep(blockquote) {
  border-left: 3px solid rgba(128, 128, 128, 0.4);
  margin: 0.5em 0;
  padding-left: 1em;
  color: rgba(255, 255, 255, 0.7);
}
</style>

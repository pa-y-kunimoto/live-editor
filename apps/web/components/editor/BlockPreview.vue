<script setup lang="ts">
defineProps<{
  html: string
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
  checkboxToggle: [lineIndex: number]
  linkClick: [url: string]
}>()

function handleClick(event: MouseEvent) {
  const target = event.target as HTMLElement

  // チェックボックス自体のクリック
  if (target.tagName === 'INPUT' && target.classList.contains('checklist-checkbox')) {
    event.preventDefault()
    event.stopPropagation()
    const lineIndex = target.getAttribute('data-line-index')
    emit('checkboxToggle', lineIndex ? parseInt(lineIndex) : 0)
    return
  }

  // チェックリストアイテム（行全体）のクリック - チェックボックスをトグル（編集モードに入らない）
  const checklistItem = target.closest('.checklist-item')
  if (checklistItem) {
    event.preventDefault()
    event.stopPropagation()
    const lineIndex = checklistItem.getAttribute('data-line-index')
    emit('checkboxToggle', lineIndex ? parseInt(lineIndex) : 0)
    return
  }

  if (target.tagName === 'A') {
    const href = target.getAttribute('href')
    if (href) {
      event.preventDefault()
      event.stopPropagation()
      emit('linkClick', href)
      return
    }
  }

  emit('click', event)
}
</script>

<template>
  <div
    class="block-preview"
    @click.stop="handleClick"
    v-html="html"
  />
</template>

<style scoped>
.block-preview {
  cursor: text;
  line-height: 1.6;
  font-size: 15px;
  min-height: 26px;
  color: #37352f;
  padding: 0 4px;
}

.block-preview :deep(.empty-line) {
  min-height: 26px;
}

.block-preview :deep(> *:first-child) {
  margin-top: 0;
}

.block-preview :deep(> *:last-child) {
  margin-bottom: 0;
}

.block-preview :deep(p) {
  margin: 0;
  min-height: 26px;
}

.block-preview :deep(h1) {
  font-size: 30px;
  font-weight: 600;
  margin: 0;
  padding: 3px 0;
  line-height: 1.3;
  color: #37352f;
}

.block-preview :deep(h2) {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  padding: 3px 0;
  line-height: 1.3;
  color: #37352f;
}

.block-preview :deep(h3) {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  padding: 2px 0;
  line-height: 1.3;
  color: #37352f;
}

.block-preview :deep(h4),
.block-preview :deep(h5),
.block-preview :deep(h6) {
  font-weight: 600;
  margin: 0;
  padding: 2px 0;
  color: #37352f;
}

.block-preview :deep(ul),
.block-preview :deep(ol) {
  margin: 0;
  padding-left: 1.5em;
}

.block-preview :deep(li) {
  margin: 0;
  padding: 2px 0;
}

.block-preview :deep(li p) {
  margin: 0;
}

.block-preview :deep(li::marker) {
  color: #37352f;
}

.block-preview :deep(code) {
  background: rgba(135, 131, 120, 0.15);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-size: 0.875em;
  color: #eb5757;
}

.block-preview :deep(.code-block-wrapper) {
  position: relative;
  margin: 4px 0;
}

.block-preview :deep(.code-lang-label) {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #6b7280;
  text-transform: lowercase;
  pointer-events: none;
  z-index: 1;
}

.block-preview :deep(.shiki) {
  background: #f8f8f8 !important;
  padding: 16px 20px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0;
  border: 1px solid #e5e5e5;
}

.block-preview :deep(.shiki code) {
  background: none !important;
  padding: 0;
  color: inherit;
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.block-preview :deep(pre:not(.shiki)) {
  background: #f8f8f8;
  padding: 16px 20px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 4px 0;
  border: 1px solid #e5e5e5;
}

.block-preview :deep(pre:not(.shiki) code) {
  background: none;
  padding: 0;
  color: #37352f;
  font-size: 13px;
}

.block-preview :deep(blockquote) {
  border-left: 3px solid #37352f;
  margin: 4px 0;
  padding-left: 14px;
  color: #37352f;
}

.block-preview :deep(blockquote p) {
  margin: 0;
}

.block-preview :deep(a) {
  color: #2563eb;
  text-decoration: underline;
  text-decoration-color: rgba(37, 99, 235, 0.4);
  text-underline-offset: 2px;
  cursor: pointer;
}

.block-preview :deep(a:hover) {
  text-decoration-color: #2563eb;
  color: #1d4ed8;
}

.block-preview :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 4px 0;
  font-size: 14px;
  display: block;
  overflow-x: auto;
  white-space: nowrap;
}

.block-preview :deep(thead),
.block-preview :deep(tbody),
.block-preview :deep(tr) {
  display: table;
  width: 100%;
  table-layout: fixed;
}

.block-preview :deep(th),
.block-preview :deep(td) {
  border: 1px solid #e9e9e7;
  padding: 8px 10px;
  text-align: left;
  white-space: normal;
  word-wrap: break-word;
}

.block-preview :deep(th) {
  background: #f7f6f3;
  font-weight: 500;
}

.block-preview :deep(tr:hover td) {
  background: rgba(55, 53, 47, 0.03);
}

.block-preview :deep(hr) {
  border: none;
  border-top: 1px solid #e9e9e7;
  margin: 8px 0;
}

.block-preview :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.block-preview :deep(strong) {
  font-weight: 600;
}

.block-preview :deep(em) {
  font-style: italic;
}

/* チェックリストスタイル */
.block-preview :deep(.checklist-item) {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  padding: 2px 0;
}

.block-preview :deep(.checklist-checkbox) {
  width: 16px;
  height: 16px;
  margin-top: 4px;
  cursor: pointer;
  accent-color: #2563eb;
  flex-shrink: 0;
  pointer-events: auto;
}

.block-preview :deep(.checklist-text) {
  flex: 1;
  line-height: 1.6;
}

.block-preview :deep(.checklist-item.checked .checklist-text) {
  text-decoration: line-through;
  color: #9ca3af;
}

/* リンクプレビューカード */
.block-preview :deep(.link-preview-card) {
  display: flex;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  background: #fff;
  transition: box-shadow 0.2s, border-color 0.2s;
  max-width: 100%;
  margin-top: 8px;
}

.block-preview :deep(.link-preview-card:hover) {
  border-color: #d0d0d0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.block-preview :deep(.link-preview-content) {
  flex: 1;
  min-width: 0;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.block-preview :deep(.link-preview-title) {
  font-weight: 500;
  font-size: 14px;
  color: #37352f;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.block-preview :deep(.link-preview-description) {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.block-preview :deep(.link-preview-site) {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.block-preview :deep(.link-preview-favicon) {
  width: 14px;
  height: 14px;
  border-radius: 2px;
}

/* ローディングスケルトン */
@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.block-preview :deep(.link-preview-loading) {
  pointer-events: none;
}

.block-preview :deep(.link-preview-title-skeleton) {
  height: 16px;
  width: 60%;
  background: #e5e5e5;
  border-radius: 4px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.block-preview :deep(.link-preview-description-skeleton) {
  height: 12px;
  width: 80%;
  background: #e5e5e5;
  border-radius: 4px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  animation-delay: 0.1s;
}

.block-preview :deep(.link-preview-favicon-skeleton) {
  width: 14px;
  height: 14px;
  background: #e5e5e5;
  border-radius: 2px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  animation-delay: 0.2s;
}
</style>

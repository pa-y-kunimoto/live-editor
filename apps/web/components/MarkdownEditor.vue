<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import {
  useMarkdownBlocks,
  useMarkdownRenderer,
  useLinkPreview,
  useEditorHistory,
  useBlockEditor,
  useFormatToolbar,
  useKeyboardHandler,
  type Block
} from '../composables'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Composables
const content = computed(() => props.modelValue)
const { blocks, getBlockType, getSectionBlockIds } = useMarkdownBlocks(content)

const {
  linkPreviews,
  loadingUrls,
  renderBlock,
  getRenderedBlock,
  watchBlocks
} = useMarkdownRenderer()

const {
  processUrlBlock
} = useLinkPreview(linkPreviews, loadingUrls)

const {
  editingBlockIndex,
  editingBlockId,
  hoveredBlockId,
  blockRefs,
  pendingFocus,
  ignoreBlur,
  draggedBlockIndex,
  dragOverBlockIndex,
  copiedBlockId,
  hoveredCopyBlockId,
  getTextarea,
  adjustTextareaHeight,
  startEditingByIndex,
  startEditing,
  stopEditing,
  updateBlock,
  handleInput,
  handleBlur: baseHandleBlur,
  handlePaste,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  copySection: baseCopySection
} = useBlockEditor(blocks, emit)

// 履歴管理
const {
  undo: baseUndo,
  redo: baseRedo
} = useEditorHistory(
  content,
  editingBlockIndex,
  getTextarea
)

// undo/redo のラッパー
function undo() {
  baseUndo(emit, startEditingByIndex)
}

function redo() {
  baseRedo(emit, startEditingByIndex)
}

// テーブル生成
const showTableInput = ref(false)
const tableRows = ref(3)
const tableCols = ref(3)

// フォーマットツールバー
const { applyFormat } = useFormatToolbar(
  () => editingBlockId.value,
  (blockId) => blockRefs.value.get(blockId) ?? null,
  updateBlock,
  adjustTextareaHeight
)

// キーボードハンドラー
const { handleKeydown } = useKeyboardHandler({
  blocks,
  editingBlockIndex,
  editingBlockId,
  blockRefs,
  pendingFocus,
  ignoreBlur,
  emit,
  updateBlock,
  adjustTextareaHeight,
  startEditingByIndex,
  stopEditing,
  undo,
  redo,
  processUrlBlock: (url: string) => processUrlBlock(url, blocks, updateBlock, renderBlock)
})

// セクションブロックIDを計算
const sectionBlockIds = computed(() => getSectionBlockIds(hoveredCopyBlockId.value))

// コピーセクション
function copySection(blockId: string) {
  baseCopySection(blockId, getSectionBlockIds)
}

// ブロックの監視と再レンダリング
watchBlocks(blocks)

// handleBlurをURL処理対応に拡張
async function handleBlur(blockId: string) {
  if (ignoreBlur.value) {
    return
  }

  const block = blocks.value.find((b: Block) => b.id === blockId)
  if (block) {
    const urlPattern = /^(https?:\/\/[^\s]+)$/
    const trimmedContent = block.content.trim()
    const urlMatch = trimmedContent.match(urlPattern)

    if (urlMatch && urlMatch[1]) {
      const url = urlMatch[1]
      updateBlock(blockId, `[${url}](${url})`)
      editingBlockIndex.value = null
      processUrlBlock(url, blocks, updateBlock, renderBlock)
      return
    }
  }

  baseHandleBlur(blockId)
}

function setBlockRef(blockId: string, el: HTMLTextAreaElement | null) {
  if (el) {
    blockRefs.value.set(blockId, el)
    if (pendingFocus.value && blocks.value[pendingFocus.value.blockIndex]?.id === blockId) {
      el.focus()
      adjustTextareaHeight(el)
      el.setSelectionRange(pendingFocus.value.cursorPos, pendingFocus.value.cursorPos)
      pendingFocus.value = null
    }
  } else {
    blockRefs.value.delete(blockId)
  }
}

function handleContainerClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.classList.contains('blocks-container')) {
    const lastBlockIndex = blocks.value.length - 1
    if (lastBlockIndex >= 0) {
      startEditingByIndex(lastBlockIndex)
    }
  }
}

function toggleCheckbox(blockId: string, lineIndex: number = 0) {
  const block = blocks.value.find(b => b.id === blockId)
  if (!block) return

  const lines = block.content.split('\n')
  if (lineIndex >= lines.length) return

  const line = lines[lineIndex]
  if (!line) return

  let newLine: string

  if (line.match(/\[ \]/)) {
    newLine = line.replace('[ ]', '[x]')
  } else if (line.match(/\[x\]/)) {
    newLine = line.replace('[x]', '[ ]')
  } else {
    return
  }

  lines[lineIndex] = newLine
  const newContent = lines.join('\n')
  updateBlock(blockId, newContent)
}

function handlePreviewClick(event: MouseEvent, blockId: string) {
  const target = event.target as HTMLElement

  if (target.tagName === 'INPUT' && target.classList.contains('checklist-checkbox')) {
    event.preventDefault()
    event.stopPropagation()
    const lineIndex = target.getAttribute('data-line-index')
    toggleCheckbox(blockId, lineIndex ? parseInt(lineIndex) : 0)
    return
  }

  if (target.tagName === 'A') {
    const href = target.getAttribute('href')
    if (href) {
      event.preventDefault()
      event.stopPropagation()
      window.open(href, '_blank', 'noopener,noreferrer')
      return
    }
  }

  startEditing(blockId)
}

function insertTable() {
  if (editingBlockId.value === null) return

  const blockId = editingBlockId.value
  const textarea = blockRefs.value.get(blockId)
  if (!textarea) return

  const rows = tableRows.value
  const cols = tableCols.value

  const headerCells = Array(cols).fill(0).map((_, i) => `Header ${i + 1}`).join(' | ')
  const headerRow = `| ${headerCells} |`

  const separatorCells = Array(cols).fill('---').join(' | ')
  const separatorRow = `| ${separatorCells} |`

  const dataRows = Array(rows - 1).fill(0).map((_, rowIndex) => {
    const cells = Array(cols).fill(0).map((_, colIndex) => `Cell ${rowIndex + 1}-${colIndex + 1}`).join(' | ')
    return `| ${cells} |`
  }).join('\n')

  const newContent = `${headerRow}\n${separatorRow}\n${dataRows}`
  const newCursorPos = 2

  updateBlock(blockId, newContent)
  showTableInput.value = false

  nextTick(() => {
    textarea.focus()
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    adjustTextareaHeight(textarea)
  })
}
</script>

<template>
  <div class="markdown-editor">
    <div class="blocks-container" @click="handleContainerClick">
      <div
        v-for="(block, index) in blocks"
        :key="block.id"
        class="block"
        :class="[
          `block-type-${getBlockType(block.content)}`,
          {
            'is-editing': editingBlockId === block.id,
            'is-hovered': hoveredBlockId === block.id && editingBlockId !== block.id,
            'is-dragging': draggedBlockIndex === index,
            'is-drag-over': dragOverBlockIndex === index,
            'is-in-copy-section': sectionBlockIds.has(block.id)
          }
        ]"
        @mouseenter="hoveredBlockId = block.id"
        @mouseleave="hoveredBlockId = null"
        @dragover="handleDragOver($event, index)"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, index)"
      >
        <div
          class="block-handle"
          :class="{ visible: hoveredBlockId === block.id || editingBlockId === block.id }"
          draggable="true"
          @dragstart="handleDragStart($event, index)"
          @dragend="handleDragEnd"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="2" />
            <circle cx="15" cy="6" r="2" />
            <circle cx="9" cy="12" r="2" />
            <circle cx="15" cy="12" r="2" />
            <circle cx="9" cy="18" r="2" />
            <circle cx="15" cy="18" r="2" />
          </svg>
        </div>
        <div class="block-content">
          <button
            v-if="(hoveredBlockId === block.id || editingBlockId === block.id) && block.content.trim().match(/^#{1,6}\s/)"
            class="block-copy-btn"
            :class="{ copied: copiedBlockId === block.id }"
            @click.stop="copySection(block.id)"
            @mouseenter="hoveredCopyBlockId = block.id"
            @mouseleave="hoveredCopyBlockId = null"
            :title="copiedBlockId === block.id ? 'Copied!' : 'Copy section'"
          >
            <svg v-if="copiedBlockId !== block.id" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          <!-- フォーマットツールバー -->
          <div v-if="editingBlockId === block.id" class="format-toolbar">
            <button @mousedown.prevent="applyFormat('h1')" class="toolbar-btn" title="見出し1">H1</button>
            <button @mousedown.prevent="applyFormat('h2')" class="toolbar-btn" title="見出し2">H2</button>
            <button @mousedown.prevent="applyFormat('h3')" class="toolbar-btn" title="見出し3">H3</button>
            <div class="toolbar-divider"></div>
            <button @mousedown.prevent="applyFormat('bold')" class="toolbar-btn" title="太字">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
              </svg>
            </button>
            <button @mousedown.prevent="applyFormat('italic')" class="toolbar-btn" title="斜体">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="19" y1="4" x2="10" y2="4"></line>
                <line x1="14" y1="20" x2="5" y2="20"></line>
                <line x1="15" y1="4" x2="9" y2="20"></line>
              </svg>
            </button>
            <button @mousedown.prevent="applyFormat('code')" class="toolbar-btn" title="コード">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </button>
            <div class="toolbar-divider"></div>
            <button @mousedown.prevent="applyFormat('bullet')" class="toolbar-btn" title="箇条書き">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="9" y1="6" x2="20" y2="6"></line>
                <line x1="9" y1="12" x2="20" y2="12"></line>
                <line x1="9" y1="18" x2="20" y2="18"></line>
                <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"></circle>
                <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"></circle>
                <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"></circle>
              </svg>
            </button>
            <button @mousedown.prevent="applyFormat('checklist')" class="toolbar-btn" title="チェックリスト">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="3" y="5" width="6" height="6" rx="1"></rect>
                <line x1="12" y1="8" x2="21" y2="8"></line>
              </svg>
            </button>
            <button @mousedown.prevent="applyFormat('quote')" class="toolbar-btn" title="引用">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
              </svg>
            </button>
            <div class="toolbar-divider"></div>
            <button @mousedown.prevent="applyFormat('code-block')" class="toolbar-btn" title="コードブロック">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <polyline points="10 9 7 12 10 15"></polyline>
                <polyline points="14 15 17 12 14 9"></polyline>
              </svg>
            </button>
            <button @mousedown.prevent="applyFormat('table')" class="toolbar-btn" :class="{ active: showTableInput }" title="テーブル">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="3" y1="15" x2="21" y2="15"></line>
                <line x1="12" y1="3" x2="12" y2="21"></line>
              </svg>
            </button>
            <div v-if="showTableInput" class="table-input-group" @mousedown.stop>
              <input
                type="number"
                v-model.number="tableRows"
                min="2"
                max="20"
                class="table-input"
                placeholder="行"
                @focus="ignoreBlur = true"
                @blur="ignoreBlur = false"
              />
              <span class="table-input-separator">×</span>
              <input
                type="number"
                v-model.number="tableCols"
                min="2"
                max="10"
                class="table-input"
                placeholder="列"
                @focus="ignoreBlur = true"
                @blur="ignoreBlur = false"
              />
              <button @mousedown.prevent="insertTable" class="toolbar-btn table-insert-btn" title="挿入">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
            </div>
          </div>

          <textarea
            v-if="editingBlockId === block.id"
            :ref="(el) => setBlockRef(block.id, el as HTMLTextAreaElement)"
            :value="block.content"
            class="block-textarea"
            :placeholder="index === 0 ? 'Type \'/\' for commands or start writing...' : ''"
            @input="(e) => handleInput(e, block.id)"
            @blur="() => handleBlur(block.id)"
            @keydown="(e) => handleKeydown(e, block.id, index)"
            @paste="(e) => handlePaste(e, block.id)"
          />
          <div
            v-else
            class="block-preview"
            @click.stop="(e) => handlePreviewClick(e, block.id)"
            v-html="getRenderedBlock(block)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.markdown-editor {
  min-height: 400px;
  position: relative;
}

.format-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 4px;
  padding: 2px 4px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.15s ease-out;
  width: fit-content;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: #666;
  cursor: pointer;
  transition: all 0.12s;
  padding: 0 4px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
}

.toolbar-btn:hover {
  background: rgba(55, 53, 47, 0.08);
  color: #000;
}

.toolbar-btn:active {
  background: rgba(55, 53, 47, 0.14);
  transform: scale(0.96);
}

.toolbar-btn.active {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.toolbar-divider {
  width: 1px;
  height: 14px;
  background: #e5e5e5;
  margin: 0 2px;
}

.table-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-left: 4px;
  border-left: 1px solid #e5e5e5;
  margin-left: 4px;
}

.table-input {
  width: 36px;
  height: 22px;
  padding: 0 6px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 11px;
  text-align: center;
  color: #37352f;
  background: white;
}

.table-input:focus {
  outline: none;
  border-color: #2563eb;
}

.table-input::placeholder {
  color: #9ca3af;
  font-size: 10px;
}

.table-input-separator {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
}

.table-insert-btn {
  background: #2563eb;
  color: white;
}

.table-insert-btn:hover {
  background: #1d4ed8;
}

.blocks-container {
  min-height: 400px;
  padding: 28px 20px 28px 48px;
  cursor: text;
}

.block {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin: 0;
  padding: 3px 0;
  border-radius: 4px;
  transition: background 0.1s;
}

.block.is-hovered {
  background: rgba(55, 53, 47, 0.03);
}

.block.is-editing {
  background: rgba(55, 53, 47, 0.06);
}

.block.is-dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.block.is-drag-over {
  border-top: 2px solid #2563eb;
  margin-top: -2px;
}

.block.is-in-copy-section {
  background: rgba(37, 99, 235, 0.08);
  border-left: 3px solid #2563eb;
  padding-left: 5px;
  margin-left: -8px;
}

.block-handle {
  position: absolute;
  left: -32px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: #b0b0b0;
  cursor: grab;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s;
  user-select: none;
}

.block-handle:active {
  cursor: grabbing;
}

.block-handle.visible {
  opacity: 1;
}

.block-handle:hover {
  background: rgba(55, 53, 47, 0.08);
  color: #888;
}

.block-copy-btn {
  position: absolute;
  right: 0;
  top: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e5e5;
  color: #666;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  z-index: 10;
}

.block-copy-btn:hover {
  background: white;
  border-color: #d0d0d0;
  color: #37352f;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.block-copy-btn.copied {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.block-content {
  flex: 1;
  min-width: 0;
  position: relative;
}

.block-textarea {
  width: 100%;
  padding: 4px 8px;
  margin: -4px -8px;
  border: none;
  border-radius: 4px;
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  outline: none;
  background: transparent;
  overflow: hidden;
  min-height: 26px;
  color: #37352f;
}

.block-type-heading-1 .block-textarea,
.block-type-heading-2 .block-textarea,
.block-type-heading-3 .block-textarea {
  font-weight: 600;
}

.block-type-heading-1 .block-textarea {
  font-size: 30px;
  line-height: 1.3;
}

.block-type-heading-2 .block-textarea {
  font-size: 24px;
  line-height: 1.3;
}

.block-type-heading-3 .block-textarea {
  font-size: 20px;
  line-height: 1.3;
}

.block-type-code-block .block-textarea {
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  background: #f8f8f8;
  color: #37352f;
  padding: 16px 20px;
  margin: 0;
  border-radius: 6px;
  border: 1px solid #e5e5e5;
  line-height: 1.6;
}

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

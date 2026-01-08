<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { useMarkdownBlocks, useBlockEditor, useFormatToolbar, useKeyboardHandler, useMarkdownRenderer, type Block } from '@live-editor/core'
import { useCodeBlockRenderer, parseCodeBlock } from '@live-editor/code-block'
import { useChecklistRenderer } from '@live-editor/list'
import { useTableCommand } from '@live-editor/table'
import { useLinkPreview, useLinkPreviewRenderer } from '@live-editor/link'
import { useEditorHistory } from '@live-editor/history'
import { marked } from 'marked'
import EditorBlock from './editor/EditorBlock.vue'
import type { FormatType } from './editor/FormatToolbar.vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Composables
const content = computed(() => props.modelValue)
const { blocks, getBlockType, getSectionBlockIds } = useMarkdownBlocks(content)

// 各種レンダラーを初期化
const { renderCodeBlock } = useCodeBlockRenderer()
const { renderChecklist, isChecklistBlock } = useChecklistRenderer()
const { renderLoadingPreview, renderLinkPreview } = useLinkPreviewRenderer()

// レンダラーを注入してuseMarkdownRendererを初期化
const {
  linkPreviews,
  loadingUrls,
  renderBlock,
  getRenderedBlock,
  watchBlocks
} = useMarkdownRenderer({
  codeBlock: {
    parse: parseCodeBlock,
    render: renderCodeBlock,
  },
  checklist: {
    isChecklist: isChecklistBlock,
    render: renderChecklist,
  },
  linkPreview: {
    renderLoading: renderLoadingPreview,
    render: renderLinkPreview,
  },
  parseMarkdown: (c: string) => marked.parse(c, { async: false }) as string,
})

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
  stopEditing,
  updateBlock,
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

// フォーマットツールバー
const { applyFormat } = useFormatToolbar(
  () => editingBlockId.value,
  (blockId: string) => blockRefs.value.get(blockId) ?? null,
  updateBlock,
  adjustTextareaHeight
)

// テーブルコマンドハンドラー
const tableCommand = useTableCommand()

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
  processUrlBlock: (url: string) => processUrlBlock(url, blocks, updateBlock, renderBlock),
  commandHandlers: [tableCommand]
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
  const block = blocks.value.find((b: Block) => b.id === blockId)
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

function handleLinkClick(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

function handleFormat(_blockId: string, type: FormatType) {
  applyFormat(type)
}

function handleInsertTable(blockId: string, rows: number, cols: number) {
  const textarea = blockRefs.value.get(blockId)
  if (!textarea) return

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

  nextTick(() => {
    textarea.focus()
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    adjustTextareaHeight(textarea)
  })
}

function handleTextareaMounted(blockId: string, el: HTMLTextAreaElement) {
  setBlockRef(blockId, el)
  adjustTextareaHeight(el)
}

function isHeadingBlock(content: string): boolean {
  return /^#{1,6}\s/.test(content.trim())
}
</script>

<template>
  <div class="markdown-editor">
    <div class="blocks-container" @click="handleContainerClick">
      <EditorBlock
        v-for="(block, index) in blocks"
        :key="block.id"
        :block="block"
        :index="index"
        :block-type="getBlockType(block.content)"
        :is-editing="editingBlockId === block.id"
        :is-hovered="hoveredBlockId === block.id && editingBlockId !== block.id"
        :is-dragging="draggedBlockIndex === index"
        :is-drag-over="dragOverBlockIndex === index"
        :is-in-copy-section="sectionBlockIds.has(block.id)"
        :is-copied="copiedBlockId === block.id"
        :is-heading="isHeadingBlock(block.content)"
        :rendered-html="getRenderedBlock(block)"
        :pending-focus="pendingFocus && blocks[pendingFocus.blockIndex]?.id === block.id ? { cursorPos: pendingFocus.cursorPos } : null"
        @mouseenter="hoveredBlockId = block.id"
        @mouseleave="hoveredBlockId = null"
        @dragover="handleDragOver($event, index)"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, index)"
        @dragstart="handleDragStart($event, index)"
        @dragend="handleDragEnd"
        @copy-section="copySection(block.id)"
        @copy-hover-enter="hoveredCopyBlockId = block.id"
        @copy-hover-leave="hoveredCopyBlockId = null"
        @format="handleFormat(block.id, $event)"
        @insert-table="(rows: number, cols: number) => handleInsertTable(block.id, rows, cols)"
        @ignore-blur="ignoreBlur = $event"
        @update:content="updateBlock(block.id, $event)"
        @blur="handleBlur(block.id)"
        @keydown="handleKeydown($event, block.id, index)"
        @paste="handlePaste($event, block.id)"
        @start-editing="startEditingByIndex(index)"
        @checkbox-toggle="toggleCheckbox(block.id, $event)"
        @link-click="handleLinkClick"
        @textarea-mounted="handleTextareaMounted(block.id, $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.markdown-editor {
  min-height: 400px;
  position: relative;
}

.blocks-container {
  min-height: 400px;
  padding: 28px 20px 28px 48px;
  cursor: text;
}
</style>

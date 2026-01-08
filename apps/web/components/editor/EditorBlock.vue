<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Block, BlockType } from '@live-editor/core'
import type { FormatType } from './FormatToolbar.vue'
import BlockHandle from './BlockHandle.vue'
import BlockCopyButton from './BlockCopyButton.vue'
import FormatToolbar from './FormatToolbar.vue'
import BlockPreview from './BlockPreview.vue'

const props = defineProps<{
  block: Block
  index: number
  blockType: BlockType
  isEditing: boolean
  isHovered: boolean
  isDragging: boolean
  isDragOver: boolean
  isInCopySection: boolean
  isCopied: boolean
  isHeading: boolean
  renderedHtml: string
  pendingFocus?: { cursorPos: number } | null
}>()

const emit = defineEmits<{
  mouseenter: []
  mouseleave: []
  dragover: [event: DragEvent]
  dragleave: []
  drop: [event: DragEvent]
  dragstart: [event: DragEvent]
  dragend: [event: DragEvent]
  copySection: []
  copyHoverEnter: []
  copyHoverLeave: []
  format: [type: FormatType]
  insertTable: [rows: number, cols: number]
  ignoreBlur: [value: boolean]
  'update:content': [content: string]
  blur: []
  keydown: [event: KeyboardEvent]
  paste: [event: ClipboardEvent]
  startEditing: []
  checkboxToggle: [lineIndex: number]
  linkClick: [url: string]
  textareaMounted: [el: HTMLTextAreaElement]
}>()

defineExpose({})  // Prevent Vue warning about unused emit

const showTableInput = ref(false)
const tableRows = ref(3)
const tableCols = ref(3)

const showHandle = computed(() => props.isHovered || props.isEditing)
const showCopyButton = computed(() => (props.isHovered || props.isEditing) && props.isHeading)

function handleFormat(type: FormatType) {
  emit('format', type)
}

function handleInsertTable() {
  emit('insertTable', tableRows.value, tableCols.value)
  showTableInput.value = false
}

function handleIgnoreBlur(value: boolean) {
  emit('ignoreBlur', value)
}
</script>

<template>
  <div
    class="block"
    :class="[
      `block-type-${blockType}`,
      {
        'is-editing': isEditing,
        'is-hovered': isHovered && !isEditing,
        'is-dragging': isDragging,
        'is-drag-over': isDragOver,
        'is-in-copy-section': isInCopySection
      }
    ]"
    @mouseenter="emit('mouseenter')"
    @mouseleave="emit('mouseleave')"
    @dragover="emit('dragover', $event)"
    @dragleave="emit('dragleave')"
    @drop="emit('drop', $event)"
  >
    <BlockHandle
      :visible="showHandle"
      @dragstart="emit('dragstart', $event)"
      @dragend="emit('dragend', $event)"
    />

    <div class="block-content">
      <BlockCopyButton
        v-if="showCopyButton"
        :copied="isCopied"
        @click="emit('copySection')"
        @mouseenter="emit('copyHoverEnter')"
        @mouseleave="emit('copyHoverLeave')"
      />

      <FormatToolbar
        v-if="isEditing"
        :show-table-input="showTableInput"
        :table-rows="tableRows"
        :table-cols="tableCols"
        @format="handleFormat"
        @update:show-table-input="showTableInput = $event"
        @update:table-rows="tableRows = $event"
        @update:table-cols="tableCols = $event"
        @insert-table="handleInsertTable"
        @ignore-blur="handleIgnoreBlur"
      />

      <textarea
        v-if="isEditing"
        :value="block.content"
        class="block-textarea"
        :class="{
          'block-textarea-heading-1': blockType === 'heading-1',
          'block-textarea-heading-2': blockType === 'heading-2',
          'block-textarea-heading-3': blockType === 'heading-3',
          'block-textarea-code-block': blockType === 'code-block'
        }"
        :placeholder="index === 0 ? 'Type \'/\' for commands or start writing...' : ''"
        @input="emit('update:content', ($event.target as HTMLTextAreaElement).value)"
        @blur="emit('blur')"
        @keydown="emit('keydown', $event)"
        @paste="emit('paste', $event)"
        @vue:mounted="(e: any) => emit('textareaMounted', e.el)"
      />
      <BlockPreview
        v-else
        :html="renderedHtml"
        @click="emit('startEditing')"
        @checkbox-toggle="emit('checkboxToggle', $event)"
        @link-click="emit('linkClick', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
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

.block-textarea-heading-1,
.block-textarea-heading-2,
.block-textarea-heading-3 {
  font-weight: 600;
}

.block-textarea-heading-1 {
  font-size: 30px;
  line-height: 1.3;
}

.block-textarea-heading-2 {
  font-size: 24px;
  line-height: 1.3;
}

.block-textarea-heading-3 {
  font-size: 20px;
  line-height: 1.3;
}

.block-textarea-code-block {
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
</style>

<script setup lang="ts">

export type FormatType =
  | 'bold'
  | 'italic'
  | 'code'
  | 'link'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bullet'
  | 'numbered'
  | 'checklist'
  | 'quote'
  | 'code-block'
  | 'table'

defineProps<{
  showTableInput: boolean
  tableRows: number
  tableCols: number
}>()

const emit = defineEmits<{
  format: [type: FormatType]
  'update:showTableInput': [value: boolean]
  'update:tableRows': [value: number]
  'update:tableCols': [value: number]
  insertTable: []
  ignoreBlur: [value: boolean]
}>()

function handleFormat(type: FormatType) {
  if (type === 'table') {
    emit('update:showTableInput', true)
  } else {
    emit('format', type)
  }
}

// スピンボタンクリック時にblurが発生してもUIが閉じないように遅延させる
function handleInputBlur(event: FocusEvent) {
  // relatedTarget（次にフォーカスされる要素）がtable-input-group内ならignoreBlurを維持
  const relatedTarget = event.relatedTarget as HTMLElement | null
  const inputGroup = (event.target as HTMLElement)?.closest('.table-input-group')

  if (relatedTarget && inputGroup?.contains(relatedTarget)) {
    // 同じグループ内の別の要素にフォーカスが移動する場合は何もしない
    return
  }

  // 少し遅延させて、スピンボタンクリックの場合に対応
  setTimeout(() => {
    emit('ignoreBlur', false)
  }, 100)
}
</script>

<template>
  <div class="format-toolbar">
    <button @mousedown.prevent="handleFormat('h1')" class="toolbar-btn" title="見出し1">H1</button>
    <button @mousedown.prevent="handleFormat('h2')" class="toolbar-btn" title="見出し2">H2</button>
    <button @mousedown.prevent="handleFormat('h3')" class="toolbar-btn" title="見出し3">H3</button>
    <div class="toolbar-divider"></div>
    <button @mousedown.prevent="handleFormat('bold')" class="toolbar-btn" title="太字">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
        <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
      </svg>
    </button>
    <button @mousedown.prevent="handleFormat('italic')" class="toolbar-btn" title="斜体">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="19" y1="4" x2="10" y2="4"></line>
        <line x1="14" y1="20" x2="5" y2="20"></line>
        <line x1="15" y1="4" x2="9" y2="20"></line>
      </svg>
    </button>
    <button @mousedown.prevent="handleFormat('code')" class="toolbar-btn" title="コード">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
    </button>
    <div class="toolbar-divider"></div>
    <button @mousedown.prevent="handleFormat('bullet')" class="toolbar-btn" title="箇条書き">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="9" y1="6" x2="20" y2="6"></line>
        <line x1="9" y1="12" x2="20" y2="12"></line>
        <line x1="9" y1="18" x2="20" y2="18"></line>
        <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"></circle>
        <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"></circle>
        <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"></circle>
      </svg>
    </button>
    <button @mousedown.prevent="handleFormat('checklist')" class="toolbar-btn" title="チェックリスト">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <rect x="3" y="5" width="6" height="6" rx="1"></rect>
        <line x1="12" y1="8" x2="21" y2="8"></line>
      </svg>
    </button>
    <button @mousedown.prevent="handleFormat('quote')" class="toolbar-btn" title="引用">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
      </svg>
    </button>
    <div class="toolbar-divider"></div>
    <button @mousedown.prevent="handleFormat('code-block')" class="toolbar-btn" title="コードブロック">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
        <polyline points="10 9 7 12 10 15"></polyline>
        <polyline points="14 15 17 12 14 9"></polyline>
      </svg>
    </button>
    <button @mousedown.prevent="handleFormat('table')" class="toolbar-btn" :class="{ active: showTableInput }" title="テーブル">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
        <line x1="3" y1="9" x2="21" y2="9"></line>
        <line x1="3" y1="15" x2="21" y2="15"></line>
        <line x1="12" y1="3" x2="12" y2="21"></line>
      </svg>
    </button>
    <div v-if="showTableInput" class="table-input-group" @mousedown.stop @mouseup.stop>
      <input
        type="number"
        :value="tableRows"
        @input="emit('update:tableRows', Number(($event.target as HTMLInputElement).value))"
        min="2"
        max="20"
        class="table-input"
        placeholder="行"
        @focus="emit('ignoreBlur', true)"
        @blur="handleInputBlur"
        @mousedown.stop
      />
      <span class="table-input-separator">×</span>
      <input
        type="number"
        :value="tableCols"
        @input="emit('update:tableCols', Number(($event.target as HTMLInputElement).value))"
        min="2"
        max="10"
        class="table-input"
        placeholder="列"
        @focus="emit('ignoreBlur', true)"
        @blur="handleInputBlur"
        @mousedown.stop
      />
      <button @mousedown.prevent="emit('insertTable')" class="toolbar-btn table-insert-btn" title="挿入">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
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
</style>

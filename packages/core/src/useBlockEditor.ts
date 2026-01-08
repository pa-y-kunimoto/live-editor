import { ref, computed, nextTick, type ComputedRef } from 'vue';
import type { Block } from './index';

export function useBlockEditor(
  blocks: ComputedRef<Block[]>,
  emit: (event: 'update:modelValue', value: string) => void
) {
  const editingBlockIndex = ref<number | null>(null);
  const hoveredBlockId = ref<string | null>(null);
  const blockRefs = ref<Map<string, HTMLTextAreaElement>>(new Map());
  const pendingFocus = ref<{ blockIndex: number; cursorPos: number } | null>(null);
  const ignoreBlur = ref(false);

  // ドラッグアンドドロップ用の状態
  const draggedBlockIndex = ref<number | null>(null);
  const dragOverBlockIndex = ref<number | null>(null);

  // コピーしたブロックIDを記録
  const copiedBlockId = ref<string | null>(null);
  const hoveredCopyBlockId = ref<string | null>(null);

  // 編集中のブロックIDを取得するcomputed
  const editingBlockId = computed(() => {
    if (editingBlockIndex.value === null) return null;
    const block = blocks.value[editingBlockIndex.value];
    return block ? block.id : null;
  });

  function getTextarea(): HTMLTextAreaElement | null {
    if (!editingBlockId.value) return null;
    return blockRefs.value.get(editingBlockId.value) ?? null;
  }

  function adjustTextareaHeight(textarea: HTMLTextAreaElement) {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  function startEditingByIndex(blockIndex: number, cursorPos?: number) {
    ignoreBlur.value = true;
    editingBlockIndex.value = blockIndex;

    if (cursorPos !== undefined) {
      pendingFocus.value = { blockIndex, cursorPos };
    }

    nextTick(() => {
      const currentBlockId = editingBlockId.value;
      if (!currentBlockId) return;

      const textarea = blockRefs.value.get(currentBlockId);
      if (textarea) {
        textarea.focus();
        adjustTextareaHeight(textarea);
        if (pendingFocus.value) {
          textarea.setSelectionRange(pendingFocus.value.cursorPos, pendingFocus.value.cursorPos);
          pendingFocus.value = null;
        }
      }
      setTimeout(() => {
        ignoreBlur.value = false;
      }, 50);
    });
  }

  function startEditing(blockId: string, cursorPos?: number) {
    const blockIndex = blocks.value.findIndex((b: Block) => b.id === blockId);
    if (blockIndex !== -1) {
      startEditingByIndex(blockIndex, cursorPos);
    }
  }

  function stopEditing() {
    if (ignoreBlur.value) {
      return;
    }
  }

  function updateBlock(blockId: string, newContent: string) {
    const blockIndex = blocks.value.findIndex((b: Block) => b.id === blockId);
    if (blockIndex === -1) return;

    const newBlocks = blocks.value.map((b: Block, i: number) =>
      i === blockIndex ? { ...b, content: newContent } : b
    );

    emit('update:modelValue', newBlocks.map((b: Block) => b.content).join('\n'));
  }

  function handleInput(event: Event, blockId: string) {
    const textarea = event.target as HTMLTextAreaElement;
    updateBlock(blockId, textarea.value);
    adjustTextareaHeight(textarea);
  }

  function handleBlur(_blockId: string) {
    if (ignoreBlur.value) {
      return;
    }
    editingBlockIndex.value = null;
  }

  function handlePaste(event: ClipboardEvent, blockId: string) {
    const pastedText = event.clipboardData?.getData('text');
    if (!pastedText) return;

    const urlPattern = /^https?:\/\/[^\s]+$/;
    const trimmedUrl = pastedText.trim();
    if (urlPattern.test(trimmedUrl)) {
      const textarea = event.target as HTMLTextAreaElement;
      const cursorPos = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;
      const content = textarea.value;
      const selectedText = content.slice(cursorPos, selectionEnd);

      if (selectedText) {
        event.preventDefault();
        const markdownLink = `[${selectedText}](${trimmedUrl})`;
        const newContent = content.slice(0, cursorPos) + markdownLink + content.slice(selectionEnd);
        updateBlock(blockId, newContent);
        nextTick(() => {
          const newCursorPos = cursorPos + markdownLink.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        });
      }
    }
  }

  // ドラッグアンドドロップのハンドラー
  function handleDragStart(event: DragEvent, blockIndex: number) {
    draggedBlockIndex.value = blockIndex;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', blockIndex.toString());
    }
  }

  function handleDragOver(event: DragEvent, blockIndex: number) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    dragOverBlockIndex.value = blockIndex;
  }

  function handleDragLeave() {
    dragOverBlockIndex.value = null;
  }

  function handleDrop(event: DragEvent, targetIndex: number) {
    event.preventDefault();
    if (draggedBlockIndex.value === null || draggedBlockIndex.value === targetIndex) {
      draggedBlockIndex.value = null;
      dragOverBlockIndex.value = null;
      return;
    }

    const newBlocks = [...blocks.value];
    const draggedBlock = newBlocks[draggedBlockIndex.value];
    if (!draggedBlock) {
      draggedBlockIndex.value = null;
      dragOverBlockIndex.value = null;
      return;
    }

    // ドラッグしたブロックを削除
    newBlocks.splice(draggedBlockIndex.value, 1);

    // 新しい位置に挿入（削除後のインデックスを調整）
    const insertIndex = targetIndex > draggedBlockIndex.value ? targetIndex - 1 : targetIndex;
    newBlocks.splice(insertIndex, 0, draggedBlock);

    emit('update:modelValue', newBlocks.map((b: Block) => b.content).join('\n'));

    draggedBlockIndex.value = null;
    dragOverBlockIndex.value = null;
  }

  function handleDragEnd() {
    draggedBlockIndex.value = null;
    dragOverBlockIndex.value = null;
  }

  // セクションのコピー
  function copySection(blockId: string, getSectionBlockIds: (id: string) => Set<string>) {
    const sectionIds = getSectionBlockIds(blockId);
    if (sectionIds.size === 0) return;

    const sectionContent = blocks.value
      .filter((b: Block) => sectionIds.has(b.id))
      .map((b: Block) => b.content)
      .join('\n');

    navigator.clipboard.writeText(sectionContent);
    copiedBlockId.value = blockId;

    setTimeout(() => {
      copiedBlockId.value = null;
    }, 2000);
  }

  return {
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
    handleBlur,
    handlePaste,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    copySection,
  };
}

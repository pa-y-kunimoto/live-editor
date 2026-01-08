import { ref, watch, type Ref } from 'vue';

export interface HistoryState {
  content: string;
  editingBlockIndex: number | null;
  cursorPos: number | null;
}

export function useEditorHistory(
  modelValue: Ref<string>,
  editingBlockIndex: Ref<number | null>,
  getTextarea: () => HTMLTextAreaElement | null
) {
  const history = ref<HistoryState[]>([
    {
      content: modelValue.value,
      editingBlockIndex: null,
      cursorPos: null,
    },
  ]);
  const historyIndex = ref(0);
  const isUndoRedo = ref(false);

  // modelValueの変更を監視して履歴に追加
  watch(
    () => modelValue.value,
    newValue => {
      if (isUndoRedo.value) {
        isUndoRedo.value = false;
        return;
      }

      // 現在の履歴位置より後ろの履歴を削除
      if (historyIndex.value < history.value.length - 1) {
        history.value = history.value.slice(0, historyIndex.value + 1);
      }

      // カーソル位置を取得
      let cursorPos: number | null = null;
      const textarea = getTextarea();
      if (textarea) {
        cursorPos = textarea.selectionStart;
      }

      // 新しい値を履歴に追加
      history.value.push({
        content: newValue,
        editingBlockIndex: editingBlockIndex.value,
        cursorPos,
      });
      historyIndex.value = history.value.length - 1;

      // 履歴が100個を超えたら古いものを削除
      if (history.value.length > 100) {
        history.value.shift();
        historyIndex.value--;
      }
    }
  );

  function undo(
    emit: (event: 'update:modelValue', value: string) => void,
    startEditingByIndex: (index: number, cursorPos?: number) => void
  ) {
    if (historyIndex.value > 0) {
      isUndoRedo.value = true;
      historyIndex.value--;
      const state = history.value[historyIndex.value];
      if (state) {
        emit('update:modelValue', state.content);

        // 編集状態とカーソル位置を復元
        if (state.editingBlockIndex !== null) {
          startEditingByIndex(state.editingBlockIndex, state.cursorPos ?? undefined);
        }
      }
    }
  }

  function redo(
    emit: (event: 'update:modelValue', value: string) => void,
    startEditingByIndex: (index: number, cursorPos?: number) => void
  ) {
    if (historyIndex.value < history.value.length - 1) {
      isUndoRedo.value = true;
      historyIndex.value++;
      const state = history.value[historyIndex.value];
      if (state) {
        emit('update:modelValue', state.content);

        // 編集状態とカーソル位置を復元
        if (state.editingBlockIndex !== null) {
          startEditingByIndex(state.editingBlockIndex, state.cursorPos ?? undefined);
        }
      }
    }
  }

  return {
    history,
    historyIndex,
    isUndoRedo,
    undo,
    redo,
  };
}

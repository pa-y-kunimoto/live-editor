import { describe, it, expect, vi } from 'vitest';
import { ref, computed } from 'vue';
import { useKeyboardHandler, type KeyboardHandlerDeps } from '../useKeyboardHandler';
import type { Block } from '../types';

describe('useKeyboardHandler', () => {
  // モック用のヘルパー関数
  function createMockDeps(overrides: Partial<KeyboardHandlerDeps> = {}): KeyboardHandlerDeps {
    const blocksData = ref<Block[]>([{ id: 'block-0', content: '' }]);
    const editingBlockIndex = ref<number | null>(0);
    const blockRefsMap = new Map<string, HTMLTextAreaElement>();

    return {
      blocks: computed(() => blocksData.value),
      editingBlockIndex,
      editingBlockId: computed(() => {
        if (editingBlockIndex.value === null) return null;
        return blocksData.value[editingBlockIndex.value]?.id ?? null;
      }),
      blockRefs: ref(blockRefsMap),
      pendingFocus: ref(null),
      ignoreBlur: ref(false),
      emit: vi.fn(),
      updateBlock: vi.fn(),
      adjustTextareaHeight: vi.fn(),
      startEditingByIndex: vi.fn(),
      stopEditing: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      processUrlBlock: vi.fn(),
      ...overrides,
    };
  }

  function createMockTextarea(value: string, selectionStart = 0): HTMLTextAreaElement {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    Object.defineProperty(textarea, 'selectionStart', {
      value: selectionStart,
      writable: true,
    });
    Object.defineProperty(textarea, 'selectionEnd', {
      value: selectionStart,
      writable: true,
    });
    return textarea;
  }

  function createKeyboardEvent(
    key: string,
    options: Partial<KeyboardEventInit> = {}
  ): KeyboardEvent {
    return new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    });
  }

  describe('Enter key in code blocks', () => {
    it('should auto-complete code block structure when Enter pressed on unclosed ```', () => {
      const updateBlock = vi.fn();
      const blocksData = ref<Block[]>([{ id: 'block-0', content: '```' }]);
      const editingBlockIndex = ref<number | null>(0);

      const deps = createMockDeps({
        blocks: computed(() => blocksData.value),
        editingBlockIndex,
        editingBlockId: computed(() => {
          if (editingBlockIndex.value === null) return null;
          return blocksData.value[editingBlockIndex.value]?.id ?? null;
        }),
        updateBlock,
      });

      const { handleKeydown } = useKeyboardHandler(deps);
      const textarea = createMockTextarea('```', 3);
      const event = createKeyboardEvent('Enter');
      Object.defineProperty(event, 'target', { value: textarea });
      vi.spyOn(event, 'preventDefault');

      handleKeydown(event, 'block-0', 0);

      expect(event.preventDefault).toHaveBeenCalled();
      // 閉じる```を追加して完全なコードブロック構造を作成
      expect(updateBlock).toHaveBeenCalledWith('block-0', '```\n\n```');
    });

    it('should auto-complete code block with language when Enter pressed on unclosed ```javascript', () => {
      const updateBlock = vi.fn();
      const blocksData = ref<Block[]>([{ id: 'block-0', content: '```javascript' }]);
      const editingBlockIndex = ref<number | null>(0);

      const deps = createMockDeps({
        blocks: computed(() => blocksData.value),
        editingBlockIndex,
        editingBlockId: computed(() => {
          if (editingBlockIndex.value === null) return null;
          return blocksData.value[editingBlockIndex.value]?.id ?? null;
        }),
        updateBlock,
      });

      const { handleKeydown } = useKeyboardHandler(deps);
      const textarea = createMockTextarea('```javascript', 13);
      const event = createKeyboardEvent('Enter');
      Object.defineProperty(event, 'target', { value: textarea });
      vi.spyOn(event, 'preventDefault');

      handleKeydown(event, 'block-0', 0);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(updateBlock).toHaveBeenCalledWith('block-0', '```javascript\n\n```');
    });

    it('should allow normal newline inside complete code block', () => {
      const updateBlock = vi.fn();
      const codeBlockContent = '```javascript\nconst x = 1;\n```';
      const blocksData = ref<Block[]>([{ id: 'block-0', content: codeBlockContent }]);
      const editingBlockIndex = ref<number | null>(0);

      const deps = createMockDeps({
        blocks: computed(() => blocksData.value),
        editingBlockIndex,
        editingBlockId: computed(() => {
          if (editingBlockIndex.value === null) return null;
          return blocksData.value[editingBlockIndex.value]?.id ?? null;
        }),
        updateBlock,
      });

      const { handleKeydown } = useKeyboardHandler(deps);
      // カーソルを `const x = 1;` の後に配置
      const cursorPos = '```javascript\nconst x = 1;'.length;
      const textarea = createMockTextarea(codeBlockContent, cursorPos);
      const event = createKeyboardEvent('Enter');
      Object.defineProperty(event, 'target', { value: textarea });
      vi.spyOn(event, 'preventDefault');

      handleKeydown(event, 'block-0', 0);

      expect(event.preventDefault).toHaveBeenCalled();
      // 改行が挿入される（インデント維持）
      expect(updateBlock).toHaveBeenCalledWith('block-0', '```javascript\nconst x = 1;\n\n```');
    });

    it('should detect closing backticks correctly', () => {
      // 閉じる```が存在するコードブロック
      const updateBlock = vi.fn();
      const codeBlockContent = '```\ncode\n```';
      const blocksData = ref<Block[]>([{ id: 'block-0', content: codeBlockContent }]);
      const editingBlockIndex = ref<number | null>(0);

      const deps = createMockDeps({
        blocks: computed(() => blocksData.value),
        editingBlockIndex,
        editingBlockId: computed(() => {
          if (editingBlockIndex.value === null) return null;
          return blocksData.value[editingBlockIndex.value]?.id ?? null;
        }),
        updateBlock,
      });

      const { handleKeydown } = useKeyboardHandler(deps);
      // カーソルを `code` の後に配置
      const cursorPos = '```\ncode'.length;
      const textarea = createMockTextarea(codeBlockContent, cursorPos);
      const event = createKeyboardEvent('Enter');
      Object.defineProperty(event, 'target', { value: textarea });

      handleKeydown(event, 'block-0', 0);

      // 閉じ```がある場合は通常の改行処理
      expect(updateBlock).toHaveBeenCalled();
      const callArg = updateBlock.mock.calls[0]?.[1];
      // 新しいコンテンツには改行が挿入されている
      expect(callArg).toContain('```\ncode\n');
    });
  });

  describe('hasClosingBackticks detection', () => {
    it('should return false for single line ```', () => {
      const updateBlock = vi.fn();
      const blocksData = ref<Block[]>([{ id: 'block-0', content: '```' }]);
      const editingBlockIndex = ref<number | null>(0);

      const deps = createMockDeps({
        blocks: computed(() => blocksData.value),
        editingBlockIndex,
        editingBlockId: computed(() => {
          if (editingBlockIndex.value === null) return null;
          return blocksData.value[editingBlockIndex.value]?.id ?? null;
        }),
        updateBlock,
      });

      const { handleKeydown } = useKeyboardHandler(deps);
      const textarea = createMockTextarea('```', 3);
      const event = createKeyboardEvent('Enter');
      Object.defineProperty(event, 'target', { value: textarea });

      handleKeydown(event, 'block-0', 0);

      // hasClosingBackticks = false なので、完全構造を作成
      expect(updateBlock).toHaveBeenCalledWith('block-0', '```\n\n```');
    });

    it('should return true when closing ``` exists on separate line', () => {
      const updateBlock = vi.fn();
      const content = '```\ncode\n```';
      const blocksData = ref<Block[]>([{ id: 'block-0', content }]);
      const editingBlockIndex = ref<number | null>(0);

      const deps = createMockDeps({
        blocks: computed(() => blocksData.value),
        editingBlockIndex,
        editingBlockId: computed(() => {
          if (editingBlockIndex.value === null) return null;
          return blocksData.value[editingBlockIndex.value]?.id ?? null;
        }),
        updateBlock,
      });

      const { handleKeydown } = useKeyboardHandler(deps);
      const textarea = createMockTextarea(content, 4); // カーソルは'code'の先頭
      const event = createKeyboardEvent('Enter');
      Object.defineProperty(event, 'target', { value: textarea });

      handleKeydown(event, 'block-0', 0);

      // hasClosingBackticks = true なので、通常の改行処理
      const callArg = updateBlock.mock.calls[0]?.[1];
      expect(callArg).not.toBe('```\ncode\n```\n\n```'); // 完全構造追加ではない
    });
  });

  describe('Escape key', () => {
    it('should call stopEditing when Escape is pressed', () => {
      const stopEditing = vi.fn();
      const deps = createMockDeps({ stopEditing });

      const { handleKeydown } = useKeyboardHandler(deps);
      const textarea = createMockTextarea('some text');
      const event = createKeyboardEvent('Escape');
      Object.defineProperty(event, 'target', { value: textarea });

      handleKeydown(event, 'block-0', 0);

      expect(stopEditing).toHaveBeenCalled();
    });
  });

  describe('Undo/Redo', () => {
    it('should call undo on Cmd+Z', () => {
      const undo = vi.fn();
      const deps = createMockDeps({ undo });

      const { handleKeydown } = useKeyboardHandler(deps);
      const textarea = createMockTextarea('text');
      const event = createKeyboardEvent('z', { metaKey: true });
      Object.defineProperty(event, 'target', { value: textarea });
      vi.spyOn(event, 'preventDefault');

      handleKeydown(event, 'block-0', 0);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(undo).toHaveBeenCalled();
    });

    it('should call redo on Cmd+Shift+Z', () => {
      const redo = vi.fn();
      const deps = createMockDeps({ redo });

      const { handleKeydown } = useKeyboardHandler(deps);
      const textarea = createMockTextarea('text');
      const event = createKeyboardEvent('z', { metaKey: true, shiftKey: true });
      Object.defineProperty(event, 'target', { value: textarea });
      vi.spyOn(event, 'preventDefault');

      handleKeydown(event, 'block-0', 0);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(redo).toHaveBeenCalled();
    });
  });

  describe('Escape key in code block', () => {
    // Issue #2: コードブロック入力後、Escapeキーで編集終了できない
    it('should call stopEditing when Escape is pressed in code block', () => {
      const stopEditing = vi.fn();
      const codeBlockContent = '```javascript\nconst x = 1;\n```';
      const blocksData = ref<Block[]>([{ id: 'block-0', content: codeBlockContent }]);
      const editingBlockIndex = ref<number | null>(0);

      const deps = createMockDeps({
        blocks: computed(() => blocksData.value),
        editingBlockIndex,
        editingBlockId: computed(() => {
          if (editingBlockIndex.value === null) return null;
          return blocksData.value[editingBlockIndex.value]?.id ?? null;
        }),
        stopEditing,
      });

      const { handleKeydown } = useKeyboardHandler(deps);
      const textarea = createMockTextarea(codeBlockContent, 20);
      const event = createKeyboardEvent('Escape');
      Object.defineProperty(event, 'target', { value: textarea });

      handleKeydown(event, 'block-0', 0);

      expect(stopEditing).toHaveBeenCalled();
    });
  });

  describe('Enter key in nested list items', () => {
    // Issue #7: ネストされた空リスト項目でEnterを押すとリストが分割される
    // リスト項目で改行すると、updateBlockが呼ばれて同じブロック内に新しい行が追加される
    // 空のリスト項目の場合はemitが呼ばれてリストから抜ける

    it('should handle Enter on nested bullet list item with content', () => {
      const updateBlock = vi.fn();
      // ネストされたリスト: 親項目 + 子項目（内容あり）
      const content = '- Parent\n  - Child';
      const blocksData = ref<Block[]>([{ id: 'block-0', content }]);
      const editingBlockIndex = ref<number | null>(0);

      const deps = createMockDeps({
        blocks: computed(() => blocksData.value),
        editingBlockIndex,
        editingBlockId: computed(() => {
          if (editingBlockIndex.value === null) return null;
          return blocksData.value[editingBlockIndex.value]?.id ?? null;
        }),
        updateBlock,
      });

      const { handleKeydown } = useKeyboardHandler(deps);
      const cursorPos = content.length;
      const textarea = createMockTextarea(content, cursorPos);
      const event = createKeyboardEvent('Enter');
      Object.defineProperty(event, 'target', { value: textarea });
      vi.spyOn(event, 'preventDefault');

      handleKeydown(event, 'block-0', 0);

      expect(event.preventDefault).toHaveBeenCalled();
      // リスト項目で改行するとupdateBlockが呼ばれる
      expect(updateBlock).toHaveBeenCalled();
    });

    it('should handle Enter on nested checklist item with content', () => {
      const updateBlock = vi.fn();
      // ネストされたチェックリスト: 親項目 + 子項目（内容あり）
      const content = '- [ ] Parent\n  - [ ] Child task';
      const blocksData = ref<Block[]>([{ id: 'block-0', content }]);
      const editingBlockIndex = ref<number | null>(0);

      const deps = createMockDeps({
        blocks: computed(() => blocksData.value),
        editingBlockIndex,
        editingBlockId: computed(() => {
          if (editingBlockIndex.value === null) return null;
          return blocksData.value[editingBlockIndex.value]?.id ?? null;
        }),
        updateBlock,
      });

      const { handleKeydown } = useKeyboardHandler(deps);
      const cursorPos = content.length;
      const textarea = createMockTextarea(content, cursorPos);
      const event = createKeyboardEvent('Enter');
      Object.defineProperty(event, 'target', { value: textarea });
      vi.spyOn(event, 'preventDefault');

      handleKeydown(event, 'block-0', 0);

      expect(event.preventDefault).toHaveBeenCalled();
      // チェックリスト項目で改行するとupdateBlockが呼ばれる
      expect(updateBlock).toHaveBeenCalled();
    });

    it('should handle Enter on nested numbered list item with content', () => {
      const updateBlock = vi.fn();
      // ネストされた番号付きリスト
      const content = '1. Parent\n  1. Child';
      const blocksData = ref<Block[]>([{ id: 'block-0', content }]);
      const editingBlockIndex = ref<number | null>(0);

      const deps = createMockDeps({
        blocks: computed(() => blocksData.value),
        editingBlockIndex,
        editingBlockId: computed(() => {
          if (editingBlockIndex.value === null) return null;
          return blocksData.value[editingBlockIndex.value]?.id ?? null;
        }),
        updateBlock,
      });

      const { handleKeydown } = useKeyboardHandler(deps);
      const cursorPos = content.length;
      const textarea = createMockTextarea(content, cursorPos);
      const event = createKeyboardEvent('Enter');
      Object.defineProperty(event, 'target', { value: textarea });
      vi.spyOn(event, 'preventDefault');

      handleKeydown(event, 'block-0', 0);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(updateBlock).toHaveBeenCalled();
    });

    it('should handle Enter on nested blockquote with content', () => {
      const updateBlock = vi.fn();
      // ネストされた引用
      const content = '> Quote line 1\n> Quote line 2';
      const blocksData = ref<Block[]>([{ id: 'block-0', content }]);
      const editingBlockIndex = ref<number | null>(0);

      const deps = createMockDeps({
        blocks: computed(() => blocksData.value),
        editingBlockIndex,
        editingBlockId: computed(() => {
          if (editingBlockIndex.value === null) return null;
          return blocksData.value[editingBlockIndex.value]?.id ?? null;
        }),
        updateBlock,
      });

      const { handleKeydown } = useKeyboardHandler(deps);
      const cursorPos = content.length;
      const textarea = createMockTextarea(content, cursorPos);
      const event = createKeyboardEvent('Enter');
      Object.defineProperty(event, 'target', { value: textarea });
      vi.spyOn(event, 'preventDefault');

      handleKeydown(event, 'block-0', 0);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(updateBlock).toHaveBeenCalled();
    });

    it('should exit list when Enter on empty top-level bullet list item', () => {
      const emit = vi.fn();
      // トップレベルの空リスト項目
      const content = '- Item 1\n- ';
      const blocksData = ref<Block[]>([{ id: 'block-0', content }]);
      const editingBlockIndex = ref<number | null>(0);

      const deps = createMockDeps({
        blocks: computed(() => blocksData.value),
        editingBlockIndex,
        editingBlockId: computed(() => {
          if (editingBlockIndex.value === null) return null;
          return blocksData.value[editingBlockIndex.value]?.id ?? null;
        }),
        emit,
      });

      const { handleKeydown } = useKeyboardHandler(deps);
      const cursorPos = content.length;
      const textarea = createMockTextarea(content, cursorPos);
      const event = createKeyboardEvent('Enter');
      Object.defineProperty(event, 'target', { value: textarea });
      vi.spyOn(event, 'preventDefault');

      handleKeydown(event, 'block-0', 0);

      expect(event.preventDefault).toHaveBeenCalled();
      // 空のトップレベルリスト項目でEnterを押すとemitが呼ばれてリストから抜ける
      expect(emit).toHaveBeenCalled();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFormatToolbar } from '../useFormatToolbar';

describe('useFormatToolbar', () => {
  let mockTextarea: {
    value: string;
    selectionStart: number;
    selectionEnd: number;
    focus: ReturnType<typeof vi.fn>;
    setSelectionRange: ReturnType<typeof vi.fn>;
  };
  let getEditingBlockId: ReturnType<typeof vi.fn>;
  let getTextarea: ReturnType<typeof vi.fn>;
  let updateBlock: ReturnType<typeof vi.fn>;
  let adjustTextareaHeight: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTextarea = {
      value: '',
      selectionStart: 0,
      selectionEnd: 0,
      focus: vi.fn(),
      setSelectionRange: vi.fn(),
    };
    getEditingBlockId = vi.fn().mockReturnValue('block-1');
    getTextarea = vi.fn().mockReturnValue(mockTextarea);
    updateBlock = vi.fn();
    adjustTextareaHeight = vi.fn();
  });

  describe('applyFormat - headings', () => {
    it('should apply h1 format', () => {
      mockTextarea.value = 'Hello';
      mockTextarea.selectionStart = 0;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('h1');

      expect(updateBlock).toHaveBeenCalledWith('block-1', '# Hello');
    });

    it('should remove h1 format when already applied', () => {
      mockTextarea.value = '# Hello';
      mockTextarea.selectionStart = 2;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('h1');

      expect(updateBlock).toHaveBeenCalledWith('block-1', 'Hello');
    });

    it('should apply h2 format', () => {
      mockTextarea.value = 'Hello';
      mockTextarea.selectionStart = 0;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('h2');

      expect(updateBlock).toHaveBeenCalledWith('block-1', '## Hello');
    });

    it('should remove h2 format when already applied', () => {
      mockTextarea.value = '## Hello';
      mockTextarea.selectionStart = 3;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('h2');

      expect(updateBlock).toHaveBeenCalledWith('block-1', 'Hello');
    });

    it('should apply h3 format', () => {
      mockTextarea.value = 'Hello';
      mockTextarea.selectionStart = 0;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('h3');

      expect(updateBlock).toHaveBeenCalledWith('block-1', '### Hello');
    });

    it('should convert h1 to h2', () => {
      mockTextarea.value = '# Hello';
      mockTextarea.selectionStart = 2;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('h2');

      expect(updateBlock).toHaveBeenCalledWith('block-1', '## Hello');
    });
  });

  describe('applyFormat - inline formatting', () => {
    it('should apply bold to selected text', () => {
      mockTextarea.value = 'Hello World';
      mockTextarea.selectionStart = 0;
      mockTextarea.selectionEnd = 5;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('bold');

      expect(updateBlock).toHaveBeenCalledWith('block-1', '**Hello** World');
    });

    it('should insert bold markers when no selection', () => {
      mockTextarea.value = 'Hello';
      mockTextarea.selectionStart = 5;
      mockTextarea.selectionEnd = 5;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('bold');

      expect(updateBlock).toHaveBeenCalledWith('block-1', 'Hello****');
    });

    it('should apply italic to selected text', () => {
      mockTextarea.value = 'Hello World';
      mockTextarea.selectionStart = 0;
      mockTextarea.selectionEnd = 5;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('italic');

      expect(updateBlock).toHaveBeenCalledWith('block-1', '*Hello* World');
    });

    it('should insert italic markers when no selection', () => {
      mockTextarea.value = 'Hello';
      mockTextarea.selectionStart = 5;
      mockTextarea.selectionEnd = 5;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('italic');

      expect(updateBlock).toHaveBeenCalledWith('block-1', 'Hello**');
    });

    it('should apply inline code to selected text', () => {
      mockTextarea.value = 'Use function here';
      mockTextarea.selectionStart = 4;
      mockTextarea.selectionEnd = 12;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('code');

      expect(updateBlock).toHaveBeenCalledWith('block-1', 'Use `function` here');
    });

    it('should insert code markers when no selection', () => {
      mockTextarea.value = 'Hello';
      mockTextarea.selectionStart = 5;
      mockTextarea.selectionEnd = 5;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('code');

      expect(updateBlock).toHaveBeenCalledWith('block-1', 'Hello``');
    });
  });

  describe('applyFormat - code block', () => {
    it('should wrap content in code block', () => {
      mockTextarea.value = 'const x = 1';
      mockTextarea.selectionStart = 0;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('code-block');

      expect(updateBlock).toHaveBeenCalledWith('block-1', '```\nconst x = 1\n```');
    });
  });

  describe('applyFormat - lists', () => {
    it('should apply bullet list format', () => {
      mockTextarea.value = 'Item';
      mockTextarea.selectionStart = 0;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('bullet');

      expect(updateBlock).toHaveBeenCalledWith('block-1', '- Item');
    });

    it('should remove bullet list format when already applied', () => {
      mockTextarea.value = '- Item';
      mockTextarea.selectionStart = 2;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('bullet');

      expect(updateBlock).toHaveBeenCalledWith('block-1', 'Item');
    });

    it('should apply numbered list format', () => {
      mockTextarea.value = 'Item';
      mockTextarea.selectionStart = 0;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('numbered');

      expect(updateBlock).toHaveBeenCalledWith('block-1', '1. Item');
    });

    it('should remove numbered list format when already applied', () => {
      mockTextarea.value = '1. Item';
      mockTextarea.selectionStart = 3;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('numbered');

      expect(updateBlock).toHaveBeenCalledWith('block-1', 'Item');
    });

    it('should convert bullet to numbered list', () => {
      mockTextarea.value = '- Item';
      mockTextarea.selectionStart = 2;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('numbered');

      expect(updateBlock).toHaveBeenCalledWith('block-1', '1. Item');
    });
  });

  describe('applyFormat - checklist', () => {
    it('should apply checklist format', () => {
      mockTextarea.value = 'Todo item';
      mockTextarea.selectionStart = 0;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('checklist');

      expect(updateBlock).toHaveBeenCalledWith('block-1', '- [ ] Todo item');
    });

    it('should remove checklist format when already applied', () => {
      mockTextarea.value = '- [ ] Todo item';
      mockTextarea.selectionStart = 6;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('checklist');

      expect(updateBlock).toHaveBeenCalledWith('block-1', 'Todo item');
    });

    it('should convert bullet to checklist', () => {
      mockTextarea.value = '- Item';
      mockTextarea.selectionStart = 2;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('checklist');

      expect(updateBlock).toHaveBeenCalledWith('block-1', '- [ ] Item');
    });
  });

  describe('applyFormat - quote', () => {
    it('should apply quote format', () => {
      mockTextarea.value = 'Some text';
      mockTextarea.selectionStart = 0;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('quote');

      expect(updateBlock).toHaveBeenCalledWith('block-1', '> Some text');
    });

    it('should remove quote format when already applied', () => {
      mockTextarea.value = '> Some text';
      mockTextarea.selectionStart = 2;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('quote');

      expect(updateBlock).toHaveBeenCalledWith('block-1', 'Some text');
    });
  });

  describe('applyFormat - table', () => {
    it('should insert table command', () => {
      mockTextarea.value = '';
      mockTextarea.selectionStart = 0;

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('table');

      expect(updateBlock).toHaveBeenCalledWith('block-1', '/table 3 3');
    });
  });

  describe('edge cases', () => {
    it('should do nothing when no block is being edited', () => {
      getEditingBlockId.mockReturnValue(null);

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('bold');

      expect(updateBlock).not.toHaveBeenCalled();
    });

    it('should do nothing when textarea is not found', () => {
      getTextarea.mockReturnValue(null);

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('bold');

      expect(updateBlock).not.toHaveBeenCalled();
    });

    it('should do nothing for unknown format', () => {
      mockTextarea.value = 'Text';

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );
      applyFormat('unknown-format');

      expect(updateBlock).not.toHaveBeenCalled();
    });
  });
});

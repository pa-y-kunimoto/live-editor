import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMarkdownDocument } from '../useMarkdownDocument';

// Mock clipboard
const mockClipboard = {
  writeText: vi.fn(),
};
vi.stubGlobal('navigator', {
  clipboard: mockClipboard,
});

describe('useMarkdownDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty content', () => {
      const { markdownContent } = useMarkdownDocument();
      expect(markdownContent.value).toBe('');
    });

    it('should initialize with notification hidden', () => {
      const { showCopyNotification } = useMarkdownDocument();
      expect(showCopyNotification.value).toBe(false);
    });
  });

  describe('setContent', () => {
    it('should set content correctly', () => {
      const { markdownContent, setContent } = useMarkdownDocument();
      setContent('# Test Content');
      expect(markdownContent.value).toBe('# Test Content');
    });
  });

  describe('formatMarkdownForCopy', () => {
    it('should add blank line before heading', () => {
      const { formatMarkdownForCopy } = useMarkdownDocument();

      const result = formatMarkdownForCopy('Some text\n# Heading');

      expect(result).toBe('Some text\n\n# Heading');
    });

    it('should add blank line after heading', () => {
      const { formatMarkdownForCopy } = useMarkdownDocument();

      const result = formatMarkdownForCopy('# Heading\nSome text');

      expect(result).toBe('# Heading\n\nSome text');
    });

    it('should add blank line before list', () => {
      const { formatMarkdownForCopy } = useMarkdownDocument();

      const result = formatMarkdownForCopy('Some text\n- Item 1');

      expect(result).toBe('Some text\n\n- Item 1');
    });

    it('should add blank line after list', () => {
      const { formatMarkdownForCopy } = useMarkdownDocument();

      const result = formatMarkdownForCopy('- Item 1\nSome text');

      expect(result).toBe('- Item 1\n\nSome text');
    });

    it('should not add blank line between consecutive list items', () => {
      const { formatMarkdownForCopy } = useMarkdownDocument();

      const result = formatMarkdownForCopy('- Item 1\n- Item 2\n- Item 3');

      expect(result).toBe('- Item 1\n- Item 2\n- Item 3');
    });

    it('should add blank line before code block', () => {
      const { formatMarkdownForCopy } = useMarkdownDocument();

      const result = formatMarkdownForCopy('Some text\n```js\ncode\n```');

      // The actual implementation adds blank line after closing ``` too
      expect(result).toContain('Some text\n\n```js');
    });

    it('should add blank line before blockquote', () => {
      const { formatMarkdownForCopy } = useMarkdownDocument();

      const result = formatMarkdownForCopy('Some text\n> Quote');

      expect(result).toBe('Some text\n\n> Quote');
    });

    it('should add blank line after blockquote', () => {
      const { formatMarkdownForCopy } = useMarkdownDocument();

      const result = formatMarkdownForCopy('> Quote\nSome text');

      expect(result).toBe('> Quote\n\nSome text');
    });

    it('should add blank line before table', () => {
      const { formatMarkdownForCopy } = useMarkdownDocument();

      const result = formatMarkdownForCopy('Some text\n| A | B |');

      expect(result).toBe('Some text\n\n| A | B |');
    });

    it('should add blank line after table', () => {
      const { formatMarkdownForCopy } = useMarkdownDocument();

      const result = formatMarkdownForCopy('| A | B |\nSome text');

      expect(result).toBe('| A | B |\n\nSome text');
    });

    it('should not add extra blank lines when already present', () => {
      const { formatMarkdownForCopy } = useMarkdownDocument();

      const result = formatMarkdownForCopy('Some text\n\n# Heading');

      expect(result).toBe('Some text\n\n# Heading');
    });

    it('should handle numbered lists', () => {
      const { formatMarkdownForCopy } = useMarkdownDocument();

      const result = formatMarkdownForCopy('Text\n1. First\n2. Second\nMore text');

      expect(result).toContain('\n\n1. First');
      expect(result).toContain('2. Second\n\n');
    });

    it('should handle empty content', () => {
      const { formatMarkdownForCopy } = useMarkdownDocument();

      const result = formatMarkdownForCopy('');

      expect(result).toBe('');
    });
  });

  describe('copyToClipboard', () => {
    it('should copy formatted content to clipboard', async () => {
      const { copyToClipboard, setContent } = useMarkdownDocument();
      setContent('# Test');

      await copyToClipboard();

      expect(mockClipboard.writeText).toHaveBeenCalledWith('# Test');
    });

    it('should show notification after copy', async () => {
      const { showCopyNotification, copyToClipboard, setContent } = useMarkdownDocument();
      setContent('Test');

      await copyToClipboard();

      expect(showCopyNotification.value).toBe(true);
    });

    it('should hide notification after 2 seconds', async () => {
      vi.useFakeTimers();

      const { showCopyNotification, copyToClipboard, setContent } = useMarkdownDocument();
      setContent('Test');

      await copyToClipboard();
      expect(showCopyNotification.value).toBe(true);

      vi.advanceTimersByTime(2000);
      expect(showCopyNotification.value).toBe(false);

      vi.useRealTimers();
    });

    it('should handle clipboard error gracefully', async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error('Clipboard error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { showCopyNotification, copyToClipboard, setContent } = useMarkdownDocument();
      setContent('Test');

      await copyToClipboard();

      expect(showCopyNotification.value).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});

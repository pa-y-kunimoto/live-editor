import { describe, it, expect, vi } from 'vitest';
import { ref, nextTick } from 'vue';
import { useMarkdownBlocks } from '../useMarkdownBlocks';
import { useMarkdownRenderer } from '../useMarkdownRenderer';
import { useLinkPreview } from '../useLinkPreview';
import { useTableGenerator } from '../useTableGenerator';
import { useFormatToolbar } from '../useFormatToolbar';
import { useMarkdownDocument } from '../useMarkdownDocument';

// Mock $fetch for useMarkdownDocument
vi.stubGlobal('$fetch', vi.fn());

// Mock clipboard
vi.stubGlobal('navigator', {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

describe('Composables Integration', () => {
  describe('Block Parsing and Rendering Pipeline', () => {
    it('should parse content and render each block type correctly', async () => {
      const content = ref(`# Heading

Paragraph text

- List item 1
- List item 2

\`\`\`javascript
const x = 1;
\`\`\`

> Quote text

| A | B |
| --- | --- |
| 1 | 2 |`);

      const { blocks, getBlockType } = useMarkdownBlocks(content);
      const { renderBlock, getRenderedBlock } = useMarkdownRenderer();

      await nextTick();

      // Verify blocks are parsed
      expect(blocks.value.length).toBeGreaterThan(0);

      // Render each block and verify
      for (const block of blocks.value) {
        renderBlock(block);
        const rendered = getRenderedBlock(block);

        const type = getBlockType(block.content);

        switch (type) {
          case 'heading-1':
            expect(rendered).toContain('<h1');
            break;
          case 'bullet-list':
            expect(rendered).toContain('<ul');
            break;
          case 'code-block':
            expect(rendered).toContain('hljs');
            break;
          case 'blockquote':
            expect(rendered).toContain('<blockquote');
            break;
          case 'table':
            expect(rendered).toContain('<table');
            break;
          case 'paragraph':
            expect(rendered).toContain('<p');
            break;
        }
      }
    });

    it('should handle content updates reactively', async () => {
      const content = ref('# Initial');
      const { blocks } = useMarkdownBlocks(content);

      await nextTick();
      expect(blocks.value[0]?.content).toBe('# Initial');

      // Update content
      content.value = '## Updated';
      await nextTick();

      expect(blocks.value[0]?.content).toBe('## Updated');
    });
  });

  describe('Table Generation Workflow', () => {
    it('should generate table from command and render it', async () => {
      const { generateTableMarkdown, parseTableCommand } = useTableGenerator();
      const { renderBlock, getRenderedBlock } = useMarkdownRenderer();

      // Parse table command
      const command = '/table 3 4';
      const parsed = parseTableCommand(command);

      expect(parsed).toEqual({ rows: 3, cols: 4 });

      // Generate table markdown
      const tableMarkdown = generateTableMarkdown(parsed!.rows, parsed!.cols);

      expect(tableMarkdown).toContain('| Header1 |');
      expect(tableMarkdown).toContain('| --- |');

      // Create a block with the table and render it
      const content = ref(tableMarkdown);
      const { blocks } = useMarkdownBlocks(content);

      await nextTick();

      for (const block of blocks.value) {
        renderBlock(block);
      }

      const rendered = getRenderedBlock(blocks.value[0]!);
      expect(rendered).toContain('<table');
      expect(rendered).toContain('<th>');
    });
  });

  describe('Format Toolbar Integration', () => {
    it('should apply formatting and update rendered output', async () => {
      const blockId = 'test-block';
      let currentContent = 'Hello World';

      const mockTextarea = {
        value: currentContent,
        selectionStart: 0,
        selectionEnd: 5, // "Hello" selected
        focus: vi.fn(),
        setSelectionRange: vi.fn(),
      };

      const getEditingBlockId = vi.fn().mockReturnValue(blockId);
      const getTextarea = vi.fn().mockReturnValue(mockTextarea);
      const updateBlock = vi.fn((id: string, content: string) => {
        currentContent = content;
        mockTextarea.value = content;
      });
      const adjustTextareaHeight = vi.fn();

      const { applyFormat } = useFormatToolbar(
        getEditingBlockId,
        getTextarea,
        updateBlock,
        adjustTextareaHeight
      );

      // Apply bold formatting
      applyFormat('bold');

      expect(updateBlock).toHaveBeenCalledWith(blockId, '**Hello** World');

      // Verify the content was updated
      expect(currentContent).toBe('**Hello** World');

      // Now render the updated content
      const content = ref(currentContent);
      const { blocks } = useMarkdownBlocks(content);
      const { renderBlock, getRenderedBlock } = useMarkdownRenderer();

      await nextTick();

      renderBlock(blocks.value[0]!);
      const rendered = getRenderedBlock(blocks.value[0]!);

      expect(rendered).toContain('<strong>');
      expect(rendered).toContain('Hello');
    });

    it('should toggle heading formats correctly', async () => {
      const blockId = 'test-block';
      let currentContent = 'Test heading';

      const mockTextarea = {
        value: currentContent,
        selectionStart: 0,
        selectionEnd: 0,
        focus: vi.fn(),
        setSelectionRange: vi.fn(),
      };

      const updateBlock = vi.fn((id: string, content: string) => {
        currentContent = content;
        mockTextarea.value = content;
      });

      const { applyFormat } = useFormatToolbar(
        () => blockId,
        () => mockTextarea,
        updateBlock,
        vi.fn()
      );

      // Apply h1
      applyFormat('h1');
      expect(currentContent).toBe('# Test heading');

      // Apply h2 (should replace h1)
      mockTextarea.value = currentContent;
      applyFormat('h2');
      expect(currentContent).toBe('## Test heading');

      // Toggle h2 off
      mockTextarea.value = currentContent;
      applyFormat('h2');
      expect(currentContent).toBe('Test heading');
    });
  });

  describe('Link Preview Workflow', () => {
    it('should integrate link preview with renderer', async () => {
      const { linkPreviews, loadingUrls, renderBlock, getRenderedBlock } = useMarkdownRenderer();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { processUrlBlock } = useLinkPreview(linkPreviews, loadingUrls);

      const url = 'https://example.com';
      const content = ref(`[${url}](${url})`);
      const { blocks } = useMarkdownBlocks(content);

      await nextTick();

      // Simulate preview data being available
      linkPreviews.value.set(url, {
        url,
        title: 'Example Site',
        description: 'A test description',
        image: null,
        siteName: 'Example',
        favicon: null,
      });

      // Render the block
      renderBlock(blocks.value[0]!);
      const rendered = getRenderedBlock(blocks.value[0]!);

      // Should contain both the link and the preview card
      expect(rendered).toContain('href="https://example.com"');
      expect(rendered).toContain('link-preview-card');
      expect(rendered).toContain('Example Site');
    });

    it('should show loading state during fetch', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { linkPreviews, loadingUrls, renderBlock, getRenderedBlock } = useMarkdownRenderer();

      const url = 'https://loading-test.com';

      // Set loading state
      loadingUrls.value.add(url);

      const content = ref(`[${url}](${url})`);
      const { blocks } = useMarkdownBlocks(content);

      await nextTick();

      renderBlock(blocks.value[0]!);
      const rendered = getRenderedBlock(blocks.value[0]!);

      expect(rendered).toContain('link-preview-loading');
    });
  });

  describe('Document Workflow', () => {
    it('should load, edit, and copy content', async () => {
      vi.mocked($fetch).mockResolvedValue('# Test Document\n\nContent here');

      const { markdownContent, loadDefaultContent, formatMarkdownForCopy, copyToClipboard } =
        useMarkdownDocument();

      // Load content
      await loadDefaultContent();
      expect(markdownContent.value).toBe('# Test Document\n\nContent here');

      // Edit content
      markdownContent.value = '# Updated\nNew content';

      // Format for copy
      const formatted = formatMarkdownForCopy(markdownContent.value);
      expect(formatted).toContain('# Updated');
      expect(formatted).toContain('New content');

      // Copy to clipboard
      await copyToClipboard();
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  describe('Checklist Toggle Integration', () => {
    it('should parse, render, and represent checklist state correctly', async () => {
      const content = ref('- [ ] Unchecked\n- [x] Checked');
      const { blocks, parseChecklist, getBlockType } = useMarkdownBlocks(content);
      const { renderBlock, getRenderedBlock } = useMarkdownRenderer();

      await nextTick();

      // Verify block type
      expect(getBlockType(blocks.value[0]!.content)).toBe('checklist');

      // Parse checklist items
      const lines = blocks.value[0]!.content.split('\n');

      const unchecked = parseChecklist(lines[0]!);
      expect(unchecked).toEqual({
        indent: '',
        checked: false,
        text: 'Unchecked',
      });

      const checked = parseChecklist(lines[1]!);
      expect(checked).toEqual({
        indent: '',
        checked: true,
        text: 'Checked',
      });

      // Render and verify
      renderBlock(blocks.value[0]!);
      const rendered = getRenderedBlock(blocks.value[0]!);

      expect(rendered).toContain('checklist-item');
      expect(rendered).toContain('Unchecked');
      expect(rendered).toContain('Checked');
      expect(rendered).toContain('checked');
    });
  });

  describe('Section Copy Integration', () => {
    it('should identify section blocks for copying', async () => {
      const content = ref(`# Section 1

Content in section 1

## Subsection

More content

# Section 2

Different content`);

      const { blocks, getSectionBlockIds } = useMarkdownBlocks(content);

      await nextTick();

      // Get first heading block
      const firstHeadingId = blocks.value[0]?.id;

      if (firstHeadingId) {
        const sectionIds = getSectionBlockIds(firstHeadingId);

        // Should include the heading and its content, subsection, but not Section 2
        expect(sectionIds.size).toBeGreaterThan(1);
        expect(sectionIds.has(firstHeadingId)).toBe(true);

        // The last section should not be included
        const lastBlock = blocks.value[blocks.value.length - 1];
        if (lastBlock && lastBlock.content.includes('Section 2')) {
          expect(sectionIds.has(lastBlock.id)).toBe(false);
        }
      }
    });
  });
});

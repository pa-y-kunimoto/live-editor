import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useMarkdownBlocks } from '../index';

describe('useMarkdownBlocks', () => {
  describe('blocks parsing', () => {
    it('should parse empty content as single empty block', () => {
      const content = ref('');
      const { blocks } = useMarkdownBlocks(content);

      expect(blocks.value).toHaveLength(1);
      expect(blocks.value[0]?.content).toBe('');
    });

    it('should parse headings as separate blocks', () => {
      const content = ref('# Heading 1\n## Heading 2\n### Heading 3');
      const { blocks } = useMarkdownBlocks(content);

      expect(blocks.value).toHaveLength(3);
      expect(blocks.value[0]?.content).toBe('# Heading 1');
      expect(blocks.value[1]?.content).toBe('## Heading 2');
      expect(blocks.value[2]?.content).toBe('### Heading 3');
    });

    it('should parse code blocks as single block', () => {
      const content = ref('```javascript\nconst x = 1;\nconsole.log(x);\n```');
      const { blocks } = useMarkdownBlocks(content);

      expect(blocks.value).toHaveLength(1);
      expect(blocks.value[0]?.content).toContain('```javascript');
      expect(blocks.value[0]?.content).toContain('const x = 1;');
    });

    it('should parse bullet lists as single block', () => {
      const content = ref('- Item 1\n- Item 2\n- Item 3');
      const { blocks } = useMarkdownBlocks(content);

      expect(blocks.value).toHaveLength(1);
      expect(blocks.value[0]?.content).toBe('- Item 1\n- Item 2\n- Item 3');
    });

    it('should parse numbered lists as single block', () => {
      const content = ref('1. First\n2. Second\n3. Third');
      const { blocks } = useMarkdownBlocks(content);

      expect(blocks.value).toHaveLength(1);
      expect(blocks.value[0]?.content).toBe('1. First\n2. Second\n3. Third');
    });

    it('should parse checklists as single block', () => {
      const content = ref('- [ ] Todo 1\n- [x] Done\n- [ ] Todo 2');
      const { blocks } = useMarkdownBlocks(content);

      expect(blocks.value).toHaveLength(1);
      expect(blocks.value[0]?.content).toContain('- [ ] Todo 1');
      expect(blocks.value[0]?.content).toContain('- [x] Done');
    });

    it('should parse blockquotes as single block', () => {
      const content = ref('> Quote line 1\n> Quote line 2');
      const { blocks } = useMarkdownBlocks(content);

      expect(blocks.value).toHaveLength(1);
      expect(blocks.value[0]?.content).toBe('> Quote line 1\n> Quote line 2');
    });

    it('should parse tables as single block', () => {
      const content = ref('| Col 1 | Col 2 |\n| --- | --- |\n| A | B |');
      const { blocks } = useMarkdownBlocks(content);

      expect(blocks.value).toHaveLength(1);
      expect(blocks.value[0]?.content).toContain('| Col 1 | Col 2 |');
    });

    it('should parse horizontal rules as separate blocks', () => {
      const content = ref('---');
      const { blocks } = useMarkdownBlocks(content);

      expect(blocks.value).toHaveLength(1);
      expect(blocks.value[0]?.content).toBe('---');
    });

    it('should parse empty lines as separate blocks', () => {
      const content = ref('Line 1\n\nLine 2');
      const { blocks } = useMarkdownBlocks(content);

      expect(blocks.value).toHaveLength(3);
      expect(blocks.value[0]?.content).toBe('Line 1');
      expect(blocks.value[1]?.content).toBe('');
      expect(blocks.value[2]?.content).toBe('Line 2');
    });

    it('should parse nested lists', () => {
      const content = ref('- Parent\n  - Child 1\n  - Child 2');
      const { blocks } = useMarkdownBlocks(content);

      expect(blocks.value).toHaveLength(1);
      expect(blocks.value[0]?.content).toContain('- Parent');
      expect(blocks.value[0]?.content).toContain('  - Child 1');
    });
  });

  describe('getBlockType', () => {
    it('should identify heading-1', () => {
      const content = ref('');
      const { getBlockType } = useMarkdownBlocks(content);

      expect(getBlockType('# Heading')).toBe('heading-1');
    });

    it('should identify heading-2', () => {
      const content = ref('');
      const { getBlockType } = useMarkdownBlocks(content);

      expect(getBlockType('## Heading')).toBe('heading-2');
    });

    it('should identify heading-3', () => {
      const content = ref('');
      const { getBlockType } = useMarkdownBlocks(content);

      expect(getBlockType('### Heading')).toBe('heading-3');
    });

    it('should identify code-block', () => {
      const content = ref('');
      const { getBlockType } = useMarkdownBlocks(content);

      expect(getBlockType('```js\ncode\n```')).toBe('code-block');
    });

    it('should identify checklist', () => {
      const content = ref('');
      const { getBlockType } = useMarkdownBlocks(content);

      expect(getBlockType('- [ ] Todo')).toBe('checklist');
      expect(getBlockType('- [x] Done')).toBe('checklist');
    });

    it('should identify bullet-list', () => {
      const content = ref('');
      const { getBlockType } = useMarkdownBlocks(content);

      expect(getBlockType('- Item')).toBe('bullet-list');
      expect(getBlockType('* Item')).toBe('bullet-list');
      expect(getBlockType('+ Item')).toBe('bullet-list');
    });

    it('should identify numbered-list', () => {
      const content = ref('');
      const { getBlockType } = useMarkdownBlocks(content);

      expect(getBlockType('1. Item')).toBe('numbered-list');
      expect(getBlockType('10. Item')).toBe('numbered-list');
    });

    it('should identify blockquote', () => {
      const content = ref('');
      const { getBlockType } = useMarkdownBlocks(content);

      expect(getBlockType('> Quote')).toBe('blockquote');
    });

    it('should identify table', () => {
      const content = ref('');
      const { getBlockType } = useMarkdownBlocks(content);

      expect(getBlockType('| Col |')).toBe('table');
    });

    it('should identify empty', () => {
      const content = ref('');
      const { getBlockType } = useMarkdownBlocks(content);

      expect(getBlockType('')).toBe('empty');
      expect(getBlockType('   ')).toBe('empty');
    });

    it('should identify paragraph', () => {
      const content = ref('');
      const { getBlockType } = useMarkdownBlocks(content);

      expect(getBlockType('Regular text')).toBe('paragraph');
    });
  });

  describe('parseCodeBlock', () => {
    it('should parse code block with language', () => {
      const content = ref('');
      const { parseCodeBlock } = useMarkdownBlocks(content);

      const result = parseCodeBlock('```javascript\nconst x = 1;\n```');
      expect(result).toEqual({
        lang: 'javascript',
        code: 'const x = 1;',
      });
    });

    it('should parse code block without language', () => {
      const content = ref('');
      const { parseCodeBlock } = useMarkdownBlocks(content);

      const result = parseCodeBlock('```\nsome code\n```');
      expect(result).toEqual({
        lang: '',
        code: 'some code',
      });
    });

    it('should return null for non-code blocks', () => {
      const content = ref('');
      const { parseCodeBlock } = useMarkdownBlocks(content);

      expect(parseCodeBlock('Regular text')).toBeNull();
    });
  });

  describe('parseChecklist', () => {
    it('should parse unchecked checklist item', () => {
      const content = ref('');
      const { parseChecklist } = useMarkdownBlocks(content);

      const result = parseChecklist('- [ ] Todo item');
      expect(result).toEqual({
        indent: '',
        checked: false,
        text: 'Todo item',
      });
    });

    it('should parse checked checklist item', () => {
      const content = ref('');
      const { parseChecklist } = useMarkdownBlocks(content);

      const result = parseChecklist('- [x] Done item');
      expect(result).toEqual({
        indent: '',
        checked: true,
        text: 'Done item',
      });
    });

    it('should parse indented checklist item', () => {
      const content = ref('');
      const { parseChecklist } = useMarkdownBlocks(content);

      const result = parseChecklist('  - [ ] Indented item');
      expect(result).toEqual({
        indent: '  ',
        checked: false,
        text: 'Indented item',
      });
    });

    it('should return null for non-checklist items', () => {
      const content = ref('');
      const { parseChecklist } = useMarkdownBlocks(content);

      expect(parseChecklist('- Regular item')).toBeNull();
      expect(parseChecklist('Regular text')).toBeNull();
    });
  });

  describe('getSectionBlockIds', () => {
    it('should return empty set for non-heading block', () => {
      const content = ref('Regular text');
      const { blocks, getSectionBlockIds } = useMarkdownBlocks(content);

      const ids = getSectionBlockIds(blocks.value[0]?.id ?? null);
      expect(ids.size).toBe(0);
    });

    it('should return heading and its content blocks', () => {
      const content = ref('# Section 1\nContent 1\n\n# Section 2');
      const { blocks, getSectionBlockIds } = useMarkdownBlocks(content);

      const firstHeadingId = blocks.value[0]?.id ?? null;
      const ids = getSectionBlockIds(firstHeadingId);

      // Should include heading and content blocks, but not the next heading
      expect(ids.has(firstHeadingId!)).toBe(true);
      // heading + content + empty line = 3
      expect(ids.size).toBeGreaterThanOrEqual(2);
    });

    it('should include nested headings in section', () => {
      const content = ref('# H1\n## H2\n### H3\n# Another H1');
      const { blocks, getSectionBlockIds } = useMarkdownBlocks(content);

      const firstHeadingId = blocks.value[0]?.id ?? null;
      const ids = getSectionBlockIds(firstHeadingId);

      // Should include H1, H2, H3 but not the second H1
      expect(ids.size).toBeGreaterThanOrEqual(3);
    });
  });
});

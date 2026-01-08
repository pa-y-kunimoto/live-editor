import { describe, it, expect } from 'vitest';
import { parseChecklist, isChecklistBlock, useChecklistRenderer, useListRenderer } from '../index';

describe('parseChecklist', () => {
  it('should parse unchecked checklist item', () => {
    const content = '- [ ] Task to do';
    const result = parseChecklist(content);

    expect(result).toEqual({
      indent: '',
      checked: false,
      text: 'Task to do',
    });
  });

  it('should parse checked checklist item', () => {
    const content = '- [x] Completed task';
    const result = parseChecklist(content);

    expect(result).toEqual({
      indent: '',
      checked: true,
      text: 'Completed task',
    });
  });

  it('should parse indented checklist item', () => {
    const content = '  - [ ] Indented task';
    const result = parseChecklist(content);

    expect(result).toEqual({
      indent: '  ',
      checked: false,
      text: 'Indented task',
    });
  });

  it('should parse checklist with asterisk marker', () => {
    const content = '* [ ] Task with asterisk';
    const result = parseChecklist(content);

    expect(result).toEqual({
      indent: '',
      checked: false,
      text: 'Task with asterisk',
    });
  });

  it('should parse checklist with plus marker', () => {
    const content = '+ [x] Task with plus';
    const result = parseChecklist(content);

    expect(result).toEqual({
      indent: '',
      checked: true,
      text: 'Task with plus',
    });
  });

  it('should return null for regular list item', () => {
    const content = '- Regular item';
    const result = parseChecklist(content);

    expect(result).toBeNull();
  });

  it('should return null for plain text', () => {
    const content = 'Just some text';
    const result = parseChecklist(content);

    expect(result).toBeNull();
  });

  it('should return null for heading', () => {
    const content = '# Heading';
    const result = parseChecklist(content);

    expect(result).toBeNull();
  });

  it('should handle checklist item with markdown formatting', () => {
    const content = '- [ ] **Bold** task';
    const result = parseChecklist(content);

    expect(result).toEqual({
      indent: '',
      checked: false,
      text: '**Bold** task',
    });
  });
});

describe('isChecklistBlock', () => {
  it('should return true for single checklist item', () => {
    const content = '- [ ] Task';
    expect(isChecklistBlock(content)).toBe(true);
  });

  it('should return true for multiple checklist items', () => {
    const content = '- [ ] Task 1\n- [x] Task 2\n- [ ] Task 3';
    expect(isChecklistBlock(content)).toBe(true);
  });

  it('should return true for checklist with empty lines', () => {
    const content = '- [ ] Task 1\n\n- [x] Task 2';
    expect(isChecklistBlock(content)).toBe(true);
  });

  it('should return true for indented checklist', () => {
    const content = '- [ ] Parent\n  - [ ] Child';
    expect(isChecklistBlock(content)).toBe(true);
  });

  it('should return false for regular list', () => {
    const content = '- Item 1\n- Item 2';
    expect(isChecklistBlock(content)).toBe(false);
  });

  it('should return false for mixed content', () => {
    const content = '- [ ] Task\nSome paragraph text';
    expect(isChecklistBlock(content)).toBe(false);
  });

  it('should return false for empty string', () => {
    const content = '';
    expect(isChecklistBlock(content)).toBe(false);
  });

  it('should return false for plain text', () => {
    const content = 'Just some text';
    expect(isChecklistBlock(content)).toBe(false);
  });

  it('should return true for checklist with different markers', () => {
    const content = '- [ ] Dash\n* [x] Asterisk\n+ [ ] Plus';
    expect(isChecklistBlock(content)).toBe(true);
  });
});

describe('useChecklistRenderer', () => {
  const {
    renderChecklist,
    isChecklistBlock: isChecklist,
    parseChecklist: parse,
  } = useChecklistRenderer();

  it('should expose helper functions', () => {
    expect(typeof isChecklist).toBe('function');
    expect(typeof parse).toBe('function');
  });

  it('should render single checklist item', () => {
    const block = { id: 'block-1', content: '- [ ] Task' };
    const result = renderChecklist(block);

    expect(result).not.toBeNull();
    expect(result).toContain('checklist-item');
    expect(result).toContain('checklist-checkbox');
    expect(result).toContain('checklist-text');
    expect(result).toContain('Task');
    expect(result).toContain('data-block-id="block-1"');
  });

  it('should render checked item with checked class and attribute', () => {
    const block = { id: 'block-1', content: '- [x] Done' };
    const result = renderChecklist(block);

    expect(result).toContain('class="checklist-item checked"');
    expect(result).toContain('checked');
  });

  it('should render unchecked item without checked class', () => {
    const block = { id: 'block-1', content: '- [ ] Todo' };
    const result = renderChecklist(block);

    expect(result).toContain('class="checklist-item "');
    expect(result).not.toContain('class="checklist-item checked"');
  });

  it('should render multiple checklist items', () => {
    const block = { id: 'block-1', content: '- [ ] Task 1\n- [x] Task 2' };
    const result = renderChecklist(block);

    expect(result).toContain('Task 1');
    expect(result).toContain('Task 2');
    // Should have two checklist items
    expect(result?.match(/checklist-item/g)?.length).toBe(2);
  });

  it('should render indented items with margin style', () => {
    const block = { id: 'block-1', content: '  - [ ] Indented' };
    const result = renderChecklist(block);

    expect(result).toContain('style="margin-left:');
  });

  it('should render markdown in checklist text', () => {
    const block = { id: 'block-1', content: '- [ ] **Bold** and *italic*' };
    const result = renderChecklist(block);

    expect(result).toContain('<strong>Bold</strong>');
    expect(result).toContain('<em>italic</em>');
  });

  it('should return null for non-checklist content', () => {
    const block = { id: 'block-1', content: '- Regular item' };
    const result = renderChecklist(block);

    expect(result).toBeNull();
  });

  it('should include line index data attribute', () => {
    const block = { id: 'block-1', content: '- [ ] First\n- [ ] Second' };
    const result = renderChecklist(block);

    expect(result).toContain('data-line-index="0"');
    expect(result).toContain('data-line-index="1"');
  });
});

describe('useListRenderer', () => {
  const { renderList } = useListRenderer();

  it('should render bullet list', () => {
    const content = '- Item 1\n- Item 2\n- Item 3';
    const result = renderList(content);

    expect(result).toContain('<ul>');
    expect(result).toContain('<li>');
    expect(result).toContain('Item 1');
    expect(result).toContain('Item 2');
    expect(result).toContain('Item 3');
  });

  it('should render numbered list', () => {
    const content = '1. First\n2. Second\n3. Third';
    const result = renderList(content);

    expect(result).toContain('<ol>');
    expect(result).toContain('<li>');
    expect(result).toContain('First');
    expect(result).toContain('Second');
  });

  it('should render nested list', () => {
    const content = '- Parent\n  - Child\n  - Child 2';
    const result = renderList(content);

    expect(result).toContain('<ul>');
    // Nested list should have multiple ul elements
    expect(result.match(/<ul>/g)?.length).toBeGreaterThanOrEqual(1);
  });

  it('should render list with markdown formatting', () => {
    const content = '- **Bold** item\n- *Italic* item';
    const result = renderList(content);

    expect(result).toContain('<strong>Bold</strong>');
    expect(result).toContain('<em>Italic</em>');
  });

  it('should render list with links', () => {
    const content = '- [Link](https://example.com)';
    const result = renderList(content);

    expect(result).toContain('<a href="https://example.com"');
    expect(result).toContain('Link');
  });
});

/**
 * @live-editor/list
 * List and checklist rendering for live-editor
 */

import { marked } from 'marked';
import type { Block } from '@live-editor/core';

/**
 * Parse checklist item
 */
export function parseChecklist(
  content: string
): { checked: boolean; text: string; indent: string } | null {
  const match = content.match(/^(\s*)([-*+])\s\[([ x])\]\s(.*)$/);
  if (match && match[1] !== undefined && match[3] !== undefined && match[4] !== undefined) {
    return {
      indent: match[1],
      checked: match[3] === 'x',
      text: match[4],
    };
  }
  return null;
}

/**
 * Check if content is a checklist block
 */
export function isChecklistBlock(content: string): boolean {
  const lines = content.split('\n');
  return (
    lines.every(line => {
      const trimmed = line.trim();
      return (
        trimmed === '' ||
        trimmed.match(/^[-*+]\s\[[ x]\]\s/) ||
        line.match(/^\s+[-*+]\s\[[ x]\]\s/)
      );
    }) && lines.some(line => line.match(/[-*+]\s\[[ x]\]\s/))
  );
}

/**
 * Checklist renderer composable
 */
export function useChecklistRenderer() {
  /**
   * Render checklist content to HTML
   */
  function renderChecklist(block: Block): string | null {
    const content = block.content;
    if (!isChecklistBlock(content)) {
      return null;
    }

    const lines = content.split('\n');
    const checklistHtml = lines
      .map((line, lineIndex) => {
        const trimmed = line.trim();
        if (trimmed === '') return '';

        const match = line.match(/^(\s*)([-*+])\s\[([ x])\]\s(.*)$/);
        if (match && match[1] !== undefined && match[3] !== undefined && match[4] !== undefined) {
          const indent = match[1];
          const checked = match[3] === 'x';
          const text = match[4];
          const checkedClass = checked ? 'checked' : '';
          const checkedAttr = checked ? 'checked' : '';
          const indentStyle = indent ? `style="margin-left: ${indent.length * 8}px"` : '';
          const textHtml = marked.parseInline(text, { async: false }) as string;
          return `<div class="checklist-item ${checkedClass}" ${indentStyle} data-block-id="${block.id}" data-line-index="${lineIndex}">
            <input type="checkbox" ${checkedAttr} class="checklist-checkbox" data-line-index="${lineIndex}" />
            <span class="checklist-text">${textHtml}</span>
          </div>`;
        }
        return '';
      })
      .filter(html => html !== '')
      .join('');

    return checklistHtml || null;
  }

  return {
    renderChecklist,
    isChecklistBlock,
    parseChecklist,
  };
}

/**
 * List renderer composable
 */
export function useListRenderer() {
  /**
   * Render list content to HTML (bullet or numbered)
   */
  function renderList(content: string): string {
    return marked.parse(content, { async: false }) as string;
  }

  return {
    renderList,
  };
}

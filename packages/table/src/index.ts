/**
 * @live-editor/table
 * Table generation and rendering for live-editor
 */

import { marked } from 'marked';
import { nextTick } from 'vue';
import type { CommandHandler, CommandContext } from '@live-editor/core';

/**
 * Table generator composable
 */
export function useTableGenerator() {
  function generateTableMarkdown(rows: number, cols: number): string {
    if (rows <= 0 || rows > 20 || cols <= 0 || cols > 10) {
      return '';
    }

    let tableMarkdown = '';

    // ヘッダー行
    tableMarkdown +=
      '| ' +
      Array(cols)
        .fill('Header')
        .map((h, i) => `${h}${i + 1}`)
        .join(' | ') +
      ' |\n';

    // 区切り行
    tableMarkdown += '| ' + Array(cols).fill('---').join(' | ') + ' |\n';

    // データ行
    for (let i = 0; i < rows; i++) {
      tableMarkdown += '| ' + Array(cols).fill('').join(' | ') + ' |\n';
    }

    return tableMarkdown.trim();
  }

  function parseTableCommand(content: string): { rows: number; cols: number } | null {
    const tableMatch = content.match(/^\/table\s+(\d+)\s+(\d+)$/);
    if (tableMatch && tableMatch[1] && tableMatch[2]) {
      const rows = parseInt(tableMatch[1]);
      const cols = parseInt(tableMatch[2]);
      if (rows > 0 && rows <= 20 && cols > 0 && cols <= 10) {
        return { rows, cols };
      }
    }
    return null;
  }

  return {
    generateTableMarkdown,
    parseTableCommand,
  };
}

/**
 * Table command handler for useKeyboardHandler
 * Returns a CommandHandler that handles /table commands
 */
export function useTableCommand(): CommandHandler {
  const { generateTableMarkdown, parseTableCommand } = useTableGenerator();

  return {
    match(content: string): boolean {
      return parseTableCommand(content.trim()) !== null;
    },

    execute(context: CommandContext): void {
      const { content, blockId, textarea, updateBlock, adjustTextareaHeight, blockRefs } = context;
      const parsed = parseTableCommand(content.trim());

      if (!parsed) return;

      const { rows, cols } = parsed;
      const tableMarkdown = generateTableMarkdown(rows, cols);

      updateBlock(blockId, tableMarkdown);

      nextTick(() => {
        const ta = blockRefs.value.get(blockId);
        if (ta) {
          // カーソルを最初のヘッダーセルに移動
          const cursorPos = 2; // "| " の後
          ta.setSelectionRange(cursorPos, cursorPos);
          adjustTextareaHeight(ta);
        }
      });
    },
  };
}

/**
 * Table renderer composable
 */
export function useTableRenderer() {
  /**
   * Render table content to HTML
   */
  function renderTable(content: string): string {
    return marked.parse(content, { async: false }) as string;
  }

  return {
    renderTable,
  };
}

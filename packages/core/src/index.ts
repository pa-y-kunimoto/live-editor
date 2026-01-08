/**
 * @live-editor/core
 * Core types and block parsing for live-editor
 */

import { computed, type Ref } from 'vue';
import type { Block, BlockType } from './types';

// Re-export types
export type { Block, BlockType } from './types';

// Re-export utility functions
export { escapeHtml } from './utils';

// Re-export editor composables
export { useBlockEditor } from './useBlockEditor';
export { useFormatToolbar } from './useFormatToolbar';
export {
  useKeyboardHandler,
  type CommandHandler,
  type CommandContext,
  type KeyboardHandlerDeps,
} from './useKeyboardHandler';

// Re-export renderer composables
export {
  useMarkdownRenderer,
  type BlockRenderers,
  type CodeBlockRenderer,
  type ChecklistRenderer,
  type LinkPreviewRenderer,
  type LinkPreview,
} from './useMarkdownRenderer';

/**
 * Markdown block parsing and management
 */
export function useMarkdownBlocks(content: Ref<string>) {
  const blocks = computed<Block[]>(() => {
    const lines = content.value.split('\n');
    const result: Block[] = [];
    let currentBlock: string[] = [];
    let blockId = 0;

    const pushBlock = () => {
      if (currentBlock.length > 0) {
        result.push({
          id: `block-${blockId++}`,
          content: currentBlock.join('\n'),
        });
        currentBlock = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const trimmed = line.trim();

      // 見出し
      if (trimmed.match(/^#{1,6}\s/)) {
        pushBlock();
        result.push({
          id: `block-${blockId++}`,
          content: line,
        });
        continue;
      }

      // リスト項目（ネストを含む）- 連続するリスト項目を1つのブロックにまとめる
      const isListItem =
        trimmed.match(/^[-*+](\s|$)(\[[ x]\]\s)?/) || trimmed.match(/^\d+\.(\s|$)/);
      const isIndentedListItem =
        line.match(/^\s+[-*+](\s|$)(\[[ x]\]\s)?/) || line.match(/^\s+\d+\.(\s|$)/);

      if (isListItem || isIndentedListItem) {
        pushBlock();
        const listLines = [line];
        // 次の行もリスト項目（インデントされている可能性も含む）なら追加
        while (i + 1 < lines.length) {
          const nextLine = lines[i + 1] ?? '';
          const nextTrimmed = nextLine.trim();
          // 空行の場合は終了
          if (nextTrimmed === '') {
            break;
          }
          // リスト項目、チェックリスト、番号付きリスト、またはインデントされたリスト項目の場合は継続
          const nextIsListItem =
            nextTrimmed.match(/^[-*+](\s|$)(\[[ x]\]\s)?/) || nextTrimmed.match(/^\d+\.(\s|$)/);
          const nextIsIndentedListItem =
            nextLine.match(/^\s+[-*+](\s|$)(\[[ x]\]\s)?/) || nextLine.match(/^\s+\d+\.(\s|$)/);

          if (nextIsListItem || nextIsIndentedListItem) {
            i++;
            listLines.push(nextLine);
          } else {
            break;
          }
        }
        result.push({
          id: `block-${blockId++}`,
          content: listLines.join('\n'),
        });
        continue;
      }

      // 引用（ネストを含む）- 連続する引用行を1つのブロックにまとめる
      const isQuote = trimmed.match(/^>+\s?/);
      const isIndentedQuote = line.match(/^\s+>+\s?/);

      if (isQuote || isIndentedQuote) {
        pushBlock();
        const quoteLines = [line];
        // 次の行も引用（インデントされている可能性も含む）なら追加
        while (i + 1 < lines.length) {
          const nextLine = lines[i + 1] ?? '';
          const nextTrimmed = nextLine.trim();
          // 空行の場合は終了
          if (nextTrimmed === '') {
            break;
          }
          // 引用行またはインデントされた引用行の場合は継続
          const nextIsQuote = nextTrimmed.match(/^>+\s?/);
          const nextIsIndentedQuote = nextLine.match(/^\s+>+\s?/);

          if (nextIsQuote || nextIsIndentedQuote) {
            i++;
            quoteLines.push(nextLine);
          } else {
            break;
          }
        }
        result.push({
          id: `block-${blockId++}`,
          content: quoteLines.join('\n'),
        });
        continue;
      }

      // 水平線
      if (trimmed.match(/^[-*_]{3,}$/)) {
        pushBlock();
        result.push({
          id: `block-${blockId++}`,
          content: line,
        });
        continue;
      }

      if (trimmed.startsWith('```')) {
        pushBlock();
        const codeBlock = [line];
        let foundClosing = false;
        const startIndex = i;
        i++;
        while (i < lines.length) {
          const codeLine = lines[i] ?? '';
          // 閉じる```は、```のみの行（言語指定なし）でなければならない
          // ```javascript などは新しいコードブロックの開始なので閉じタグではない
          const codeLineTrimmed = codeLine.trim();
          if (codeLineTrimmed === '```') {
            codeBlock.push(codeLine);
            foundClosing = true;
            break;
          }
          // 別のコードブロックの開始（```言語名）を見つけた場合は、閉じタグなしとして扱う
          if (codeLineTrimmed.startsWith('```') && codeLineTrimmed.length > 3) {
            break;
          }
          codeBlock.push(codeLine);
          i++;
        }
        // 閉じる```が見つからなかった場合は、開始行だけを通常のテキストとして扱う
        if (!foundClosing) {
          result.push({
            id: `block-${blockId++}`,
            content: line,
          });
          // インデックスを開始位置に戻す（次の行から再処理）
          i = startIndex;
          continue;
        }
        result.push({
          id: `block-${blockId++}`,
          content: codeBlock.join('\n'),
        });
        continue;
      }

      if (trimmed === '') {
        pushBlock();
        result.push({
          id: `block-${blockId++}`,
          content: '',
        });
        continue;
      }

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const tableLines = [line];
        while (i + 1 < lines.length) {
          const nextTableLine = lines[i + 1] ?? '';
          if (nextTableLine.trim().startsWith('|')) {
            i++;
            tableLines.push(nextTableLine);
          } else {
            break;
          }
        }
        pushBlock();
        result.push({
          id: `block-${blockId++}`,
          content: tableLines.join('\n'),
        });
        continue;
      }

      // 通常のテキスト行は各行を独立したブロックとして扱う
      // これにより、空ブロックに入力しても次のブロックと結合されない
      pushBlock();
      result.push({
        id: `block-${blockId++}`,
        content: line,
      });
    }

    // currentBlockは使われなくなったが、念のため残す
    pushBlock();

    if (result.length === 0) {
      result.push({ id: 'block-0', content: '' });
    }

    return result;
  });

  function getBlockType(content: string): BlockType {
    const trimmed = content.trim();
    if (trimmed.startsWith('# ')) return 'heading-1';
    if (trimmed.startsWith('## ')) return 'heading-2';
    if (trimmed.startsWith('### ')) return 'heading-3';
    if (trimmed.startsWith('```')) return 'code-block';
    if (trimmed.match(/^[-*+]\s\[[ x]\]\s/)) return 'checklist';
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('+ '))
      return 'bullet-list';
    if (trimmed.match(/^\d+\.\s/)) return 'numbered-list';
    if (trimmed.startsWith('> ')) return 'blockquote';
    if (trimmed.startsWith('|')) return 'table';
    if (trimmed === '') return 'empty';
    return 'paragraph';
  }

  function parseCodeBlock(content: string): { lang: string; code: string } | null {
    const match = content.match(/^```(\w*)\n?([\s\S]*?)```$/m);
    if (match) {
      return {
        lang: match[1] ?? 'text',
        code: (match[2] ?? '').replace(/\n$/, ''),
      };
    }
    return null;
  }

  function parseChecklist(
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

  function getSectionBlockIds(hoveredBlockId: string | null): Set<string> {
    if (!hoveredBlockId) return new Set();

    const blockIndex = blocks.value.findIndex((b: Block) => b.id === hoveredBlockId);
    if (blockIndex === -1) return new Set();

    const currentBlock = blocks.value[blockIndex];
    if (!currentBlock) return new Set();

    const currentContent = currentBlock.content.trim();

    // 見出しレベルを取得
    const headingMatch = currentContent.match(/^(#{1,6})\s/);
    if (!headingMatch) return new Set();

    const currentLevel = headingMatch[1]?.length ?? 0;
    const ids = new Set<string>([currentBlock.id]);

    // 次の同レベルまたはそれ以上の見出しが現れるまでのブロックを集める
    for (let i = blockIndex + 1; i < blocks.value.length; i++) {
      const nextBlock = blocks.value[i];
      if (!nextBlock) continue;

      const nextContent = nextBlock.content.trim();
      const nextHeadingMatch = nextContent.match(/^(#{1,6})\s/);

      // 次の見出しが同レベルまたはそれ以上の場合は終了
      if (nextHeadingMatch && (nextHeadingMatch[1]?.length ?? 0) <= currentLevel) {
        break;
      }

      ids.add(nextBlock.id);
    }

    return ids;
  }

  return {
    blocks,
    getBlockType,
    parseCodeBlock,
    parseChecklist,
    getSectionBlockIds,
  };
}

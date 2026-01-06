import { ref } from 'vue';

export function useMarkdownDocument() {
  const markdownContent = ref('');
  const showCopyNotification = ref(false);

  async function loadDefaultContent() {
    try {
      const content = await $fetch('/default-content.md', {
        responseType: 'text',
      });
      markdownContent.value = content as string;
    } catch (err) {
      console.error('Failed to load default content:', err);
      markdownContent.value = '# Welcome to Live Editor\n\nStart editing this document.';
    }
  }

  function formatMarkdownForCopy(content: string): string {
    const lines = content.split('\n');
    const result: string[] = [];
    let previousLineType = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const trimmed = line.trim();

      // 現在の行のタイプを判定
      let currentLineType = 'text';
      if (trimmed.startsWith('#')) currentLineType = 'heading';
      else if (trimmed.match(/^[-*+]\s/) || trimmed.match(/^\d+\.\s/)) currentLineType = 'list';
      else if (trimmed.startsWith('```')) currentLineType = 'code';
      else if (trimmed.startsWith('>')) currentLineType = 'quote';
      else if (trimmed.startsWith('|')) currentLineType = 'table';
      else if (trimmed === '') currentLineType = 'empty';

      // 前の行との間に空行を追加するかどうか判定
      if (result.length > 0 && previousLineType !== 'empty' && currentLineType !== 'empty') {
        // 見出しの前後
        if (currentLineType === 'heading' && previousLineType !== 'heading') {
          result.push('');
        }
        // 見出しの後
        else if (previousLineType === 'heading' && currentLineType !== 'heading') {
          result.push('');
        }
        // リストの前後（リストが連続している場合は空行を入れない）
        else if (currentLineType === 'list' && previousLineType !== 'list') {
          result.push('');
        } else if (previousLineType === 'list' && currentLineType !== 'list') {
          result.push('');
        }
        // コードブロックの前後
        else if (currentLineType === 'code' && previousLineType !== 'code') {
          result.push('');
        } else if (
          previousLineType === 'code' &&
          currentLineType !== 'code' &&
          trimmed.startsWith('```')
        ) {
          // コードブロックの閉じタグの後
          result.push(line);
          result.push('');
          previousLineType = 'empty';
          continue;
        }
        // 引用の前後
        else if (currentLineType === 'quote' && previousLineType !== 'quote') {
          result.push('');
        } else if (previousLineType === 'quote' && currentLineType !== 'quote') {
          result.push('');
        }
        // テーブルの前後
        else if (currentLineType === 'table' && previousLineType !== 'table') {
          result.push('');
        } else if (previousLineType === 'table' && currentLineType !== 'table') {
          result.push('');
        }
      }

      result.push(line);
      previousLineType = currentLineType;
    }

    return result.join('\n');
  }

  async function copyToClipboard() {
    try {
      const formattedContent = formatMarkdownForCopy(markdownContent.value);
      await navigator.clipboard.writeText(formattedContent);
      showCopyNotification.value = true;
      setTimeout(() => {
        showCopyNotification.value = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  return {
    markdownContent,
    showCopyNotification,
    loadDefaultContent,
    formatMarkdownForCopy,
    copyToClipboard,
  };
}

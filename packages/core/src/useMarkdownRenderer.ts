import { ref, watch } from 'vue';
import type { Block } from './types';
import { escapeHtml } from './utils';

/**
 * リンクプレビュー情報
 */
export interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  favicon: string | null;
}

/**
 * コードブロックレンダラーインターフェース
 */
export interface CodeBlockRenderer {
  parse: (content: string) => { lang: string; code: string } | null;
  render: (content: string) => string | null;
}

/**
 * チェックリストレンダラーインターフェース
 */
export interface ChecklistRenderer {
  isChecklist: (content: string) => boolean;
  render: (block: Block) => string | null;
}

/**
 * リンクプレビューレンダラーインターフェース
 */
export interface LinkPreviewRenderer {
  renderLoading: (url: string) => string;
  render: (url: string, preview: LinkPreview) => string;
}

/**
 * 注入可能なレンダラーのインターフェース
 */
export interface BlockRenderers {
  /** コードブロックレンダラー */
  codeBlock?: CodeBlockRenderer;
  /** チェックリストレンダラー */
  checklist?: ChecklistRenderer;
  /** リンクプレビューレンダラー */
  linkPreview?: LinkPreviewRenderer;
  /** Markdown→HTML変換 */
  parseMarkdown?: (content: string) => string;
}

/**
 * Markdownブロックをレンダリングするcomposable
 * 依存注入パターンで各種レンダラーを受け取る
 */
export function useMarkdownRenderer(renderers: BlockRenderers = {}) {
  const highlightedBlocks = ref<Map<string, string>>(new Map());
  const linkPreviews = ref<Map<string, LinkPreview>>(new Map());
  const loadingUrls = ref<Set<string>>(new Set());

  function renderBlock(block: Block): void {
    const content = block.content;
    if (!content.trim()) {
      highlightedBlocks.value.set(block.id, '<p class="empty-line"><br></p>');
      return;
    }

    // コードブロック（レンダラーが注入されていれば使用）
    if (renderers.codeBlock) {
      const codeInfo = renderers.codeBlock.parse(content);
      if (codeInfo) {
        const codeHtml = renderers.codeBlock.render(content);
        if (codeHtml) {
          highlightedBlocks.value.set(block.id, codeHtml);
          return;
        }
      }
    }

    // チェックリスト（レンダラーが注入されていれば使用）
    if (renderers.checklist) {
      if (renderers.checklist.isChecklist(content)) {
        const checklistHtml = renderers.checklist.render(block);
        if (checklistHtml) {
          highlightedBlocks.value.set(block.id, checklistHtml);
          return;
        }
      }
    }

    // Markdown→HTML変換（注入されていればそれを使用、なければエスケープのみ）
    let html = renderers.parseMarkdown
      ? renderers.parseMarkdown(content)
      : `<p>${escapeHtml(content)}</p>`;

    // URLリンクのみのブロックはリッチプレビューカードも追加表示
    const linkOnlyMatch = content.trim().match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (linkOnlyMatch && linkOnlyMatch[2]) {
      const url = linkOnlyMatch[2];
      // ローディング中の場合はスケルトンを表示
      if (loadingUrls.value.has(url) && renderers.linkPreview) {
        html += renderers.linkPreview.renderLoading(url);
      } else if (renderers.linkPreview) {
        const preview = linkPreviews.value.get(url);
        if (preview && preview.description) {
          html += renderers.linkPreview.render(url, preview);
        }
      }
    }

    highlightedBlocks.value.set(block.id, html);
  }

  function getRenderedBlock(block: Block): string {
    return highlightedBlocks.value.get(block.id) || '<p class="empty-line"><br></p>';
  }

  function watchBlocks(blocks: { value: Block[] }) {
    watch(
      () => blocks.value,
      newBlocks => {
        for (const block of newBlocks) {
          renderBlock(block);
        }
      },
      { immediate: true, deep: true }
    );
  }

  return {
    highlightedBlocks,
    linkPreviews,
    loadingUrls,
    renderBlock,
    getRenderedBlock,
    watchBlocks,
  };
}

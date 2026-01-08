/**
 * @live-editor/link
 * Link preview functionality for live-editor
 */

import { nextTick, type Ref } from 'vue';
import type { Block } from '@live-editor/core';

export interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  favicon: string | null;
}

export interface LinkPreviewFetcher {
  (url: string): Promise<LinkPreview | null>;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Link preview composable
 */
export function useLinkPreview(
  linkPreviews: Ref<Map<string, LinkPreview>>,
  loadingUrls: Ref<Set<string>>,
  fetcher?: LinkPreviewFetcher
) {
  async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
    if (fetcher) {
      return fetcher(url);
    }

    // Default implementation using fetch API
    try {
      const response = await fetch(`/api/fetch-title?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        return {
          url,
          title: data.title || null,
          description: data.description || null,
          image: data.image || null,
          siteName: data.siteName || null,
          favicon: data.favicon || null,
        };
      }
    } catch {
      // フェッチ失敗時はnullを返す
    }
    return null;
  }

  async function processUrlBlock(
    url: string,
    blocks: { value: Block[] },
    updateBlock: (blockId: string, content: string) => void,
    renderBlock: (block: Block) => void
  ) {
    // markdownリンク形式のパターン
    const linkPattern = `[${url}](${url})`;

    // ローディング状態を設定
    loadingUrls.value.add(url);

    // nextTickでDOMの更新を待ってからレンダリング
    await nextTick();

    // ローディングスケルトンを表示するため再レンダリング（厳密にマッチ）
    for (const b of blocks.value) {
      if (b.content.trim() === linkPattern) {
        renderBlock(b);
        break;
      }
    }

    // OGP情報を非同期で取得
    const preview = await fetchLinkPreview(url);

    // ローディング状態を解除
    loadingUrls.value.delete(url);

    if (preview) {
      linkPreviews.value.set(url, preview);

      // タイトルが取得できた場合、リンクテキストを更新
      if (preview.title) {
        for (const b of blocks.value) {
          // 厳密にURLのみのリンクブロックかチェック
          if (b.content.trim() === linkPattern) {
            updateBlock(b.id, `[${preview.title}](${url})`);
            break;
          }
        }
      }

      // nextTickでDOMの更新を待つ
      await nextTick();

      // プレビューカードを再レンダリング（URLを含むリンクブロック）
      for (const b of blocks.value) {
        const linkMatch = b.content.trim().match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
        if (linkMatch && linkMatch[2] === url) {
          renderBlock(b);
          break;
        }
      }
    } else {
      // フェッチ失敗時もローディング解除後に再レンダリング
      await nextTick();
      for (const b of blocks.value) {
        if (b.content.trim() === linkPattern) {
          renderBlock(b);
          break;
        }
      }
    }
  }

  return {
    fetchLinkPreview,
    processUrlBlock,
  };
}

/**
 * Link preview renderer composable
 */
export function useLinkPreviewRenderer() {
  /**
   * Render loading preview card HTML
   */
  function renderLoadingPreview(url: string): string {
    const hostname = new globalThis.URL(url).hostname;

    return `<div class="link-preview-card link-preview-loading">
      <div class="link-preview-content">
        <div class="link-preview-title-skeleton"></div>
        <div class="link-preview-description-skeleton"></div>
        <div class="link-preview-site">
          <div class="link-preview-favicon-skeleton"></div>
          <span>${escapeHtml(hostname)}</span>
        </div>
      </div>
    </div>`;
  }

  /**
   * Render link preview card HTML
   */
  function renderLinkPreview(url: string, preview: LinkPreview): string {
    const title = preview.title ? escapeHtml(preview.title) : url;
    const description = preview.description ? escapeHtml(preview.description) : '';
    const siteName = preview.siteName
      ? escapeHtml(preview.siteName)
      : new globalThis.URL(url).hostname;

    let html = `<a href="${escapeHtml(url)}" class="link-preview-card" target="_blank" rel="noopener noreferrer">`;

    html += `<div class="link-preview-content">`;
    html += `<div class="link-preview-title">${title}</div>`;

    if (description) {
      html += `<div class="link-preview-description">${description}</div>`;
    }

    html += `<div class="link-preview-site">`;
    if (preview.favicon) {
      html += `<img src="${escapeHtml(preview.favicon)}" alt="" class="link-preview-favicon" />`;
    }
    html += `<span>${siteName}</span>`;
    html += `</div>`;
    html += `</div></a>`;

    return html;
  }

  return {
    renderLoadingPreview,
    renderLinkPreview,
  };
}

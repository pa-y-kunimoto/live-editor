import { ref, watch } from 'vue';
import { marked } from 'marked';
import { useHighlight } from './useHighlight';
import type { Block } from './useMarkdownBlocks';

export interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  favicon: string | null;
}

export function useMarkdownRenderer() {
  const { highlightCode } = useHighlight();
  const highlightedBlocks = ref<Map<string, string>>(new Map());
  const linkPreviews = ref<Map<string, LinkPreview>>(new Map());
  const loadingUrls = ref<Set<string>>(new Set());

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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

  function renderLoadingPreview(url: string): string {
    const hostname = new globalThis.URL(url).hostname;

    return `<div class="link-preview-card link-preview-loading">
      <div class="link-preview-content">
        <div class="link-preview-title-skeleton"></div>
        <div class="link-preview-description-skeleton"></div>
        <div class="link-preview-site">
          <div class="link-preview-favicon-skeleton"></div>
          <span>${hostname}</span>
        </div>
      </div>
    </div>`;
  }

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

  function renderBlock(block: Block): void {
    const content = block.content;
    if (!content.trim()) {
      highlightedBlocks.value.set(block.id, '<p class="empty-line"><br></p>');
      return;
    }

    const codeInfo = parseCodeBlock(content);
    if (codeInfo) {
      const highlighted = highlightCode(codeInfo.code, codeInfo.lang);
      const langLabel = codeInfo.lang ? `<div class="code-lang-label">${codeInfo.lang}</div>` : '';
      highlightedBlocks.value.set(
        block.id,
        `<div class="code-block-wrapper">${langLabel}<pre class="hljs"><code>${highlighted}</code></pre></div>`
      );
      return;
    }

    // チェックリストのレンダリング（複数行対応）
    const lines = content.split('\n');
    const isChecklist =
      lines.every(line => {
        const trimmed = line.trim();
        return (
          trimmed === '' ||
          trimmed.match(/^[-*+]\s\[[ x]\]\s/) ||
          line.match(/^\s+[-*+]\s\[[ x]\]\s/)
        );
      }) && lines.some(line => line.match(/[-*+]\s\[[ x]\]\s/));

    if (isChecklist) {
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

      if (checklistHtml) {
        highlightedBlocks.value.set(block.id, checklistHtml);
        return;
      }
    }

    // 通常のmarkdownとしてレンダリング
    let html = marked.parse(content, { async: false }) as string;

    // URLリンクのみのブロックはリッチプレビューカードも追加表示
    const linkOnlyMatch = content.trim().match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (linkOnlyMatch && linkOnlyMatch[2]) {
      const url = linkOnlyMatch[2];
      // ローディング中の場合はスケルトンを表示
      if (loadingUrls.value.has(url)) {
        html += renderLoadingPreview(url);
      } else {
        const preview = linkPreviews.value.get(url);
        if (preview && preview.description) {
          html += renderLinkPreview(url, preview);
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
    renderLoadingPreview,
    renderLinkPreview,
  };
}

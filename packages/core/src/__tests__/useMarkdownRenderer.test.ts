import { describe, it, expect, beforeEach } from 'vitest';
import { useMarkdownRenderer, type BlockRenderers, type LinkPreview, type Block } from '../index';

// モックレンダラー
function createMockRenderers(): BlockRenderers {
  return {
    parseCodeBlock: (content: string) => {
      const match = content.match(/^```(\w*)\n([\s\S]*?)\n```$/);
      if (match) {
        return { language: match[1] || '', code: match[2] || '' };
      }
      return null;
    },
    renderCodeBlock: (content: string) => {
      const match = content.match(/^```(\w*)\n([\s\S]*?)\n```$/);
      if (match) {
        const lang = match[1] || '';
        const code = match[2] || '';
        const langLabel = lang ? `<span class="code-lang-label">${lang}</span>` : '';
        return `<div class="code-block-wrapper">${langLabel}<pre class="hljs"><code>${code}</code></pre></div>`;
      }
      return null;
    },
    isChecklistBlock: (content: string) => {
      return /^- \[([ x])\]/.test(content);
    },
    renderChecklist: (block: Block) => {
      const lines = block.content.split('\n');
      const items = lines.map((line, index) => {
        const match = line.match(/^- \[([ x])\] (.+)$/);
        if (match) {
          const checked = match[1] === 'x';
          const text = match[2];
          const checkedClass = checked ? ' checked' : '';
          const checkedAttr = checked ? ' checked' : '';
          return `<div class="checklist-item${checkedClass}" data-line-index="${index}"><span class="checklist-checkbox"${checkedAttr}></span><span class="checklist-text">${text}</span></div>`;
        }
        return line;
      });
      return `<div class="checklist">${items.join('')}</div>`;
    },
    renderLoadingPreview: (url: string) => {
      const hostname = new URL(url).hostname;
      return `<a href="${url}" class="link-preview-card link-preview-loading"><div class="link-preview-content"><div class="link-preview-title-skeleton"></div><div class="link-preview-description-skeleton"></div><div class="link-preview-site">${hostname}</div></div></a>`;
    },
    renderLinkPreview: (url: string, preview: LinkPreview) => {
      const escapeHtml = (text: string) =>
        text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      const title = preview.title ? escapeHtml(preview.title) : url;
      const hostname = new URL(url).hostname;
      const siteName = preview.siteName || hostname;
      const favicon = preview.favicon
        ? `<img src="${preview.favicon}" class="link-preview-favicon" />`
        : '';
      const description = preview.description
        ? `<div class="link-preview-description">${escapeHtml(preview.description)}</div>`
        : '';
      return `<a href="${url}" class="link-preview-card"><div class="link-preview-content"><div class="link-preview-title">${title}</div>${description}<div class="link-preview-site">${favicon}${siteName}</div></div></a>`;
    },
    parseMarkdown: (content: string) => {
      // シンプルなMarkdownパーサーモック
      let html = content;
      // Heading
      html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
      html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
      // Bold
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Italic
      html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
      // Inline code
      html = html.replace(/`(.+?)`/g, '<code>$1</code>');
      // Link
      html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
      // Blockquote
      html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>');
      // Bullet list
      if (/^- /.test(content) && !/^- \[/.test(content)) {
        const items = content.split('\n').map(line => {
          const match = line.match(/^- (.+)$/);
          return match ? `<li>${match[1]}</li>` : line;
        });
        html = `<ul>${items.join('')}</ul>`;
      }
      // Table
      if (/^\|/.test(content)) {
        const lines = content.split('\n');
        const headerLine = lines[0];
        const dataLines = lines.slice(2);
        const headerCells = headerLine
          .split('|')
          .filter(c => c.trim())
          .map(c => `<th>${c.trim()}</th>`)
          .join('');
        const rows = dataLines
          .map(line => {
            const cells = line
              .split('|')
              .filter(c => c.trim())
              .map(c => `<td>${c.trim()}</td>`)
              .join('');
            return `<tr>${cells}</tr>`;
          })
          .join('');
        html = `<table><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table>`;
      }
      // Wrap in paragraph if not already wrapped
      if (!html.startsWith('<')) {
        html = `<p>${html}</p>`;
      }
      return html;
    },
  };
}

describe('useMarkdownRenderer', () => {
  let renderer: ReturnType<typeof useMarkdownRenderer>;
  let mockRenderers: BlockRenderers;

  beforeEach(() => {
    mockRenderers = createMockRenderers();
    renderer = useMarkdownRenderer(mockRenderers);
  });

  describe('renderBlock', () => {
    it('should render empty block as empty paragraph', () => {
      const block: Block = { id: 'block-1', content: '' };
      renderer.renderBlock(block);

      const result = renderer.getRenderedBlock(block);
      expect(result).toContain('<p class="empty-line">');
      expect(result).toContain('<br>');
    });

    it('should render heading', () => {
      const block: Block = { id: 'block-1', content: '# Hello World' };
      renderer.renderBlock(block);

      const result = renderer.getRenderedBlock(block);
      expect(result).toContain('<h1>');
      expect(result).toContain('Hello World');
    });

    it('should render code block with syntax highlighting', () => {
      const block: Block = { id: 'block-1', content: '```javascript\nconst x = 1;\n```' };
      renderer.renderBlock(block);

      const result = renderer.getRenderedBlock(block);
      expect(result).toContain('code-block-wrapper');
      expect(result).toContain('<pre class="hljs">');
      expect(result).toContain('code-lang-label');
      expect(result).toContain('javascript');
    });

    it('should render code block without language label when no language specified', () => {
      const block: Block = { id: 'block-1', content: '```\nplain code\n```' };
      renderer.renderBlock(block);

      const result = renderer.getRenderedBlock(block);
      expect(result).toContain('code-block-wrapper');
      expect(result).toContain('<pre class="hljs">');
    });

    it('should render bullet list', () => {
      const block: Block = { id: 'block-1', content: '- Item 1\n- Item 2' };
      renderer.renderBlock(block);

      const result = renderer.getRenderedBlock(block);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
    });

    it('should render checklist with checkboxes', () => {
      const block: Block = { id: 'block-1', content: '- [ ] Todo\n- [x] Done' };
      renderer.renderBlock(block);

      const result = renderer.getRenderedBlock(block);
      expect(result).toContain('checklist-item');
      expect(result).toContain('checklist-checkbox');
      expect(result).toContain('Todo');
      expect(result).toContain('Done');
    });

    it('should render checked checklist item with checked class', () => {
      const block: Block = { id: 'block-1', content: '- [x] Done item' };
      renderer.renderBlock(block);

      const result = renderer.getRenderedBlock(block);
      expect(result).toContain('class="checklist-item checked"');
      expect(result).toContain('checked');
    });

    it('should render blockquote', () => {
      const block: Block = { id: 'block-1', content: '> This is a quote' };
      renderer.renderBlock(block);

      const result = renderer.getRenderedBlock(block);
      expect(result).toContain('<blockquote>');
      expect(result).toContain('This is a quote');
    });

    it('should render table', () => {
      const block: Block = { id: 'block-1', content: '| A | B |\n| --- | --- |\n| 1 | 2 |' };
      renderer.renderBlock(block);

      const result = renderer.getRenderedBlock(block);
      expect(result).toContain('<table>');
      expect(result).toContain('<th>');
      expect(result).toContain('<td>');
    });

    it('should render link with href', () => {
      const block: Block = { id: 'block-1', content: '[Google](https://google.com)' };
      renderer.renderBlock(block);

      const result = renderer.getRenderedBlock(block);
      expect(result).toContain('href="https://google.com"');
      expect(result).toContain('Google');
    });

    it('should render bold text', () => {
      const block: Block = { id: 'block-1', content: '**bold text**' };
      renderer.renderBlock(block);

      const result = renderer.getRenderedBlock(block);
      expect(result).toContain('<strong>');
      expect(result).toContain('bold text');
    });

    it('should render italic text', () => {
      const block: Block = { id: 'block-1', content: '*italic text*' };
      renderer.renderBlock(block);

      const result = renderer.getRenderedBlock(block);
      expect(result).toContain('<em>');
      expect(result).toContain('italic text');
    });

    it('should render inline code', () => {
      const block: Block = { id: 'block-1', content: 'Use `code` here' };
      renderer.renderBlock(block);

      const result = renderer.getRenderedBlock(block);
      expect(result).toContain('<code>');
      expect(result).toContain('code');
    });
  });

  describe('getRenderedBlock', () => {
    it('should return empty paragraph for unrendered block', () => {
      const block: Block = { id: 'unknown-block', content: 'test' };

      const result = renderer.getRenderedBlock(block);
      expect(result).toContain('<p class="empty-line">');
    });
  });

  describe('renderLoadingPreview (via injected renderer)', () => {
    it('should render loading skeleton with hostname', () => {
      const result = mockRenderers.renderLoadingPreview!('https://example.com/page');

      expect(result).toContain('link-preview-card');
      expect(result).toContain('link-preview-loading');
      expect(result).toContain('example.com');
      expect(result).toContain('link-preview-title-skeleton');
      expect(result).toContain('link-preview-description-skeleton');
    });
  });

  describe('renderLinkPreview (via injected renderer)', () => {
    it('should render link preview card with all properties', () => {
      const preview: LinkPreview = {
        url: 'https://example.com',
        title: 'Example Title',
        description: 'Example description',
        image: 'https://example.com/image.jpg',
        siteName: 'Example Site',
        favicon: 'https://example.com/favicon.ico',
      };

      const result = mockRenderers.renderLinkPreview!('https://example.com', preview);

      expect(result).toContain('link-preview-card');
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('Example Title');
      expect(result).toContain('Example description');
      expect(result).toContain('Example Site');
      expect(result).toContain('link-preview-favicon');
    });

    it('should render link preview without description', () => {
      const preview: LinkPreview = {
        url: 'https://example.com',
        title: 'Example Title',
        description: null,
        image: null,
        siteName: null,
        favicon: null,
      };

      const result = mockRenderers.renderLinkPreview!('https://example.com', preview);

      expect(result).toContain('Example Title');
      expect(result).not.toContain('link-preview-description');
    });

    it('should use URL as title when title is null', () => {
      const preview: LinkPreview = {
        url: 'https://example.com',
        title: null,
        description: null,
        image: null,
        siteName: null,
        favicon: null,
      };

      const result = mockRenderers.renderLinkPreview!('https://example.com', preview);

      expect(result).toContain('https://example.com');
    });

    it('should use hostname when siteName is null', () => {
      const preview: LinkPreview = {
        url: 'https://example.com',
        title: 'Title',
        description: null,
        image: null,
        siteName: null,
        favicon: null,
      };

      const result = mockRenderers.renderLinkPreview!('https://example.com', preview);

      expect(result).toContain('example.com');
    });

    it('should escape HTML in title and description', () => {
      const preview: LinkPreview = {
        url: 'https://example.com',
        title: '<script>alert("xss")</script>',
        description: '<img src=x onerror=alert(1)>',
        image: null,
        siteName: null,
        favicon: null,
      };

      const result = mockRenderers.renderLinkPreview!('https://example.com', preview);

      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });

  describe('linkPreviews and loadingUrls', () => {
    it('should initialize with empty maps/sets', () => {
      expect(renderer.linkPreviews.value.size).toBe(0);
      expect(renderer.loadingUrls.value.size).toBe(0);
    });

    it('should show loading preview when URL is in loadingUrls', () => {
      const url = 'https://example.com';
      renderer.loadingUrls.value.add(url);

      const block: Block = { id: 'block-1', content: `[${url}](${url})` };
      renderer.renderBlock(block);

      const result = renderer.getRenderedBlock(block);
      expect(result).toContain('link-preview-loading');
    });

    it('should show preview card when URL has preview data', () => {
      const url = 'https://example.com';
      renderer.linkPreviews.value.set(url, {
        url,
        title: 'Example',
        description: 'Description',
        image: null,
        siteName: null,
        favicon: null,
      });

      const block: Block = { id: 'block-1', content: `[${url}](${url})` };
      renderer.renderBlock(block);

      const result = renderer.getRenderedBlock(block);
      expect(result).toContain('link-preview-card');
      expect(result).toContain('Example');
    });
  });

  describe('without injected renderers', () => {
    it('should fallback to escaped HTML when no parseMarkdown is provided', () => {
      const rendererWithoutMarkdown = useMarkdownRenderer({});
      const block: Block = { id: 'block-1', content: '<script>alert(1)</script>' };
      rendererWithoutMarkdown.renderBlock(block);

      const result = rendererWithoutMarkdown.getRenderedBlock(block);
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest'
import { useMarkdownRenderer } from '../useMarkdownRenderer'
import type { Block } from '../useMarkdownBlocks'

describe('useMarkdownRenderer', () => {
  let renderer: ReturnType<typeof useMarkdownRenderer>

  beforeEach(() => {
    renderer = useMarkdownRenderer()
  })

  describe('renderBlock', () => {
    it('should render empty block as empty paragraph', () => {
      const block: Block = { id: 'block-1', content: '' }
      renderer.renderBlock(block)

      const result = renderer.getRenderedBlock(block)
      expect(result).toContain('<p class="empty-line">')
      expect(result).toContain('<br>')
    })

    it('should render heading', () => {
      const block: Block = { id: 'block-1', content: '# Hello World' }
      renderer.renderBlock(block)

      const result = renderer.getRenderedBlock(block)
      expect(result).toContain('<h1>')
      expect(result).toContain('Hello World')
    })

    it('should render code block with syntax highlighting', () => {
      const block: Block = { id: 'block-1', content: '```javascript\nconst x = 1;\n```' }
      renderer.renderBlock(block)

      const result = renderer.getRenderedBlock(block)
      expect(result).toContain('code-block-wrapper')
      expect(result).toContain('<pre class="hljs">')
      expect(result).toContain('code-lang-label')
      expect(result).toContain('javascript')
    })

    it('should render code block without language label when no language specified', () => {
      const block: Block = { id: 'block-1', content: '```\nplain code\n```' }
      renderer.renderBlock(block)

      const result = renderer.getRenderedBlock(block)
      expect(result).toContain('code-block-wrapper')
      expect(result).toContain('<pre class="hljs">')
    })

    it('should render bullet list', () => {
      const block: Block = { id: 'block-1', content: '- Item 1\n- Item 2' }
      renderer.renderBlock(block)

      const result = renderer.getRenderedBlock(block)
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>')
      expect(result).toContain('Item 1')
      expect(result).toContain('Item 2')
    })

    it('should render checklist with checkboxes', () => {
      const block: Block = { id: 'block-1', content: '- [ ] Todo\n- [x] Done' }
      renderer.renderBlock(block)

      const result = renderer.getRenderedBlock(block)
      expect(result).toContain('checklist-item')
      expect(result).toContain('checklist-checkbox')
      expect(result).toContain('Todo')
      expect(result).toContain('Done')
    })

    it('should render checked checklist item with checked class', () => {
      const block: Block = { id: 'block-1', content: '- [x] Done item' }
      renderer.renderBlock(block)

      const result = renderer.getRenderedBlock(block)
      expect(result).toContain('class="checklist-item checked"')
      expect(result).toContain('checked')
    })

    it('should render blockquote', () => {
      const block: Block = { id: 'block-1', content: '> This is a quote' }
      renderer.renderBlock(block)

      const result = renderer.getRenderedBlock(block)
      expect(result).toContain('<blockquote>')
      expect(result).toContain('This is a quote')
    })

    it('should render table', () => {
      const block: Block = { id: 'block-1', content: '| A | B |\n| --- | --- |\n| 1 | 2 |' }
      renderer.renderBlock(block)

      const result = renderer.getRenderedBlock(block)
      expect(result).toContain('<table>')
      expect(result).toContain('<th>')
      expect(result).toContain('<td>')
    })

    it('should render link with href', () => {
      const block: Block = { id: 'block-1', content: '[Google](https://google.com)' }
      renderer.renderBlock(block)

      const result = renderer.getRenderedBlock(block)
      expect(result).toContain('href="https://google.com"')
      expect(result).toContain('Google')
    })

    it('should render bold text', () => {
      const block: Block = { id: 'block-1', content: '**bold text**' }
      renderer.renderBlock(block)

      const result = renderer.getRenderedBlock(block)
      expect(result).toContain('<strong>')
      expect(result).toContain('bold text')
    })

    it('should render italic text', () => {
      const block: Block = { id: 'block-1', content: '*italic text*' }
      renderer.renderBlock(block)

      const result = renderer.getRenderedBlock(block)
      expect(result).toContain('<em>')
      expect(result).toContain('italic text')
    })

    it('should render inline code', () => {
      const block: Block = { id: 'block-1', content: 'Use `code` here' }
      renderer.renderBlock(block)

      const result = renderer.getRenderedBlock(block)
      expect(result).toContain('<code>')
      expect(result).toContain('code')
    })
  })

  describe('getRenderedBlock', () => {
    it('should return empty paragraph for unrendered block', () => {
      const block: Block = { id: 'unknown-block', content: 'test' }

      const result = renderer.getRenderedBlock(block)
      expect(result).toContain('<p class="empty-line">')
    })
  })

  describe('renderLoadingPreview', () => {
    it('should render loading skeleton with hostname', () => {
      const result = renderer.renderLoadingPreview('https://example.com/page')

      expect(result).toContain('link-preview-card')
      expect(result).toContain('link-preview-loading')
      expect(result).toContain('example.com')
      expect(result).toContain('link-preview-title-skeleton')
      expect(result).toContain('link-preview-description-skeleton')
    })
  })

  describe('renderLinkPreview', () => {
    it('should render link preview card with all properties', () => {
      const preview = {
        url: 'https://example.com',
        title: 'Example Title',
        description: 'Example description',
        image: 'https://example.com/image.jpg',
        siteName: 'Example Site',
        favicon: 'https://example.com/favicon.ico'
      }

      const result = renderer.renderLinkPreview('https://example.com', preview)

      expect(result).toContain('link-preview-card')
      expect(result).toContain('href="https://example.com"')
      expect(result).toContain('Example Title')
      expect(result).toContain('Example description')
      expect(result).toContain('Example Site')
      expect(result).toContain('link-preview-favicon')
    })

    it('should render link preview without description', () => {
      const preview = {
        url: 'https://example.com',
        title: 'Example Title',
        description: null,
        image: null,
        siteName: null,
        favicon: null
      }

      const result = renderer.renderLinkPreview('https://example.com', preview)

      expect(result).toContain('Example Title')
      expect(result).not.toContain('link-preview-description')
    })

    it('should use URL as title when title is null', () => {
      const preview = {
        url: 'https://example.com',
        title: null,
        description: null,
        image: null,
        siteName: null,
        favicon: null
      }

      const result = renderer.renderLinkPreview('https://example.com', preview)

      expect(result).toContain('https://example.com')
    })

    it('should use hostname when siteName is null', () => {
      const preview = {
        url: 'https://example.com',
        title: 'Title',
        description: null,
        image: null,
        siteName: null,
        favicon: null
      }

      const result = renderer.renderLinkPreview('https://example.com', preview)

      expect(result).toContain('example.com')
    })

    it('should escape HTML in title and description', () => {
      const preview = {
        url: 'https://example.com',
        title: '<script>alert("xss")</script>',
        description: '<img src=x onerror=alert(1)>',
        image: null,
        siteName: null,
        favicon: null
      }

      const result = renderer.renderLinkPreview('https://example.com', preview)

      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;script&gt;')
    })
  })

  describe('linkPreviews and loadingUrls', () => {
    it('should initialize with empty maps/sets', () => {
      expect(renderer.linkPreviews.value.size).toBe(0)
      expect(renderer.loadingUrls.value.size).toBe(0)
    })

    it('should show loading preview when URL is in loadingUrls', () => {
      const url = 'https://example.com'
      renderer.loadingUrls.value.add(url)

      const block: Block = { id: 'block-1', content: `[${url}](${url})` }
      renderer.renderBlock(block)

      const result = renderer.getRenderedBlock(block)
      expect(result).toContain('link-preview-loading')
    })

    it('should show preview card when URL has preview data', () => {
      const url = 'https://example.com'
      renderer.linkPreviews.value.set(url, {
        url,
        title: 'Example',
        description: 'Description',
        image: null,
        siteName: null,
        favicon: null
      })

      const block: Block = { id: 'block-1', content: `[${url}](${url})` }
      renderer.renderBlock(block)

      const result = renderer.getRenderedBlock(block)
      expect(result).toContain('link-preview-card')
      expect(result).toContain('Example')
    })
  })
})

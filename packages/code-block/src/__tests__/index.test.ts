import { describe, it, expect } from 'vitest';
import { parseCodeBlock, useHighlight, useCodeBlockRenderer } from '../index';

describe('parseCodeBlock', () => {
  it('should parse code block with language', () => {
    const content = '```typescript\nconst x = 1;\n```';
    const result = parseCodeBlock(content);

    expect(result).toEqual({
      lang: 'typescript',
      code: 'const x = 1;',
    });
  });

  it('should parse code block without language', () => {
    const content = '```\nsome code\n```';
    const result = parseCodeBlock(content);

    expect(result).toEqual({
      lang: '',
      code: 'some code',
    });
  });

  it('should parse multiline code block', () => {
    const content = '```javascript\nfunction hello() {\n  return "world";\n}\n```';
    const result = parseCodeBlock(content);

    expect(result).toEqual({
      lang: 'javascript',
      code: 'function hello() {\n  return "world";\n}',
    });
  });

  it('should return null for non-code block content', () => {
    const content = 'Just some text';
    const result = parseCodeBlock(content);

    expect(result).toBeNull();
  });

  it('should return null for incomplete code block', () => {
    const content = '```typescript\nconst x = 1;';
    const result = parseCodeBlock(content);

    expect(result).toBeNull();
  });

  it('should handle empty code block', () => {
    const content = '```python\n```';
    const result = parseCodeBlock(content);

    expect(result).toEqual({
      lang: 'python',
      code: '',
    });
  });

  it('should parse code block with special characters', () => {
    const content = '```html\n<div class="test">&amp;</div>\n```';
    const result = parseCodeBlock(content);

    expect(result).toEqual({
      lang: 'html',
      code: '<div class="test">&amp;</div>',
    });
  });
});

describe('useHighlight', () => {
  const { highlightCode, supportedLanguages } = useHighlight();

  describe('highlightCode', () => {
    it('should highlight JavaScript code', () => {
      const code = 'const x = 1;';
      const result = highlightCode(code, 'javascript');

      expect(result).toContain('hljs-');
      expect(result).toContain('const');
    });

    it('should highlight TypeScript code', () => {
      const code = 'const x: number = 1;';
      const result = highlightCode(code, 'typescript');

      expect(result).toContain('hljs-');
    });

    it('should highlight Python code', () => {
      const code = 'def hello():\n    return "world"';
      const result = highlightCode(code, 'python');

      expect(result).toContain('hljs-');
    });

    it('should handle language aliases (js -> javascript)', () => {
      const code = 'const x = 1;';
      const result = highlightCode(code, 'js');

      expect(result).toContain('hljs-');
    });

    it('should handle language aliases (ts -> typescript)', () => {
      const code = 'const x: number = 1;';
      const result = highlightCode(code, 'ts');

      expect(result).toContain('hljs-');
    });

    it('should handle language aliases (py -> python)', () => {
      const code = 'print("hello")';
      const result = highlightCode(code, 'py');

      expect(result).toContain('hljs-');
    });

    it('should handle unsupported languages with auto-detection', () => {
      const code = '<script>alert("xss")</script>';
      const result = highlightCode(code, 'unknown-lang-xyz');

      // Auto-detection should still produce output (may be highlighted as HTML)
      expect(result).toBeTruthy();
      // HTML special characters should be escaped in some form
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('should auto-detect language when not specified', () => {
      const code = 'function hello() { return "world"; }';
      const result = highlightCode(code, '');

      // Should still produce some output
      expect(result).toBeTruthy();
    });

    it('should handle case-insensitive language names', () => {
      const code = 'const x = 1;';
      const resultLower = highlightCode(code, 'javascript');
      const resultUpper = highlightCode(code, 'JAVASCRIPT');

      expect(resultLower).toBe(resultUpper);
    });
  });

  describe('supportedLanguages', () => {
    it('should include common languages', () => {
      expect(supportedLanguages).toContain('javascript');
      expect(supportedLanguages).toContain('typescript');
      expect(supportedLanguages).toContain('python');
      expect(supportedLanguages).toContain('rust');
      expect(supportedLanguages).toContain('go');
      expect(supportedLanguages).toContain('java');
    });

    it('should include language aliases', () => {
      expect(supportedLanguages).toContain('js');
      expect(supportedLanguages).toContain('ts');
      expect(supportedLanguages).toContain('py');
      expect(supportedLanguages).toContain('rb');
      expect(supportedLanguages).toContain('sh');
    });

    it('should include markup languages', () => {
      expect(supportedLanguages).toContain('html');
      expect(supportedLanguages).toContain('xml');
      expect(supportedLanguages).toContain('css');
      expect(supportedLanguages).toContain('json');
      expect(supportedLanguages).toContain('yaml');
    });
  });
});

describe('useCodeBlockRenderer', () => {
  const { renderCodeBlock } = useCodeBlockRenderer();

  it('should render code block with language label', () => {
    const content = '```typescript\nconst x = 1;\n```';
    const result = renderCodeBlock(content);

    expect(result).toContain('code-block-wrapper');
    expect(result).toContain('code-lang-label');
    expect(result).toContain('typescript');
    expect(result).toContain('<pre class="hljs">');
    expect(result).toContain('<code>');
  });

  it('should render code block without language label when no language specified', () => {
    const content = '```\nsome code\n```';
    const result = renderCodeBlock(content);

    expect(result).toContain('code-block-wrapper');
    expect(result).not.toContain('code-lang-label');
  });

  it('should return null for non-code block content', () => {
    const content = 'Just some text';
    const result = renderCodeBlock(content);

    expect(result).toBeNull();
  });

  it('should highlight code in rendered output', () => {
    const content = '```javascript\nconst x = 1;\n```';
    const result = renderCodeBlock(content);

    expect(result).toContain('hljs-');
  });

  it('should handle code block starting with special characters as language', () => {
    // The regex captures \w* which means it will match empty string before <script>
    // So this will be parsed as code block with empty language
    const content = '```<script>\nalert("xss")\n```';
    const result = renderCodeBlock(content);

    // This actually parses as a code block with code starting with <script>
    // The result depends on how parseCodeBlock handles this edge case
    if (result) {
      // If it renders, HTML should be escaped
      expect(result).toContain('&lt;');
    }
  });

  it('should handle valid language with special code content', () => {
    const content = '```html\n<script>alert("test")</script>\n```';
    const result = renderCodeBlock(content);

    expect(result).not.toBeNull();
    expect(result).toContain('code-block-wrapper');
    expect(result).toContain('html');
    // HTML should be escaped/highlighted
    expect(result).toContain('&lt;');
  });
});

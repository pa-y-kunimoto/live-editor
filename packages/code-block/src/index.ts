/**
 * @live-editor/code-block
 * Code block syntax highlighting and rendering for live-editor
 */

import hljs from 'highlight.js/lib/core';
import { escapeHtml } from '@live-editor/core';

// 言語を個別にインポート
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import php from 'highlight.js/lib/languages/php';
import ruby from 'highlight.js/lib/languages/ruby';
import swift from 'highlight.js/lib/languages/swift';
import kotlin from 'highlight.js/lib/languages/kotlin';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import scss from 'highlight.js/lib/languages/scss';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import shell from 'highlight.js/lib/languages/shell';
import dockerfile from 'highlight.js/lib/languages/dockerfile';

// 言語を登録
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('go', go);
hljs.registerLanguage('java', java);
hljs.registerLanguage('c', c);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cs', csharp);
hljs.registerLanguage('php', php);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('rb', ruby);
hljs.registerLanguage('swift', swift);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('scss', scss);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('docker', dockerfile);

const supportedLanguages = [
  'javascript',
  'js',
  'typescript',
  'ts',
  'python',
  'py',
  'rust',
  'go',
  'java',
  'c',
  'cpp',
  'csharp',
  'cs',
  'php',
  'ruby',
  'rb',
  'swift',
  'kotlin',
  'html',
  'xml',
  'css',
  'scss',
  'json',
  'yaml',
  'yml',
  'markdown',
  'md',
  'sql',
  'bash',
  'sh',
  'shell',
  'dockerfile',
  'docker',
];

/**
 * Parse code block content to extract language and code
 */
export function parseCodeBlock(content: string): { lang: string; code: string } | null {
  const match = content.match(/^```(\w*)\n?([\s\S]*?)```$/m);
  if (match) {
    return {
      lang: match[1] ?? 'text',
      code: (match[2] ?? '').replace(/\n$/, ''),
    };
  }
  return null;
}

/**
 * Syntax highlighting composable
 */
export function useHighlight() {
  function highlightCode(code: string, lang: string): string {
    const language = lang.toLowerCase();

    if (supportedLanguages.includes(language)) {
      try {
        const result = hljs.highlight(code, { language });
        return result.value;
      } catch {
        return escapeHtml(code);
      }
    }

    // 言語が指定されていないか未対応の場合は自動検出を試みる
    try {
      const result = hljs.highlightAuto(code);
      return result.value;
    } catch {
      return escapeHtml(code);
    }
  }

  return {
    highlightCode,
    supportedLanguages,
  };
}

/**
 * Code block renderer composable
 */
export function useCodeBlockRenderer() {
  const { highlightCode } = useHighlight();

  /**
   * Render code block content to HTML
   */
  function renderCodeBlock(content: string): string | null {
    const codeInfo = parseCodeBlock(content);
    if (!codeInfo) {
      return null;
    }

    const highlighted = highlightCode(codeInfo.code, codeInfo.lang);
    const langLabel = codeInfo.lang
      ? `<div class="code-lang-label">${escapeHtml(codeInfo.lang)}</div>`
      : '';

    return `<div class="code-block-wrapper">${langLabel}<pre class="hljs"><code>${highlighted}</code></pre></div>`;
  }

  return {
    renderCodeBlock,
    highlightCode,
  };
}

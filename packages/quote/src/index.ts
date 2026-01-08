/**
 * @live-editor/quote
 * Blockquote rendering for live-editor
 */

import { marked } from 'marked';

/**
 * Quote renderer composable
 */
export function useQuoteRenderer() {
  /**
   * Render blockquote content to HTML
   */
  function renderQuote(content: string): string {
    return marked.parse(content, { async: false }) as string;
  }

  return {
    renderQuote,
  };
}

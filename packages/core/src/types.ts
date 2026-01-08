/**
 * @live-editor/core - Type definitions
 */

/**
 * Block type
 */
export interface Block {
  id: string;
  content: string;
}

export type BlockType =
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'code-block'
  | 'checklist'
  | 'bullet-list'
  | 'numbered-list'
  | 'blockquote'
  | 'table'
  | 'empty'
  | 'paragraph';

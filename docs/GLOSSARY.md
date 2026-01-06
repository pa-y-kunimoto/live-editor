# Ubiquitous Language / Glossary

This document defines the domain-specific terminology used throughout the Live Editor project. All team members should use these terms consistently in code, documentation, and communication.

## Core Concepts

### Block

A **Block** is the fundamental unit of content in the editor. Each block represents a single logical piece of markdown content that can be edited, rendered, and manipulated independently.

```typescript
interface Block {
  id: string      // Unique identifier (e.g., "block-0", "block-1")
  content: string // Raw markdown content of the block
}
```

**Usage in code:** `useMarkdownBlocks`, `Block`, `blocks`

### Block Type

A **Block Type** categorizes a block based on its markdown content. The editor uses block types to determine how to render and interact with each block.

| Type | Description | Markdown Pattern |
|------|-------------|------------------|
| `heading-1` | Level 1 heading | `# Title` |
| `heading-2` | Level 2 heading | `## Subtitle` |
| `heading-3` | Level 3 heading | `### Section` |
| `code-block` | Fenced code block | ` ```lang ... ``` ` |
| `checklist` | Task list items | `- [ ] Task` or `- [x] Done` |
| `bullet-list` | Unordered list | `- Item` or `* Item` |
| `numbered-list` | Ordered list | `1. Item` |
| `blockquote` | Quote block | `> Quote` |
| `table` | Markdown table | `\| A \| B \|` |
| `empty` | Empty line | (blank) |
| `paragraph` | Regular text | Any other content |

**Usage in code:** `BlockType`, `getBlockType()`

### Section

A **Section** is a hierarchical grouping of blocks that starts with a heading and includes all subsequent blocks until the next heading of equal or higher level. Sections are used for operations like "copy section".

**Example:**
```markdown
# Section 1       <- Section includes this heading and...
Paragraph text    <- ...this paragraph
## Subsection     <- ...and this subsection
More content      <- ...and this content

# Section 2       <- This starts a new section
```

**Usage in code:** `getSectionBlockIds()`

## Editor Operations

### Editing State

The **Editing State** tracks which block is currently being edited by the user. Only one block can be in editing mode at a time.

- `editingBlockIndex` - The index of the block currently being edited (null if none)
- `editingBlockId` - The ID of the block currently being edited

**Usage in code:** `useBlockEditor`, `editingBlockIndex`, `editingBlockId`

### Hover State

The **Hover State** tracks which block the user is hovering over, used for displaying contextual UI elements like copy buttons and drag handles.

- `hoveredBlockId` - The ID of the block being hovered
- `hoveredCopyBlockId` - The ID for showing section copy UI

**Usage in code:** `hoveredBlockId`, `hoveredCopyBlockId`

### Block Rendering

**Block Rendering** is the process of converting raw markdown content into HTML for display. This includes:

1. Syntax highlighting for code blocks
2. Checklist item rendering with checkboxes
3. Standard markdown parsing (headings, lists, links, etc.)
4. Link preview card generation

**Usage in code:** `useMarkdownRenderer`, `renderBlock()`, `getRenderedBlock()`

## Link Preview

### Link Preview

A **Link Preview** is an enhanced display for URL links, showing OGP (Open Graph Protocol) metadata such as title, description, image, and favicon.

```typescript
interface LinkPreview {
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
  favicon: string | null
}
```

**Usage in code:** `useLinkPreview`, `LinkPreview`, `linkPreviews`

### Loading State

The **Loading State** for link previews tracks which URLs are currently being fetched for their metadata.

**Usage in code:** `loadingUrls`

## History & Undo/Redo

### Editor History

**Editor History** is the undo/redo system that tracks content changes over time. Each history state captures:

- The full markdown content
- Which block was being edited
- The cursor position

```typescript
interface HistoryState {
  content: string
  editingBlockIndex: number | null
  cursorPos: number | null
}
```

**Usage in code:** `useEditorHistory`, `history`, `historyIndex`

### Undo/Redo Operations

- **Undo** - Restores the previous state from history
- **Redo** - Restores the next state from history (after an undo)

**Usage in code:** `undo()`, `redo()`, `isUndoRedo`

## Formatting

### Format Toolbar

The **Format Toolbar** provides quick access to text formatting commands. Available formats:

| Format | Description | Markdown |
|--------|-------------|----------|
| `bold` | Bold text | `**text**` |
| `italic` | Italic text | `*text*` |
| `strikethrough` | Strikethrough | `~~text~~` |
| `code` | Inline code | `` `code` `` |
| `link` | Hyperlink | `[text](url)` |
| `h1` | Heading 1 | `# ` |
| `h2` | Heading 2 | `## ` |
| `h3` | Heading 3 | `### ` |
| `bullet` | Bullet list | `- ` |
| `numbered` | Numbered list | `1. ` |
| `checklist` | Checklist | `- [ ] ` |
| `quote` | Blockquote | `> ` |

**Usage in code:** `useFormatToolbar`, `FormatType`, `applyFormat()`

## Drag and Drop

### Block Reordering

**Block Reordering** allows users to change the order of blocks by dragging and dropping. The drag handle is visible on hover.

- `draggedBlockIndex` - Index of the block being dragged
- `dragOverBlockIndex` - Index of the block being dragged over (drop target)

**Usage in code:** `handleDragStart()`, `handleDragOver()`, `handleDrop()`, `handleDragEnd()`

## Keyboard Handling

### Keyboard Shortcuts

**Keyboard Shortcuts** provide efficient navigation and editing. Key handlers include:

| Action | Shortcut | Description |
|--------|----------|-------------|
| Enter | `Enter` | Split block or create new block |
| Backspace | `Backspace` | Merge with previous block if at start |
| Tab | `Tab` | Indent list item |
| Shift+Tab | `Shift+Tab` | Outdent list item |
| Arrow Up | `ArrowUp` | Navigate to previous block |
| Arrow Down | `ArrowDown` | Navigate to next block |
| Undo | `Cmd/Ctrl+Z` | Undo last change |
| Redo | `Cmd/Ctrl+Shift+Z` | Redo last undone change |

**Usage in code:** `useKeyboardHandler`

## Document Operations

### Document

A **Document** represents the complete markdown content being edited. The document is stored as a single string and parsed into blocks for editing.

**Usage in code:** `useMarkdownDocument`, `markdownContent`

### Copy to Clipboard

**Copy to Clipboard** exports the current document content to the system clipboard, with proper markdown formatting preserved.

**Usage in code:** `copyToClipboard()`, `formatMarkdownForCopy()`

## Table Generation

### Table Generator

The **Table Generator** creates markdown tables from a simple command syntax.

**Command format:** `/table <rows> <cols>`

**Example:** `/table 3 4` creates a 3-row, 4-column table

**Usage in code:** `useTableGenerator`, `parseTableCommand()`, `generateTableMarkdown()`

## Code Highlighting

### Syntax Highlighting

**Syntax Highlighting** uses highlight.js to colorize code blocks based on the specified programming language.

**Usage in code:** `useHighlight`, `highlightCode()`

## Composables Summary

| Composable | Purpose |
|------------|---------|
| `useMarkdownBlocks` | Parses content into blocks, determines block types |
| `useMarkdownRenderer` | Renders blocks to HTML, handles previews |
| `useBlockEditor` | Manages editing state, handles user interactions |
| `useLinkPreview` | Fetches and manages link preview data |
| `useEditorHistory` | Tracks content history for undo/redo |
| `useFormatToolbar` | Applies text formatting |
| `useKeyboardHandler` | Handles keyboard shortcuts and navigation |
| `useTableGenerator` | Generates markdown tables |
| `useHighlight` | Provides syntax highlighting |
| `useMarkdownDocument` | Manages document loading and copying |

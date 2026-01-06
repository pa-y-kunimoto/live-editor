# Live Editor

A block-based Markdown editor with real-time preview, built with Nuxt.js and Vue 3.

## Demo

![Live Editor Demo](./docs/assets/demo.gif)

## Overview

Live Editor is a modern, block-based markdown editor that provides an intuitive WYSIWYG-like editing experience while maintaining full markdown compatibility. Each piece of content is treated as an independent "block" that can be edited, moved, and styled individually.

### Key Features

- **Block-based Editing** - Content is organized into discrete blocks (headings, paragraphs, lists, code, etc.)
- **Real-time Preview** - See rendered markdown as you type
- **Syntax Highlighting** - Code blocks with language-specific highlighting
- **Link Previews** - OGP metadata display for URLs
- **Drag & Drop** - Reorder blocks by dragging
- **Undo/Redo** - Full history support with cursor position restoration
- **Keyboard Shortcuts** - Efficient navigation and formatting
- **Checklists** - Interactive task lists with checkbox toggling
- **Table Generation** - Quick table creation with `/table` command

## Getting Started

See [docs/QUICKSTART.md](./docs/QUICKSTART.md) for a quick start guide.

### Prerequisites

- Node.js >= 22.0.0
- pnpm >= 8.0.0

### Installation

```bash
pnpm install
```

### Development

```bash
# Start the development server
pnpm dev

# Run tests
pnpm test

# Run linter
pnpm lint
```

## Documentation

- [Quick Start](./docs/QUICKSTART.md) - Getting started guide
- [Architecture](./docs/ARCHITECTURE.md) - System architecture and composables
- [Glossary](./docs/GLOSSARY.md) - Domain terminology (ubiquitous language)
- [Contributing](./CONTRIBUTING.md) - Development workflow and guidelines

## Tech Stack

- **Framework:** Nuxt.js 4 / Vue 3
- **Language:** TypeScript
- **Markdown:** marked
- **Syntax Highlighting:** highlight.js
- **Testing:** Vitest + @vue/test-utils
- **Package Manager:** pnpm (monorepo)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

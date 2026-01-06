# Architecture Documentation

## Overview

The live-editor project is designed as a monorepo using pnpm workspaces, enabling efficient code sharing and unified dependency management across multiple packages. The main application is a block-based Markdown editor built with Nuxt.js and Vue 3.

## Monorepo Structure

```
live-editor/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI pipeline
├── apps/
│   └── web/                    # Nuxt.js web application
│       ├── components/         # Vue components
│       │   └── MarkdownEditor.vue
│       ├── composables/        # Vue composables (business logic)
│       │   ├── useMarkdownBlocks.ts
│       │   ├── useMarkdownRenderer.ts
│       │   ├── useBlockEditor.ts
│       │   ├── useLinkPreview.ts
│       │   ├── useEditorHistory.ts
│       │   ├── useFormatToolbar.ts
│       │   ├── useKeyboardHandler.ts
│       │   ├── useTableGenerator.ts
│       │   ├── useHighlight.ts
│       │   └── useMarkdownDocument.ts
│       ├── pages/              # Nuxt pages
│       ├── server/             # Server API routes
│       │   └── api/
│       │       └── fetch-title.ts  # OGP metadata fetcher
│       └── public/             # Static assets
├── packages/
│   ├── core/                   # Core utilities and types
│   │   ├── src/
│   │   │   └── index.ts       # Form types and validation
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   └── web/                    # Web package
│       ├── src/
│       │   └── index.ts       # LiveEditor class
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
├── docs/
│   ├── ARCHITECTURE.md        # This file
│   ├── GLOSSARY.md            # Ubiquitous language definitions
│   └── QUICKSTART.md          # Quick start guide
├── package.json               # Root package configuration
├── pnpm-workspace.yaml        # Workspace definition
├── .eslintrc.js              # ESLint configuration
├── .prettierrc.js            # Prettier configuration
├── tsconfig.json             # TypeScript base config
├── CONTRIBUTING.md           # Development guidelines
└── README.md                 # Project overview
```

## Package Architecture

### apps/web (Nuxt.js Application)

**Purpose**: Block-based Markdown editor with real-time preview

The main application is built with Nuxt.js 4 and follows Vue 3's Composition API patterns. Business logic is separated into composables for maintainability and testability.

#### Composables Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MarkdownEditor.vue                            │
│                    (Main Component)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌─────────────────┐   ┌─────────────────┐
│useMarkdownBlocks│   │useBlockEditor   │   │useMarkdownDocument│
│ - Parse content │   │ - Edit state    │   │ - Load/save     │
│ - Block types   │   │ - Drag & drop   │   │ - Clipboard     │
└───────────────┘   └─────────────────┘   └─────────────────┘
        │                     │
        ▼                     ▼
┌───────────────┐   ┌─────────────────┐   ┌─────────────────┐
│useMarkdownRenderer│ │useKeyboardHandler│ │useEditorHistory │
│ - HTML output  │   │ - Shortcuts     │   │ - Undo/redo     │
│ - Link preview │   │ - Navigation    │   │ - State tracking│
└───────────────┘   └─────────────────┘   └─────────────────┘
        │                     │
        ▼                     ▼
┌───────────────┐   ┌─────────────────┐   ┌─────────────────┐
│useLinkPreview │   │useFormatToolbar │   │useTableGenerator│
│ - OGP fetch   │   │ - Bold, italic  │   │ - /table command│
│ - Preview card│   │ - Headings      │   │ - Table markup  │
└───────────────┘   └─────────────────┘   └─────────────────┘
        │
        ▼
┌───────────────┐
│useHighlight   │
│ - Syntax color│
└───────────────┘
```

#### Composable Details

| Composable            | Purpose                     | Key Exports                                                                                 |
| --------------------- | --------------------------- | ------------------------------------------------------------------------------------------- |
| `useMarkdownBlocks`   | Parses markdown into blocks | `blocks`, `getBlockType()`, `parseCodeBlock()`, `parseChecklist()`, `getSectionBlockIds()`  |
| `useMarkdownRenderer` | Renders blocks to HTML      | `renderBlock()`, `getRenderedBlock()`, `linkPreviews`, `loadingUrls`                        |
| `useBlockEditor`      | Manages editing state       | `editingBlockIndex`, `startEditing()`, `updateBlock()`, `handleDragStart()`, `handleDrop()` |
| `useLinkPreview`      | Fetches OGP metadata        | `processUrlBlock()`, `fetchPreview()`                                                       |
| `useEditorHistory`    | Undo/redo functionality     | `history`, `undo()`, `redo()`, `isUndoRedo`                                                 |
| `useFormatToolbar`    | Text formatting             | `applyFormat()` with types: bold, italic, code, link, h1-h3, lists                          |
| `useKeyboardHandler`  | Keyboard events             | `handleKeyDown()` for Enter, Backspace, Tab, arrows                                         |
| `useTableGenerator`   | Table creation              | `parseTableCommand()`, `generateTableMarkdown()`                                            |
| `useHighlight`        | Syntax highlighting         | `highlightCode()` using highlight.js                                                        |
| `useMarkdownDocument` | Document operations         | `markdownContent`, `loadDefaultContent()`, `copyToClipboard()`                              |

#### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Input                                  │
│              (typing, clicking, keyboard)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    useBlockEditor                                │
│              Handle user interactions                            │
│         Update content, manage editing state                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   useMarkdownBlocks                              │
│              Parse content into blocks                           │
│         Determine block types (heading, code, list, etc.)        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  useMarkdownRenderer                             │
│                Render blocks to HTML                             │
│      Apply syntax highlighting, create preview cards             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vue Template                                  │
│              Display rendered content                            │
│         Interactive editing with textarea overlays               │
└─────────────────────────────────────────────────────────────────┘
```

#### Server API

The application includes a server-side API for OGP metadata fetching:

**`/api/fetch-title`** - Fetches OGP metadata for a given URL

```typescript
// Request
GET / api / fetch - title
  ? (url = https) //example.com
  : // Response
    {
      title: 'Example Domain',
      description: 'This domain is for use in examples...',
      image: 'https://example.com/og-image.png',
      siteName: 'Example',
      favicon: 'https://example.com/favicon.ico',
    };
```

### @live-editor/core

**Purpose**: Shared utilities, types, and validation logic

**Key Components**:

- `FormField` interface - Defines the structure of form fields
- `FormData` interface - Contains form state with timestamp
- `validateField()` - Single field validation
- `validateForm()` - Complete form validation

**Dependencies**: None (intentionally lightweight)

**Exports**:

```typescript
export interface FormField { ... }
export interface FormData { ... }
export function validateField(field: FormField): boolean
export function validateForm(formData: FormData): boolean
```

### @live-editor/web

**Purpose**: Web package for form editing utilities

**Key Components**:

- `LiveEditor` class - Main editor instance managing form state
- `addField()` - Adds a new field to the form
- `removeField()` - Removes a field by ID
- `updateField()` - Updates field value with timestamp
- `validate()` - Validates current form state
- `getFormData()` - Returns immutable snapshot of form data

**Dependencies**:

- `@live-editor/core` (workspace dependency)

## Design Principles

### 1. Separation of Concerns

- **Composables** contain business logic without UI concerns
- **Components** handle presentation and user interactions
- **Server API** handles external data fetching
- Clear boundaries between layers

### 2. Type Safety

- TypeScript used throughout
- Strict mode enabled
- Comprehensive type definitions
- Interfaces for all domain objects (Block, LinkPreview, etc.)

### 3. Immutability

- Vue reactive refs for state management
- Content updates through emit rather than direct mutation
- History tracking for undo/redo support

### 4. Single Responsibility

Each composable has a clear, focused purpose:

- `useMarkdownBlocks`: Parsing only
- `useMarkdownRenderer`: Rendering only
- `useBlockEditor`: User interaction only
- etc.

### 5. Testability

- Business logic in composables can be unit tested independently
- Integration tests verify composable interactions
- 160+ tests with Vitest

## Data Flow

```
┌─────────────────────────────────────────────────┐
│                  User Action                     │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│            LiveEditor (web package)              │
│  • Manages form state                           │
│  • Handles CRUD operations                      │
│  • Updates timestamps                           │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│         Validation (core package)                │
│  • validateField()                              │
│  • validateForm()                               │
│  • Returns boolean result                       │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│              User Feedback                       │
└─────────────────────────────────────────────────┘
```

## Technology Stack

### Build Tools

- **pnpm** - Fast, efficient package manager with workspace support
- **TypeScript** - Type-safe JavaScript with modern features
- **ESLint** - Code quality and consistency
- **Prettier** - Automatic code formatting

### CI/CD

- **GitHub Actions** - Automated testing and validation
- **Caching** - pnpm cache for faster builds
- **Parallel Jobs** - Lint, build, and test run independently

## Dependency Management

### Workspace Protocol

Internal dependencies use the `workspace:*` protocol:

```json
{
  "dependencies": {
    "@live-editor/core": "workspace:*"
  }
}
```

This ensures:

- Always uses the local version during development
- Resolves to the correct version when published
- Enables hot reloading during development

### Version Synchronization

- All packages start at version 0.1.0
- Versions should be bumped together for major releases
- Independent versioning allowed for patch/minor updates

## Build Process

### Development Build

```bash
pnpm dev
```

Runs TypeScript in watch mode across all packages, enabling:

- Instant recompilation on file changes
- Real-time error feedback
- Parallel package building

### Production Build

```bash
pnpm build
```

Compiles TypeScript to JavaScript with:

- Type declaration files (.d.ts)
- Source maps for debugging
- Optimized output

## Testing Strategy

### Current State

The project has comprehensive test coverage with 160+ tests using Vitest.

### Test Structure

```
apps/web/
├── components/__tests__/
│   └── MarkdownEditor.integration.test.ts  # Component tests
└── composables/__tests__/
    ├── useMarkdownBlocks.test.ts           # 32 tests
    ├── useMarkdownRenderer.test.ts         # 23 tests
    ├── useEditorHistory.test.ts            # 13 tests
    ├── useFormatToolbar.test.ts            # 27 tests
    ├── useTableGenerator.test.ts           # 19 tests
    ├── useMarkdownDocument.test.ts         # 21 tests
    └── integration.test.ts                 # 10 tests
```

### Testing Tools

- **Vitest** - Fast unit testing framework
- **@vue/test-utils** - Vue component testing utilities
- **happy-dom** - Lightweight DOM implementation for tests

## CI/CD Pipeline

### Stages

1. **Lint**
   - ESLint checks
   - Prettier formatting validation
   - Parallel execution for speed

2. **Build**
   - TypeScript compilation
   - All packages built in dependency order
   - Artifacts uploaded for debugging

3. **Test**
   - Runs after successful build
   - Tests all packages
   - Requires build artifacts

4. **Validate**
   - Confirms all stages passed
   - Required for PR merging

### Caching Strategy

- pnpm cache stored between runs
- Speeds up dependency installation
- Reduces CI execution time

## Scalability Considerations

### Adding New Packages

1. Create directory in `packages/`
2. Add `package.json` with `@live-editor/` scope
3. Run `pnpm install` to register
4. Add package-specific README

### Package Organization

Consider organizing by:

- **Feature** - Group related functionality
- **Layer** - Separate UI, logic, data layers
- **Domain** - Business domain boundaries

### Future Expansion

Potential packages:

- `@live-editor/ui` - Reusable UI components
- `@live-editor/server` - Backend API
- `@live-editor/utils` - General utilities
- `@live-editor/types` - Shared TypeScript types

## Performance Optimization

### Build Performance

- **Parallel builds** with `pnpm -r --parallel`
- **Incremental compilation** with TypeScript
- **Cached dependencies** with pnpm

### Runtime Performance

- **Tree shaking** - Only import what's needed
- **Code splitting** - Separate bundles for each package
- **Minimal dependencies** - Keep packages lightweight

## Security Considerations

### Dependency Management

- Use `pnpm audit` to check for vulnerabilities
- Keep dependencies up to date
- Review dependency changes in PRs

### Code Quality

- ESLint catches common security issues
- TypeScript prevents type-related bugs
- CI ensures all checks pass before merge

## Maintenance Guidelines

### Documentation

- Keep README files current
- Update architecture docs when structure changes
- Document breaking changes

### Versioning

- Follow semantic versioning (semver)
- Document changes in CHANGELOG (future)
- Coordinate version bumps across packages

### Deprecation

- Announce deprecations in advance
- Provide migration guides
- Maintain backward compatibility when possible

## AI-Friendly Features

This architecture is designed to be easily understood by AI coding assistants:

### Clear Structure

- Consistent package organization
- Self-documenting code structure
- Predictable file locations

### Comprehensive Documentation

- Inline JSDoc comments
- Package-level README files
- Architecture documentation

### Type Definitions

- Full TypeScript coverage
- Exported interfaces
- Clear type relationships

### Conventional Patterns

- Standard monorepo layout
- Common tooling (pnpm, TypeScript, ESLint)
- Familiar CI/CD setup

## Troubleshooting

### Common Issues

**Build failures**:

```bash
pnpm clean
pnpm install
pnpm build
```

**Type errors**:

```bash
pnpm --filter @live-editor/core build
pnpm --filter @live-editor/web build
```

**Dependency issues**:

```bash
rm -rf node_modules packages/*/node_modules
pnpm install
```

## Future Roadmap

### Short Term

- Add comprehensive test suite
- Implement actual UI for web package
- Add integration examples

### Medium Term

- Add UI component library
- Backend API package
- Real-time sync capabilities

### Long Term

- Plugin system
- Multi-user collaboration
- Cloud deployment

# live-editor

A monorepo for a prototype live editor with real-time form rendering capabilities.

## 📋 Overview

This project demonstrates a monorepo architecture using pnpm workspaces, featuring:

- **Real-time form editing** with live validation
- **Modular architecture** with shared core utilities
- **TypeScript** for type safety across all packages
- **Automated CI/CD** with GitHub Actions

## 🏗️ Architecture

This monorepo contains the following packages:

- **[@live-editor/core](./packages/core)** - Core utilities, types, and validation logic
- **[@live-editor/web](./packages/web)** - Web application for live form editing

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed architecture documentation.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Development

```bash
# Run all packages in development mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Run linter
pnpm lint

# Format code
pnpm format
```

## 📦 Packages

### Core (`@live-editor/core`)

Core utilities and types for form management:

```typescript
import { FormField, validateForm } from '@live-editor/core';
```

### Web (`@live-editor/web`)

Web application for live form editing:

```typescript
import { LiveEditor } from '@live-editor/web';

const editor = new LiveEditor();
editor.addField({ id: 'name', type: 'text', label: 'Name', value: '' });
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in a specific package
pnpm --filter @live-editor/core test
```

## 📝 Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our development process and how to submit pull requests.

## 🔧 CI/CD

This project uses GitHub Actions for continuous integration:

- **Linting** - ESLint and Prettier checks
- **Building** - TypeScript compilation for all packages
- **Testing** - Automated test execution
- **Validation** - Ensures all checks pass before merging

See [.github/workflows/ci.yml](./.github/workflows/ci.yml) for the full CI configuration.

## 📚 Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md) - Detailed system architecture
- [Contributing Guide](./CONTRIBUTING.md) - Development workflow and guidelines

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

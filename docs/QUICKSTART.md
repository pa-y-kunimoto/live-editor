# Quick Start Guide

Get up and running with the live-editor monorepo in minutes.

## Prerequisites

Ensure you have the following installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **pnpm** >= 8.0.0

## Installation

### 1. Install pnpm

```bash
npm install -g pnpm
```

### 2. Clone the repository

```bash
git clone https://github.com/pa-y-kunimoto/live-editor.git
cd live-editor
```

### 3. Install dependencies

```bash
pnpm install
```

This will install dependencies for all packages in the workspace.

### 4. Build all packages

```bash
pnpm build
```

## Common Tasks

### Development

Run all packages in watch mode:

```bash
pnpm dev
```

### Building

Build all packages:

```bash
pnpm build
```

Build a specific package:

```bash
pnpm --filter @live-editor/core build
```

### Testing

Run all tests:

```bash
pnpm test
```

Test a specific package:

```bash
pnpm --filter @live-editor/web test
```

### Linting

Check code quality:

```bash
pnpm lint
```

### Formatting

Format all code:

```bash
pnpm format
```

Check formatting without changes:

```bash
pnpm format:check
```

### Clean

Remove all build artifacts and dependencies:

```bash
pnpm clean
```

## Project Structure

```
live-editor/
├── packages/
│   ├── core/          # @live-editor/core - Core utilities
│   └── web/           # @live-editor/web - Web application
├── docs/              # Documentation
├── .github/           # GitHub Actions workflows
└── ...config files
```

## Key Commands Reference

| Command        | Description                            |
| -------------- | -------------------------------------- |
| `pnpm install` | Install all dependencies               |
| `pnpm build`   | Build all packages                     |
| `pnpm dev`     | Run in development mode                |
| `pnpm test`    | Run all tests                          |
| `pnpm lint`    | Lint all code                          |
| `pnpm format`  | Format all code                        |
| `pnpm clean`   | Clean build artifacts and node modules |

## Working with Specific Packages

Use the `--filter` flag to run commands on specific packages:

```bash
# Install a dependency to core package
pnpm --filter @live-editor/core add lodash

# Run dev mode for web package only
pnpm --filter @live-editor/web dev

# Build core package only
pnpm --filter @live-editor/core build
```

## Troubleshooting

### Build Errors

If you encounter build errors, try:

```bash
pnpm clean
pnpm install
pnpm build
```

### Dependency Issues

If you have dependency conflicts:

```bash
rm -rf node_modules packages/*/node_modules pnpm-lock.yaml
pnpm install
```

### Type Errors

Make sure core is built before web:

```bash
pnpm --filter @live-editor/core build
pnpm --filter @live-editor/web build
```

## Next Steps

- Read the [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines
- Check [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for system design
- Explore the [packages](./packages/) directory for code examples

## Getting Help

- Check the [documentation](./docs/)
- Review [open issues](https://github.com/pa-y-kunimoto/live-editor/issues)
- Read [package READMEs](./packages/) for package-specific info

## Continuous Integration

Every PR is automatically checked for:

- ✅ Code formatting (Prettier)
- ✅ Linting (ESLint)
- ✅ TypeScript compilation
- ✅ Tests passing

Make sure to run these locally before pushing:

```bash
pnpm format && pnpm lint && pnpm build && pnpm test
```

Happy coding! 🚀

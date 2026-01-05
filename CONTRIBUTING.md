# Contributing to live-editor

Thank you for your interest in contributing to live-editor! This guide will help you get started.

## 🏗️ Development Setup

### Prerequisites

- **Node.js** >= 24.0.0
- **pnpm** >= 8.0.0
- **Git**

### Initial Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/your-username/live-editor.git
cd live-editor
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Build all packages**

```bash
pnpm build
```

## 🔄 Development Workflow

### Creating a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### Making Changes

1. **Make your changes** in the appropriate package(s)
2. **Format your code**

```bash
pnpm format
```

3. **Run linter**

```bash
pnpm lint
```

4. **Build the packages**

```bash
pnpm build
```

5. **Run tests**

```bash
pnpm test
```

### Working with Packages

#### Working on a specific package

```bash
# Navigate to the package
cd packages/core

# Or use pnpm filter from root
pnpm --filter @live-editor/core dev
```

#### Adding dependencies

```bash
# Add to a specific package
pnpm --filter @live-editor/core add lodash

# Add dev dependency
pnpm --filter @live-editor/core add -D @types/lodash

# Add to root (for dev tools)
pnpm add -w -D prettier
```

#### Creating a new package

1. Create a new directory under `packages/`
2. Add a `package.json` with the name `@live-editor/your-package`
3. Run `pnpm install` to register it in the workspace

### Commit Guidelines

We follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build process or auxiliary tool changes

Example:

```bash
git commit -m "feat(core): add field validation utility"
git commit -m "fix(web): resolve form update race condition"
git commit -m "docs: update README with examples"
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @live-editor/core test

# Run tests in watch mode (if configured)
pnpm --filter @live-editor/core test:watch
```

### Writing Tests

- Place test files next to the source files or in a `__tests__` directory
- Use descriptive test names
- Follow existing test patterns in the codebase

## 🎨 Code Style

### TypeScript

- Use TypeScript for all new code
- Define clear interfaces and types
- Avoid using `any` type when possible
- Use strict mode

### Formatting

- We use Prettier for code formatting
- Run `pnpm format` before committing
- Configuration is in `.prettierrc.js`

### Linting

- We use ESLint for code linting
- Run `pnpm lint` before committing
- Configuration is in `.eslintrc.js`

## 📋 Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Run all checks locally**:

```bash
pnpm format
pnpm lint
pnpm build
pnpm test
```

3. **Push your branch** to your fork

```bash
git push origin feature/your-feature-name
```

4. **Create a Pull Request** on GitHub
5. **Fill out the PR template** with details about your changes
6. **Wait for CI checks** to pass
7. **Address review feedback** if any

### PR Title Format

Use conventional commit format:

- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`

## 🔍 CI/CD Pipeline

Our CI pipeline runs on every pull request:

- **Formatting Check** - Ensures code is properly formatted
- **Linting** - Checks for code quality issues
- **Build** - Compiles all TypeScript packages
- **Tests** - Runs the test suite

All checks must pass before a PR can be merged.

## 📝 Documentation

- Keep README files up to date in each package
- Document public APIs with JSDoc comments
- Update architecture docs when making structural changes
- Add inline comments for complex logic

## 💡 Best Practices

### Monorepo Guidelines

- **Keep packages focused** - Each package should have a single responsibility
- **Use workspace dependencies** - Reference internal packages with `workspace:*`
- **Avoid circular dependencies** - Keep dependency graph acyclic
- **Share common config** - Use root configs for shared tooling

### Code Guidelines

- **Write self-documenting code** - Use clear variable and function names
- **Keep functions small** - Each function should do one thing well
- **Use TypeScript effectively** - Leverage the type system for safety
- **Handle errors gracefully** - Always consider error cases

### Performance

- **Minimize dependencies** - Only add necessary dependencies
- **Optimize builds** - Keep build times reasonable
- **Cache appropriately** - Use caching where beneficial

## 🐛 Reporting Issues

When reporting issues:

1. **Check existing issues** first
2. **Use the issue template** if available
3. **Provide reproduction steps**
4. **Include environment details** (Node version, OS, etc.)
5. **Add relevant code snippets** or error messages

## 💬 Getting Help

- **Documentation** - Check docs/ directory
- **Issues** - Search or create GitHub issues
- **Discussions** - Use GitHub Discussions for questions

## 📜 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment

Thank you for contributing to live-editor! 🎉

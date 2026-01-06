# @live-editor/core

Core utilities and types for the live-editor monorepo.

## Features

- **Type definitions** for form fields and data structures
- **Validation utilities** for form data
- **Shared interfaces** used across the monorepo

## Usage

```typescript
import { FormField, validateField, validateForm } from '@live-editor/core';

const field: FormField = {
  id: 'email',
  type: 'email',
  label: 'Email Address',
  value: 'user@example.com',
  required: true,
};

const isValid = validateField(field);
```

## Development

```bash
# Build the package
pnpm build

# Watch mode for development
pnpm dev

# Run linting
pnpm lint
```

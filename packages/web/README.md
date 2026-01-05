# @live-editor/web

Web application for real-time form editing using the live-editor core.

## Features

- **LiveEditor class** for managing form state
- **Real-time updates** with automatic validation
- **Uses @live-editor/core** for shared types and utilities

## Usage

```typescript
import { LiveEditor, createExampleEditor } from '@live-editor/web';

// Create a new editor instance
const editor = new LiveEditor();

// Add fields
editor.addField({
  id: 'username',
  type: 'text',
  label: 'Username',
  value: '',
  required: true,
});

// Update field values
editor.updateField('username', 'john_doe');

// Validate the form
const isValid = editor.validate();

// Get form data
const formData = editor.getFormData();
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

<script setup lang="ts">
const markdownContent = ref(`# Welcome to Live Editor

This is a **block-based** WYSIWYG markdown editor.

## Features

- Real-time rendering
- Block-based editing
- Full markdown support

### Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### Task List

- Design the interface
- Implement core features
- Add keyboard shortcuts

> "The best way to predict the future is to invent it." - Alan Kay

| Feature | Status |
|---------|--------|
| Headings | Done |
| Lists | Done |
| Code blocks | Done |
`)
</script>

<template>
  <div class="app">
    <nav class="navbar">
      <div class="navbar-brand">
        <div class="logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
          </svg>
        </div>
        <span class="brand-text">Live Editor</span>
      </div>
      <div class="navbar-meta">
        <span class="status-badge">
          <span class="status-dot" />
          Editing
        </span>
      </div>
    </nav>

    <main class="main-content">
      <div class="editor-wrapper">
        <div class="editor-header">
          <div class="editor-title">
            <h1>Untitled Document</h1>
            <p class="editor-subtitle">WYSIWYG Markdown Editor - Click any block to edit</p>
          </div>
          <div class="editor-actions">
            <button class="btn btn-ghost">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save
            </button>
            <button class="btn btn-ghost">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Export
            </button>
          </div>
        </div>

        <div class="toolbar">
          <div class="toolbar-group">
            <button class="toolbar-btn" title="Heading 1">
              <span class="toolbar-btn-text">H1</span>
            </button>
            <button class="toolbar-btn" title="Heading 2">
              <span class="toolbar-btn-text">H2</span>
            </button>
            <button class="toolbar-btn" title="Heading 3">
              <span class="toolbar-btn-text">H3</span>
            </button>
          </div>
          <div class="toolbar-divider" />
          <div class="toolbar-group">
            <button class="toolbar-btn" title="Bold">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
                <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
              </svg>
            </button>
            <button class="toolbar-btn" title="Italic">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="4" x2="10" y2="4" />
                <line x1="14" y1="20" x2="5" y2="20" />
                <line x1="15" y1="4" x2="9" y2="20" />
              </svg>
            </button>
            <button class="toolbar-btn" title="Strikethrough">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4H9a3 3 0 0 0-3 3v0a3 3 0 0 0 3 3h6" />
                <path d="M8 20h7a3 3 0 0 0 3-3v0a3 3 0 0 0-3-3H6" />
                <line x1="4" y1="12" x2="20" y2="12" />
              </svg>
            </button>
            <button class="toolbar-btn" title="Code">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </button>
          </div>
          <div class="toolbar-divider" />
          <div class="toolbar-group">
            <button class="toolbar-btn" title="Bullet List">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="4" cy="6" r="1" fill="currentColor" />
                <circle cx="4" cy="12" r="1" fill="currentColor" />
                <circle cx="4" cy="18" r="1" fill="currentColor" />
              </svg>
            </button>
            <button class="toolbar-btn" title="Numbered List">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="10" y1="6" x2="21" y2="6" />
                <line x1="10" y1="12" x2="21" y2="12" />
                <line x1="10" y1="18" x2="21" y2="18" />
                <text x="2" y="8" font-size="8" fill="currentColor" stroke="none">1</text>
                <text x="2" y="14" font-size="8" fill="currentColor" stroke="none">2</text>
                <text x="2" y="20" font-size="8" fill="currentColor" stroke="none">3</text>
              </svg>
            </button>
            <button class="toolbar-btn" title="Quote">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21" />
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3" />
              </svg>
            </button>
          </div>
          <div class="toolbar-divider" />
          <div class="toolbar-group">
            <button class="toolbar-btn" title="Link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>
            <button class="toolbar-btn" title="Image">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>
            <button class="toolbar-btn" title="Code Block">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M8 10l-2 2 2 2" />
                <path d="M16 10l2 2-2 2" />
                <line x1="12" y1="8" x2="12" y2="16" />
              </svg>
            </button>
            <button class="toolbar-btn" title="Table">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
            </button>
          </div>
        </div>

        <MarkdownEditor v-model="markdownContent" />
      </div>
    </main>

    <footer class="footer">
      <div class="footer-content">
        <span class="keyboard-hint">
          <kbd>Enter</kbd> new block
          <kbd>Backspace</kbd> merge blocks
          <kbd>Esc</kbd> finish editing
        </span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
}

.brand-text {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.navbar-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  font-size: 13px;
  color: #fff;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.main-content {
  flex: 1;
  padding: 32px 24px;
  display: flex;
  justify-content: center;
}

.editor-wrapper {
  width: 100%;
  max-width: 900px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 28px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.editor-title h1 {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.editor-subtitle {
  font-size: 13px;
  color: #888;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-ghost {
  background: transparent;
  color: #666;
}

.btn-ghost:hover {
  background: #f5f5f5;
  color: #333;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 28px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e0e0e0;
  margin: 0 8px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #555;
  cursor: pointer;
  transition: all 0.15s;
}

.toolbar-btn:hover {
  background: #e8e8e8;
  color: #111;
}

.toolbar-btn-text {
  font-size: 12px;
  font-weight: 600;
}

.footer {
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.footer-content {
  display: flex;
  justify-content: center;
}

.keyboard-hint {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

kbd {
  display: inline-block;
  padding: 3px 8px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  font-family: inherit;
  font-size: 11px;
  margin-right: 4px;
}
</style>

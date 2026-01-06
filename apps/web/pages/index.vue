<script setup lang="ts">
const markdownContent = ref('')
const showCopyNotification = ref(false)

// 初期コンテンツを読み込む
onBeforeMount(async () => {
  try {
    const content = await $fetch('/default-content.md', {
      responseType: 'text'
    })
    markdownContent.value = content as string
  } catch (err) {
    console.error('Failed to load default content:', err)
    markdownContent.value = '# Welcome to Live Editor\n\nStart editing this document.'
  }
})

function formatMarkdownForCopy(content: string): string {
  const lines = content.split('\n')
  const result: string[] = []
  let previousLineType = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // 現在の行のタイプを判定
    let currentLineType = 'text'
    if (trimmed.startsWith('#')) currentLineType = 'heading'
    else if (trimmed.match(/^[-*+]\s/) || trimmed.match(/^\d+\.\s/)) currentLineType = 'list'
    else if (trimmed.startsWith('```')) currentLineType = 'code'
    else if (trimmed.startsWith('>')) currentLineType = 'quote'
    else if (trimmed.startsWith('|')) currentLineType = 'table'
    else if (trimmed === '') currentLineType = 'empty'

    // 前の行との間に空行を追加するかどうか判定
    if (result.length > 0 && previousLineType !== 'empty' && currentLineType !== 'empty') {
      // 見出しの前後
      if (currentLineType === 'heading' && previousLineType !== 'heading') {
        result.push('')
      }
      // 見出しの後
      else if (previousLineType === 'heading' && currentLineType !== 'heading') {
        result.push('')
      }
      // リストの前後（リストが連続している場合は空行を入れない）
      else if (currentLineType === 'list' && previousLineType !== 'list') {
        result.push('')
      } else if (previousLineType === 'list' && currentLineType !== 'list') {
        result.push('')
      }
      // コードブロックの前後
      else if (currentLineType === 'code' && previousLineType !== 'code') {
        result.push('')
      } else if (previousLineType === 'code' && currentLineType !== 'code' && trimmed.startsWith('```')) {
        // コードブロックの閉じタグの後
        result.push(line)
        result.push('')
        previousLineType = 'empty'
        continue
      }
      // 引用の前後
      else if (currentLineType === 'quote' && previousLineType !== 'quote') {
        result.push('')
      } else if (previousLineType === 'quote' && currentLineType !== 'quote') {
        result.push('')
      }
      // テーブルの前後
      else if (currentLineType === 'table' && previousLineType !== 'table') {
        result.push('')
      } else if (previousLineType === 'table' && currentLineType !== 'table') {
        result.push('')
      }
    }

    result.push(line)
    previousLineType = currentLineType
  }

  return result.join('\n')
}

async function copyToClipboard() {
  try {
    const formattedContent = formatMarkdownForCopy(markdownContent.value)
    await navigator.clipboard.writeText(formattedContent)
    showCopyNotification.value = true
    setTimeout(() => {
      showCopyNotification.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
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
    </nav>

    <main class="main-content">
      <div class="editor-wrapper">
        <div class="editor-header">
          <div class="editor-title">
            <h1>Untitled Document</h1>
            <p class="editor-subtitle">WYSIWYG Markdown Editor - Click any block to edit</p>
          </div>
          <div class="editor-actions">
            <button class="btn btn-ghost" @click="copyToClipboard">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy Markdown
            </button>
          </div>
        </div>

        <!-- Copy notification -->
        <Transition name="notification">
          <div v-if="showCopyNotification" class="copy-notification">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copied to clipboard!
          </div>
        </Transition>

        <MarkdownEditor v-model="markdownContent" />
      </div>
    </main>
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

.copy-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #1a1a1a;
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.copy-notification svg {
  flex-shrink: 0;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

</style>

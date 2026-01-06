<script setup lang="ts">
import { marked } from 'marked'
import { ref, computed, watch, nextTick } from 'vue'
import { useHighlight } from '../composables/useHighlight';

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

interface Block {
  id: string
  content: string
}

interface LinkPreview {
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
  favicon: string | null
}

const { highlightCode } = useHighlight()

// 編集中のブロックインデックス（IDではなくインデックスで管理）
const editingBlockIndex = ref<number | null>(null)
const hoveredBlockId = ref<string | null>(null)
const blockRefs = ref<Map<string, HTMLTextAreaElement>>(new Map())
const highlightedBlocks = ref<Map<string, string>>(new Map())
const linkPreviews = ref<Map<string, LinkPreview>>(new Map())
const loadingUrls = ref<Set<string>>(new Set())
const toolbarRef = ref<HTMLElement | null>(null)
const showTableInput = ref(false)
const tableRows = ref(3)
const tableCols = ref(3)

// ドラッグアンドドロップ用の状態
const draggedBlockIndex = ref<number | null>(null)
const dragOverBlockIndex = ref<number | null>(null)

// コピーしたブロックIDを記録
const copiedBlockId = ref<string | null>(null)
// コピーボタンをホバー中のブロックID
const hoveredCopyBlockId = ref<string | null>(null)

// Undo/Redo用の履歴管理
interface HistoryState {
  content: string
  editingBlockIndex: number | null
  cursorPos: number | null
}
const history = ref<HistoryState[]>([{
  content: props.modelValue,
  editingBlockIndex: null,
  cursorPos: null
}])
const historyIndex = ref(0)
const isUndoRedo = ref(false)

// 編集中のブロックIDを取得するcomputed
const editingBlockId = computed(() => {
  if (editingBlockIndex.value === null) return null
  const block = blocks.value[editingBlockIndex.value]
  return block ? block.id : null
})

const blocks = computed<Block[]>(() => {
  const lines = props.modelValue.split('\n')
  const result: Block[] = []
  let currentBlock: string[] = []
  let blockId = 0

  const pushBlock = () => {
    if (currentBlock.length > 0) {
      result.push({
        id: `block-${blockId++}`,
        content: currentBlock.join('\n')
      })
      currentBlock = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // 見出し
    if (trimmed.match(/^#{1,6}\s/)) {
      pushBlock()
      result.push({
        id: `block-${blockId++}`,
        content: line
      })
      continue
    }

    // リスト項目（ネストを含む）- 連続するリスト項目を1つのブロックにまとめる
    const isListItem = trimmed.match(/^[-*+](\s|$)(\[[ x]\]\s)?/) || trimmed.match(/^\d+\.(\s|$)/)
    const isIndentedListItem = line.match(/^\s+[-*+](\s|$)(\[[ x]\]\s)?/) || line.match(/^\s+\d+\.(\s|$)/)

    if (isListItem || isIndentedListItem) {
      pushBlock()
      const listLines = [line]
      // 次の行もリスト項目（インデントされている可能性も含む）なら追加
      while (i + 1 < lines.length) {
        const nextLine = lines[i + 1]
        const nextTrimmed = nextLine.trim()
        // 空行の場合は終了
        if (nextTrimmed === '') {
          break
        }
        // リスト項目、チェックリスト、番号付きリスト、またはインデントされたリスト項目の場合は継続
        const nextIsListItem = nextTrimmed.match(/^[-*+](\s|$)(\[[ x]\]\s)?/) || nextTrimmed.match(/^\d+\.(\s|$)/)
        const nextIsIndentedListItem = nextLine.match(/^\s+[-*+](\s|$)(\[[ x]\]\s)?/) || nextLine.match(/^\s+\d+\.(\s|$)/)

        if (nextIsListItem || nextIsIndentedListItem) {
          i++
          listLines.push(nextLine)
        } else {
          break
        }
      }
      result.push({
        id: `block-${blockId++}`,
        content: listLines.join('\n')
      })
      continue
    }

    // 引用（ネストを含む）- 連続する引用行を1つのブロックにまとめる
    const isQuote = trimmed.match(/^>+\s?/)
    const isIndentedQuote = line.match(/^\s+>+\s?/)

    if (isQuote || isIndentedQuote) {
      pushBlock()
      const quoteLines = [line]
      // 次の行も引用（インデントされている可能性も含む）なら追加
      while (i + 1 < lines.length) {
        const nextLine = lines[i + 1]
        const nextTrimmed = nextLine.trim()
        // 空行の場合は終了
        if (nextTrimmed === '') {
          break
        }
        // 引用行またはインデントされた引用行の場合は継続
        const nextIsQuote = nextTrimmed.match(/^>+\s?/)
        const nextIsIndentedQuote = nextLine.match(/^\s+>+\s?/)

        if (nextIsQuote || nextIsIndentedQuote) {
          i++
          quoteLines.push(nextLine)
        } else {
          break
        }
      }
      result.push({
        id: `block-${blockId++}`,
        content: quoteLines.join('\n')
      })
      continue
    }

    // 水平線
    if (trimmed.match(/^[-*_]{3,}$/)) {
      pushBlock()
      result.push({
        id: `block-${blockId++}`,
        content: line
      })
      continue
    }

    if (trimmed.startsWith('```')) {
      pushBlock()
      const codeBlock = [line]
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeBlock.push(lines[i])
        i++
      }
      if (i < lines.length) {
        codeBlock.push(lines[i])
      }
      result.push({
        id: `block-${blockId++}`,
        content: codeBlock.join('\n')
      })
      continue
    }

    if (trimmed === '') {
      pushBlock()
      result.push({
        id: `block-${blockId++}`,
        content: ''
      })
      continue
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines = [line]
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
        i++
        tableLines.push(lines[i])
      }
      pushBlock()
      result.push({
        id: `block-${blockId++}`,
        content: tableLines.join('\n')
      })
      continue
    }

    currentBlock.push(line)
  }

  pushBlock()

  if (result.length === 0) {
    result.push({ id: 'block-0', content: '' })
  }

  return result
})

// コピーボタンをホバー中のセクションに含まれるブロックIDを計算
const sectionBlockIds = computed<Set<string>>(() => {
  if (!hoveredCopyBlockId.value) return new Set()

  const blockIndex = blocks.value.findIndex(b => b.id === hoveredCopyBlockId.value)
  if (blockIndex === -1) return new Set()

  const currentBlock = blocks.value[blockIndex]
  const currentContent = currentBlock.content.trim()

  // 見出しレベルを取得
  const headingMatch = currentContent.match(/^(#{1,6})\s/)
  if (!headingMatch) return new Set()

  const currentLevel = headingMatch[1].length
  const ids = new Set<string>([currentBlock.id])

  // 次の同レベルまたはそれ以上の見出しが現れるまでのブロックを集める
  for (let i = blockIndex + 1; i < blocks.value.length; i++) {
    const nextBlock = blocks.value[i]
    const nextContent = nextBlock.content.trim()
    const nextHeadingMatch = nextContent.match(/^(#{1,6})\s/)

    // 次の見出しが同レベルまたはそれ以上の場合は終了
    if (nextHeadingMatch && nextHeadingMatch[1].length <= currentLevel) {
      break
    }

    ids.add(nextBlock.id)
  }

  return ids
})

function getBlockType(content: string): string {
  const trimmed = content.trim()
  if (trimmed.startsWith('# ')) return 'heading-1'
  if (trimmed.startsWith('## ')) return 'heading-2'
  if (trimmed.startsWith('### ')) return 'heading-3'
  if (trimmed.startsWith('```')) return 'code-block'
  if (trimmed.match(/^[-*+]\s\[[ x]\]\s/)) return 'checklist'
  if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('+ ')) return 'bullet-list'
  if (trimmed.match(/^\d+\.\s/)) return 'numbered-list'
  if (trimmed.startsWith('> ')) return 'blockquote'
  if (trimmed.startsWith('|')) return 'table'
  if (trimmed === '') return 'empty'
  return 'paragraph'
}

function parseCodeBlock(content: string): { lang: string; code: string } | null {
  const match = content.match(/^```(\w*)\n?([\s\S]*?)```$/m)
  if (match) {
    return {
      lang: match[1] || 'text',
      code: match[2].replace(/\n$/, '')
    }
  }
  return null
}

function parseChecklist(content: string): { checked: boolean; text: string; indent: string } | null {
  const match = content.match(/^(\s*)([-*+])\s\[([ x])\]\s(.*)$/)
  if (match) {
    return {
      indent: match[1],
      checked: match[3] === 'x',
      text: match[4]
    }
  }
  return null
}

function renderLoadingPreview(url: string): string {
  const hostname = new globalThis.URL(url).hostname

  return `<div class="link-preview-card link-preview-loading">
    <div class="link-preview-content">
      <div class="link-preview-title-skeleton"></div>
      <div class="link-preview-description-skeleton"></div>
      <div class="link-preview-site">
        <div class="link-preview-favicon-skeleton"></div>
        <span>${hostname}</span>
      </div>
    </div>
  </div>`
}

function renderLinkPreview(url: string, preview: LinkPreview): string {
  const escapeHtml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  const title = preview.title ? escapeHtml(preview.title) : url
  const description = preview.description ? escapeHtml(preview.description) : ''
  const siteName = preview.siteName ? escapeHtml(preview.siteName) : new globalThis.URL(url).hostname

  let html = `<a href="${escapeHtml(url)}" class="link-preview-card" target="_blank" rel="noopener noreferrer">`

  html += `<div class="link-preview-content">`
  html += `<div class="link-preview-title">${title}</div>`

  if (description) {
    html += `<div class="link-preview-description">${description}</div>`
  }

  html += `<div class="link-preview-site">`
  if (preview.favicon) {
    html += `<img src="${escapeHtml(preview.favicon)}" alt="" class="link-preview-favicon" />`
  }
  html += `<span>${siteName}</span>`
  html += `</div>`
  html += `</div></a>`

  return html
}

function renderBlock(block: Block): void {
  const content = block.content
  if (!content.trim()) {
    highlightedBlocks.value.set(block.id, '<p class="empty-line"><br></p>')
    return
  }

  const codeInfo = parseCodeBlock(content)
  if (codeInfo) {
    const highlighted = highlightCode(codeInfo.code, codeInfo.lang)
    const langLabel = codeInfo.lang ? `<div class="code-lang-label">${codeInfo.lang}</div>` : ''
    highlightedBlocks.value.set(block.id, `<div class="code-block-wrapper">${langLabel}<pre class="hljs"><code>${highlighted}</code></pre></div>`)
    return
  }

  // チェックリストのレンダリング（複数行対応）
  const lines = content.split('\n')
  const isChecklist = lines.every(line => {
    const trimmed = line.trim()
    return trimmed === '' || trimmed.match(/^[-*+]\s\[[ x]\]\s/) || line.match(/^\s+[-*+]\s\[[ x]\]\s/)
  }) && lines.some(line => line.match(/[-*+]\s\[[ x]\]\s/))

  if (isChecklist) {
    const checklistHtml = lines.map((line, lineIndex) => {
      const trimmed = line.trim()
      if (trimmed === '') return ''

      const match = line.match(/^(\s*)([-*+])\s\[([ x])\]\s(.*)$/)
      if (match) {
        const indent = match[1]
        const checked = match[3] === 'x'
        const text = match[4]
        const checkedClass = checked ? 'checked' : ''
        const checkedAttr = checked ? 'checked' : ''
        const indentStyle = indent ? `style="margin-left: ${indent.length * 8}px"` : ''
        const textHtml = marked.parseInline(text, { async: false }) as string
        return `<div class="checklist-item ${checkedClass}" ${indentStyle} data-block-id="${block.id}" data-line-index="${lineIndex}">
          <input type="checkbox" ${checkedAttr} class="checklist-checkbox" data-line-index="${lineIndex}" />
          <span class="checklist-text">${textHtml}</span>
        </div>`
      }
      return ''
    }).filter(html => html !== '').join('')

    if (checklistHtml) {
      highlightedBlocks.value.set(block.id, checklistHtml)
      return
    }
  }

  // 通常のmarkdownとしてレンダリング
  let html = marked.parse(content, { async: false }) as string

  // URLリンクのみのブロックはリッチプレビューカードも追加表示
  const linkOnlyMatch = content.trim().match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/)
  if (linkOnlyMatch) {
    const url = linkOnlyMatch[2]
    // ローディング中の場合はスケルトンを表示
    if (loadingUrls.value.has(url)) {
      html += renderLoadingPreview(url)
    } else {
      const preview = linkPreviews.value.get(url)
      if (preview && preview.description) {
        html += renderLinkPreview(url, preview)
      }
    }
  }

  highlightedBlocks.value.set(block.id, html)
}

function getRenderedBlock(block: Block): string {
  return highlightedBlocks.value.get(block.id) || '<p class="empty-line"><br></p>'
}

watch(
  blocks,
  (newBlocks) => {
    for (const block of newBlocks) {
      renderBlock(block)
    }
  },
  { immediate: true, deep: true }
)

// modelValueの変更を監視して履歴に追加
watch(
  () => props.modelValue,
  (newValue) => {
    if (isUndoRedo.value) {
      isUndoRedo.value = false
      return
    }

    // 現在の履歴位置より後ろの履歴を削除
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    // カーソル位置を取得
    let cursorPos: number | null = null
    if (editingBlockId.value) {
      const textarea = blockRefs.value.get(editingBlockId.value)
      if (textarea) {
        cursorPos = textarea.selectionStart
      }
    }

    // 新しい値を履歴に追加
    history.value.push({
      content: newValue,
      editingBlockIndex: editingBlockIndex.value,
      cursorPos
    })
    historyIndex.value = history.value.length - 1

    // 履歴が100個を超えたら古いものを削除
    if (history.value.length > 100) {
      history.value.shift()
      historyIndex.value--
    }
  }
)

// フォーカス待ちの状態を保持（インデックスベースに変更）
const pendingFocus = ref<{ blockIndex: number; cursorPos: number } | null>(null)
// blurを無視するフラグ
const ignoreBlur = ref(false)

function startEditingByIndex(blockIndex: number, cursorPos?: number) {
  ignoreBlur.value = true
  editingBlockIndex.value = blockIndex

  if (cursorPos !== undefined) {
    pendingFocus.value = { blockIndex, cursorPos }
  }

  nextTick(() => {
    const currentBlockId = editingBlockId.value
    if (!currentBlockId) return

    const textarea = blockRefs.value.get(currentBlockId)
    if (textarea) {
      textarea.focus()
      adjustTextareaHeight(textarea)
      if (pendingFocus.value) {
        textarea.setSelectionRange(pendingFocus.value.cursorPos, pendingFocus.value.cursorPos)
        pendingFocus.value = null
      }
    }
    // blurフラグをリセット（少し遅延を入れてblurイベントが発火するのを待つ）
    setTimeout(() => {
      ignoreBlur.value = false
    }, 50)
  })
}

function startEditing(blockId: string, cursorPos?: number) {
  const blockIndex = blocks.value.findIndex((b: Block) => b.id === blockId)
  if (blockIndex !== -1) {
    startEditingByIndex(blockIndex, cursorPos)
  }
}

function stopEditing() {
  if (ignoreBlur.value) {
    return
  }
  // handleBlurで処理するため、ここでは何もしない
}

function updateBlock(blockId: string, newContent: string) {
  const blockIndex = blocks.value.findIndex(b => b.id === blockId)
  if (blockIndex === -1) return

  const newBlocks = blocks.value.map((b, i) =>
    i === blockIndex ? { ...b, content: newContent } : b
  )

  emit('update:modelValue', newBlocks.map(b => b.content).join('\n'))
}

function handleInput(event: Event, blockId: string) {
  const textarea = event.target as HTMLTextAreaElement
  updateBlock(blockId, textarea.value)
  adjustTextareaHeight(textarea)
}

async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    const response = await fetch(`/api/fetch-title?url=${encodeURIComponent(url)}`)
    if (response.ok) {
      const data = await response.json()
      return {
        url,
        title: data.title || null,
        description: data.description || null,
        image: data.image || null,
        siteName: data.siteName || null,
        favicon: data.favicon || null
      }
    }
  } catch {
    // フェッチ失敗時はnullを返す
  }
  return null
}

function handlePaste(event: ClipboardEvent, blockId: string) {
  const pastedText = event.clipboardData?.getData('text')
  if (!pastedText) return

  // URLパターンをチェック（テキストが選択されている場合のみハイパーリンク化）
  const urlPattern = /^https?:\/\/[^\s]+$/
  const trimmedUrl = pastedText.trim()
  if (urlPattern.test(trimmedUrl)) {
    const textarea = event.target as HTMLTextAreaElement
    const cursorPos = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    const content = textarea.value
    const selectedText = content.slice(cursorPos, selectionEnd)

    // テキストが選択されている場合のみ、即座にハイパーリンク化
    if (selectedText) {
      event.preventDefault()
      const markdownLink = `[${selectedText}](${trimmedUrl})`
      const newContent = content.slice(0, cursorPos) + markdownLink + content.slice(selectionEnd)
      updateBlock(blockId, newContent)
      nextTick(() => {
        const newCursorPos = cursorPos + markdownLink.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      })
    }
    // 選択テキストがない場合は通常のペースト（URLのまま）
  }
}

// URLをハイパーリンク化してOGP情報を取得（非同期で実行）
async function processUrlBlock(url: string) {
  // markdownリンク形式のパターン
  const linkPattern = `[${url}](${url})`

  // ローディング状態を設定
  loadingUrls.value.add(url)

  // nextTickでDOMの更新を待ってからレンダリング
  await nextTick()

  // ローディングスケルトンを表示するため再レンダリング（厳密にマッチ）
  for (const b of blocks.value) {
    if (b.content.trim() === linkPattern) {
      renderBlock(b)
      break
    }
  }

  // OGP情報を非同期で取得
  const preview = await fetchLinkPreview(url)

  // ローディング状態を解除
  loadingUrls.value.delete(url)

  if (preview) {
    linkPreviews.value.set(url, preview)

    // タイトルが取得できた場合、リンクテキストを更新
    if (preview.title) {
      for (const b of blocks.value) {
        // 厳密にURLのみのリンクブロックかチェック
        if (b.content.trim() === linkPattern) {
          updateBlock(b.id, `[${preview.title}](${url})`)
          break
        }
      }
    }

    // nextTickでDOMの更新を待つ
    await nextTick()

    // プレビューカードを再レンダリング（URLを含むリンクブロック）
    for (const b of blocks.value) {
      const linkMatch = b.content.trim().match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/)
      if (linkMatch && linkMatch[2] === url) {
        renderBlock(b)
        break
      }
    }
  } else {
    // フェッチ失敗時もローディング解除後に再レンダリング
    await nextTick()
    for (const b of blocks.value) {
      if (b.content.trim() === linkPattern) {
        renderBlock(b)
        break
      }
    }
  }
}

// フォーカスが外れた時にURLをハイパーリンク化
async function handleBlur(blockId: string) {
  if (ignoreBlur.value) {
    return
  }

  const block = blocks.value.find((b: Block) => b.id === blockId)
  if (block) {
    // 生URLのパターンをチェック（行全体がURLの場合）
    const urlPattern = /^(https?:\/\/[^\s]+)$/
    const trimmedContent = block.content.trim()
    const urlMatch = trimmedContent.match(urlPattern)

    if (urlMatch) {
      const url = urlMatch[1]

      // まずURLをmarkdownリンク形式に変換
      updateBlock(blockId, `[${url}](${url})`)

      // 編集モードを終了（プレビュー表示に切り替え）
      editingBlockIndex.value = null

      // 非同期でOGP情報を取得（awaitしない）
      processUrlBlock(url)
      return
    }
  }

  editingBlockIndex.value = null
}

function handleKeydown(event: KeyboardEvent, blockId: string, blockIndex: number) {
  const textarea = event.target as HTMLTextAreaElement

  // Cmd+Z (Mac) または Ctrl+Z (Windows/Linux) でUndo
  if ((event.metaKey || event.ctrlKey) && event.key === 'z' && !event.shiftKey) {
    event.preventDefault()
    undo()
    return
  }

  // Cmd+Shift+Z (Mac) または Ctrl+Shift+Z (Windows/Linux) でRedo
  if ((event.metaKey || event.ctrlKey) && event.key === 'z' && event.shiftKey) {
    event.preventDefault()
    redo()
    return
  }

  // Cmd+Y (Windows/Linux) でもRedo
  if ((event.metaKey || event.ctrlKey) && event.key === 'y') {
    event.preventDefault()
    redo()
    return
  }

  if (event.key === 'Escape') {
    stopEditing()
    return
  }

  // スペースキーで /table x y パターンをテーブルに変換
  if (event.key === ' ') {
    const cursorPos = textarea.selectionStart
    const content = textarea.value
    const beforeCursor = content.slice(0, cursorPos)

    const tableMatch = beforeCursor.match(/^\/table\s+(\d+)\s+(\d+)$/)
    if (tableMatch) {
      event.preventDefault()
      const rows = parseInt(tableMatch[1])
      const cols = parseInt(tableMatch[2])

      if (rows > 0 && rows <= 20 && cols > 0 && cols <= 10) {
        // テーブルのマークダウンを生成
        let tableMarkdown = ''

        // ヘッダー行
        tableMarkdown += '| ' + Array(cols).fill('Header').map((h, i) => `${h}${i + 1}`).join(' | ') + ' |\n'

        // 区切り行
        tableMarkdown += '| ' + Array(cols).fill('---').join(' | ') + ' |\n'

        // データ行
        for (let i = 0; i < rows; i++) {
          tableMarkdown += '| ' + Array(cols).fill('').join(' | ') + ' |\n'
        }

        const afterCursor = content.slice(cursorPos)
        updateBlock(blockId, tableMarkdown.trim() + afterCursor)

        nextTick(() => {
          const textarea = blockRefs.value.get(blockId)
          if (textarea) {
            adjustTextareaHeight(textarea)
            // ヘッダー行の最初のセルにカーソルを移動
            const firstCellPos = 2
            textarea.setSelectionRange(firstCellPos, firstCellPos + 7)
          }
        })
      }
      return
    }
  }

  if (event.key === 'Enter' && !event.shiftKey) {
    // IME変換中は何もしない
    if (event.isComposing) {
      return
    }

    const cursorPos = textarea.selectionStart
    const content = textarea.value

    // /table x y パターンを検出してテーブルに変換
    const tableMatch = content.match(/^\/table\s+(\d+)\s+(\d+)$/)
    if (tableMatch) {
      event.preventDefault()
      const rows = parseInt(tableMatch[1])
      const cols = parseInt(tableMatch[2])

      if (rows > 0 && rows <= 20 && cols > 0 && cols <= 10) {
        // テーブルのマークダウンを生成
        let tableMarkdown = ''

        // ヘッダー行
        tableMarkdown += '| ' + Array(cols).fill('Header').map((h, i) => `${h}${i + 1}`).join(' | ') + ' |\n'

        // 区切り行
        tableMarkdown += '| ' + Array(cols).fill('---').join(' | ') + ' |\n'

        // データ行
        for (let i = 0; i < rows; i++) {
          tableMarkdown += '| ' + Array(cols).fill('').join(' | ') + ' |\n'
        }

        updateBlock(blockId, tableMarkdown.trim())

        nextTick(() => {
          const textarea = blockRefs.value.get(blockId)
          if (textarea) {
            adjustTextareaHeight(textarea)
            // ヘッダー行の最初のセルにカーソルを移動
            const firstCellPos = 2
            textarea.setSelectionRange(firstCellPos, firstCellPos + 7)
          }
        })
      }
      return
    }

    // コードブロック内では通常の改行を許可し、インデントを維持
    if (content.trim().startsWith('```')) {
      event.preventDefault()

      // 現在行の開始位置を見つける
      const beforeCursor = content.slice(0, cursorPos)
      const lastNewlineIndex = beforeCursor.lastIndexOf('\n')
      const currentLineStart = lastNewlineIndex + 1
      const currentLine = content.slice(currentLineStart, cursorPos)

      // 現在行のインデント（先頭の空白文字）を取得
      const indentMatch = currentLine.match(/^(\s*)/)
      const indent = indentMatch ? indentMatch[1] : ''

      // 改行とインデントを挿入
      const newContent = content.slice(0, cursorPos) + '\n' + indent + content.slice(cursorPos)
      updateBlock(blockId, newContent)

      nextTick(() => {
        const textarea = blockRefs.value.get(blockId)
        if (textarea) {
          const newCursorPos = cursorPos + 1 + indent.length
          textarea.setSelectionRange(newCursorPos, newCursorPos)
          adjustTextareaHeight(textarea)
        }
      })
      return
    }

    event.preventDefault()

    // blurイベントを無視するフラグを設定（Enter処理中のblur発火を防ぐ）
    ignoreBlur.value = true

    const beforeCursor = content.slice(0, cursorPos)
    const afterCursor = content.slice(cursorPos)

    // 現在のカーソル位置の行を特定
    const lines = content.split('\n')
    let currentLineIndex = 0
    let charCount = 0
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= cursorPos) {
        currentLineIndex = i
        break
      }
      charCount += lines[i].length + 1 // +1 for newline
    }
    const currentLine = lines[currentLineIndex]
    const currentLineTrimmed = currentLine.trim()

    // 現在の行の開始位置を計算
    let lineStartPos = 0
    for (let i = 0; i < currentLineIndex; i++) {
      lineStartPos += lines[i].length + 1
    }

    // 箇条書きの自動補完
    // 現在の行のカーソル以降のテキストのみを取得
    const currentLineStartPos = lineStartPos
    const currentLineEndPos = currentLineIndex < lines.length - 1
      ? lineStartPos + lines[currentLineIndex].length
      : content.length
    // afterCurrentLineには次の行以降が含まれる（改行文字も含む）
    const afterCurrentLine = currentLineIndex < lines.length - 1 ? content.slice(currentLineEndPos) : ''
    const currentLineAfterCursor = content.slice(cursorPos, currentLineEndPos)

    let nextContent = afterCursor
    let nextCursorPos = 0
    let bulletMatch = null
    let numberedMatch = null

    // チェックリスト（- [ ] または - [x]）
    const checklistMatch = currentLineTrimmed.match(/^([-*+])\s\[[ x]\]\s/)
    if (checklistMatch) {
      // 空のチェックリストの場合はリストブロックから抜けて新しいブロックを作成
      if (currentLineTrimmed.match(/^[-*+]\s\[[ x]\]\s*$/)) {
        event.preventDefault()
        const newLines = [...lines]
        newLines.splice(currentLineIndex, 1) // 空のリスト項目を削除
        const currentBlockContent = newLines.join('\n').trim()

        const newBlocks = [...blocks.value]
        if (currentBlockContent) {
          // リストブロックに内容が残っている場合
          newBlocks[blockIndex] = { ...newBlocks[blockIndex], content: currentBlockContent }
          newBlocks.splice(blockIndex + 1, 0, { id: `block-${Date.now()}`, content: '' })
        } else {
          // リストブロックが空になった場合は空のブロックに置き換え
          newBlocks[blockIndex] = { ...newBlocks[blockIndex], content: '' }
        }

        emit('update:modelValue', newBlocks.map(b => b.content).join('\n'))

        // 新しいブロックにフォーカス
        const nextBlockIndex = currentBlockContent ? blockIndex + 1 : blockIndex
        nextTick(() => {
          startEditingByIndex(nextBlockIndex, 0)
          ignoreBlur.value = false
        })
        return
      }
      // インデントを保持
      const indentMatch = currentLine.match(/^(\s*)/)
      const indent = indentMatch ? indentMatch[1] : ''
      nextContent = `${indent}${checklistMatch[1]} [ ] ${currentLineAfterCursor}`
      nextCursorPos = indent.length + 6
    }
    // 箇条書き（- または * または +）
    else {
      bulletMatch = currentLineTrimmed.match(/^([-*+])\s/)
      if (bulletMatch) {
        // 空の箇条書きの場合はリストブロックから抜けて新しいブロックを作成
        if (currentLineTrimmed === bulletMatch[0].trim()) {
          event.preventDefault()
          const newLines = [...lines]
          newLines.splice(currentLineIndex, 1) // 空のリスト項目を削除
          const currentBlockContent = newLines.join('\n').trim()

          const newBlocks = [...blocks.value]
          if (currentBlockContent) {
            // リストブロックに内容が残っている場合
            newBlocks[blockIndex] = { ...newBlocks[blockIndex], content: currentBlockContent }
            newBlocks.splice(blockIndex + 1, 0, { id: `block-${Date.now()}`, content: '' })
          } else {
            // リストブロックが空になった場合は空のブロックに置き換え
            newBlocks[blockIndex] = { ...newBlocks[blockIndex], content: '' }
          }

          emit('update:modelValue', newBlocks.map(b => b.content).join('\n'))

          // 新しいブロックにフォーカス
          const nextBlockIndex = currentBlockContent ? blockIndex + 1 : blockIndex
          nextTick(() => {
            startEditingByIndex(nextBlockIndex, 0)
            ignoreBlur.value = false
          })
          return
        }
        // インデントを保持
        const indentMatch = currentLine.match(/^(\s*)/)
        const indent = indentMatch ? indentMatch[1] : ''
        nextContent = `${indent}${bulletMatch[1]} ${currentLineAfterCursor}`
        nextCursorPos = indent.length + 2
      }
    }

    // 番号付きリスト（1. 2. など）
    numberedMatch = currentLineTrimmed.match(/^(\d+)\.\s/)
    if (numberedMatch) {
      // 空の番号付きリストの場合はリストブロックから抜けて新しいブロックを作成
      if (currentLineTrimmed === numberedMatch[0].trim()) {
        event.preventDefault()
        const newLines = [...lines]
        newLines.splice(currentLineIndex, 1) // 空のリスト項目を削除
        const currentBlockContent = newLines.join('\n').trim()

        const newBlocks = [...blocks.value]
        if (currentBlockContent) {
          // リストブロックに内容が残っている場合
          newBlocks[blockIndex] = { ...newBlocks[blockIndex], content: currentBlockContent }
          newBlocks.splice(blockIndex + 1, 0, { id: `block-${Date.now()}`, content: '' })
        } else {
          // リストブロックが空になった場合は空のブロックに置き換え
          newBlocks[blockIndex] = { ...newBlocks[blockIndex], content: '' }
        }

        emit('update:modelValue', newBlocks.map(b => b.content).join('\n'))

        // 新しいブロックにフォーカス
        const nextBlockIndex = currentBlockContent ? blockIndex + 1 : blockIndex
        nextTick(() => {
          startEditingByIndex(nextBlockIndex, 0)
          ignoreBlur.value = false
        })
        return
      }
      const nextNumber = parseInt(numberedMatch[1]) + 1
      // インデントを保持
      const indentMatch = currentLine.match(/^(\s*)/)
      const indent = indentMatch ? indentMatch[1] : ''
      nextContent = `${indent}${nextNumber}. ${currentLineAfterCursor}`
      nextCursorPos = indent.length + `${nextNumber}. `.length
    }

    // 引用（> または >> など）
    const quoteMatch = currentLineTrimmed.match(/^(>+)\s?/)
    if (quoteMatch) {
      // 空の引用の場合は引用ブロックから抜けて新しいブロックを作成
      if (currentLineTrimmed === quoteMatch[0].trim() || currentLineTrimmed === quoteMatch[1]) {
        event.preventDefault()
        const newLines = [...lines]
        newLines.splice(currentLineIndex, 1) // 空の引用行を削除
        const currentBlockContent = newLines.join('\n').trim()

        const newBlocks = [...blocks.value]
        if (currentBlockContent) {
          // 引用ブロックに内容が残っている場合
          newBlocks[blockIndex] = { ...newBlocks[blockIndex], content: currentBlockContent }
          newBlocks.splice(blockIndex + 1, 0, { id: `block-${Date.now()}`, content: '' })
        } else {
          // 引用ブロックが空になった場合は空のブロックに置き換え
          newBlocks[blockIndex] = { ...newBlocks[blockIndex], content: '' }
        }

        emit('update:modelValue', newBlocks.map(b => b.content).join('\n'))

        // 新しいブロックにフォーカス
        const nextBlockIndex = currentBlockContent ? blockIndex + 1 : blockIndex
        nextTick(() => {
          startEditingByIndex(nextBlockIndex, 0)
          ignoreBlur.value = false
        })
        return
      }
      // インデントと引用マーカーを保持
      const indentMatch = currentLine.match(/^(\s*)/)
      const indent = indentMatch ? indentMatch[1] : ''
      nextContent = `${indent}${quoteMatch[1]} ${currentLineAfterCursor}`
      nextCursorPos = indent.length + quoteMatch[1].length + 1
    }

    // URLのみのブロックの場合、ハイパーリンク化してOGP取得
    const urlPattern = /^(https?:\/\/[^\s]+)$/
    const urlMatch = currentLineTrimmed.match(urlPattern)
    if (urlMatch) {
      const url = urlMatch[1]

      // URLをmarkdownリンク形式に変換した現在のブロック + 新しい空ブロック
      const newBlocks = [...blocks.value]
      newBlocks[blockIndex] = { ...newBlocks[blockIndex], content: `[${url}](${url})` }
      newBlocks.splice(blockIndex + 1, 0, {
        id: `block-${Date.now()}`,
        content: ''
      })

      emit('update:modelValue', newBlocks.map(b => b.content).join('\n'))

      // 次のブロックに移動
      const nextBlockIndex = blockIndex + 1

      // 直接インデックスベースでフォーカスを設定
      pendingFocus.value = { blockIndex: nextBlockIndex, cursorPos: 0 }

      // インデックスベースで編集状態を設定
      editingBlockIndex.value = nextBlockIndex

      // requestAnimationFrameで確実にDOM更新後にフォーカス
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const nextBlockId = editingBlockId.value
          if (nextBlockId) {
            const textarea = blockRefs.value.get(nextBlockId)
            if (textarea) {
              textarea.focus()
              adjustTextareaHeight(textarea)
              if (pendingFocus.value) {
                textarea.setSelectionRange(pendingFocus.value.cursorPos, pendingFocus.value.cursorPos)
                pendingFocus.value = null
              }
            }
            setTimeout(() => {
              ignoreBlur.value = false
            }, 50)
          }
        })
      })

      // 非同期でOGP情報を取得
      processUrlBlock(url)
      return
    }

    // リスト項目または引用の場合は、同じブロック内に新しい行を追加
    if (checklistMatch || bulletMatch || numberedMatch || quoteMatch) {
      // afterCurrentLineはすでに改行文字で始まっているため、そのまま連結
      const newContent = beforeCursor + '\n' + nextContent + afterCurrentLine
      updateBlock(blockId, newContent)

      // 即座に ignoreBlur をリセット
      setTimeout(() => {
        ignoreBlur.value = false
      }, 0)

      nextTick(() => {
        const textarea = blockRefs.value.get(blockId)
        if (textarea) {
          const newCursorPos = beforeCursor.length + 1 + nextCursorPos
          textarea.focus()
          textarea.setSelectionRange(newCursorPos, newCursorPos)
          adjustTextareaHeight(textarea)
        }
      })
      return
    }

    // リスト以外の場合は新しいブロックを作成
    const newBlocks = [...blocks.value]
    newBlocks[blockIndex] = { ...newBlocks[blockIndex], content: beforeCursor }
    newBlocks.splice(blockIndex + 1, 0, {
      id: `block-${Date.now()}`,
      content: nextContent
    })

    emit('update:modelValue', newBlocks.map(b => b.content).join('\n'))

    // 次のブロックのインデックスを保存
    const nextBlockIndex = blockIndex + 1

    // 直接インデックスベースでフォーカスを設定
    pendingFocus.value = { blockIndex: nextBlockIndex, cursorPos: nextCursorPos }

    // インデックスベースで編集状態を設定
    editingBlockIndex.value = nextBlockIndex

    // requestAnimationFrameで確実にDOM更新後にフォーカス
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const nextBlockId = editingBlockId.value
        if (nextBlockId) {
          const textarea = blockRefs.value.get(nextBlockId)
          if (textarea) {
            textarea.focus()
            adjustTextareaHeight(textarea)
            if (pendingFocus.value) {
              textarea.setSelectionRange(pendingFocus.value.cursorPos, pendingFocus.value.cursorPos)
              pendingFocus.value = null
            }
          }
          setTimeout(() => {
            ignoreBlur.value = false
          }, 50)
        }
      })
    })
    return
  }

  if (event.key === 'Backspace' && textarea.selectionStart === 0 && textarea.selectionEnd === 0 && blockIndex > 0) {
    event.preventDefault()
    ignoreBlur.value = true
    const currentContent = textarea.value
    const prevBlockIndex = blockIndex - 1

    const newBlocks = [...blocks.value]
    const prevContent = newBlocks[prevBlockIndex].content
    const cursorPosition = prevContent.length

    // 前のブロックに現在のコンテンツを結合
    newBlocks[prevBlockIndex] = { ...newBlocks[prevBlockIndex], content: prevContent + currentContent }
    // 現在のブロックを削除
    newBlocks.splice(blockIndex, 1)

    emit('update:modelValue', newBlocks.map(b => b.content).join('\n'))

    // インデックスベースで前のブロックに移動
    startEditingByIndex(prevBlockIndex, cursorPosition)
    return
  }

  if (event.key === 'ArrowUp' && textarea.selectionStart === 0 && blockIndex > 0) {
    event.preventDefault()
    ignoreBlur.value = true
    startEditingByIndex(blockIndex - 1)
    return
  }

  if (event.key === 'ArrowDown' && textarea.selectionEnd === textarea.value.length && blockIndex < blocks.value.length - 1) {
    event.preventDefault()
    ignoreBlur.value = true
    startEditingByIndex(blockIndex + 1)
    return
  }

  // Tab キーでインデント操作
  if (event.key === 'Tab') {
    const content = textarea.value
    const trimmed = content.trim()

    // コードブロック内の場合
    if (trimmed.startsWith('```')) {
      event.preventDefault()
      const cursorPos = textarea.selectionStart

      // コードブロックの言語を検出
      const langMatch = trimmed.match(/^```(\w+)/)
      const lang = langMatch ? langMatch[1].toLowerCase() : ''

      // 言語ごとの標準インデント幅を設定
      let indentSize = 2 // デフォルト
      if (['python', 'java', 'c', 'cpp', 'csharp', 'go', 'php', 'rust', 'swift'].includes(lang)) {
        indentSize = 4
      } else if (lang === 'go') {
        // Goはタブ文字を使用するが、ここではスペースで統一
        indentSize = 4
      }

      const indent = ' '.repeat(indentSize)

      // 現在行の開始位置を見つける
      const beforeCursor = content.slice(0, cursorPos)
      const lastNewlineIndex = beforeCursor.lastIndexOf('\n')
      const currentLineStart = lastNewlineIndex + 1
      const currentLineEnd = content.indexOf('\n', cursorPos)
      const lineEnd = currentLineEnd === -1 ? content.length : currentLineEnd
      const currentLine = content.slice(currentLineStart, lineEnd)

      if (event.shiftKey) {
        // Shift+Tab: インデント解除
        const currentIndentMatch = currentLine.match(/^(\s*)/)
        const currentIndent = currentIndentMatch ? currentIndentMatch[1] : ''

        if (currentIndent.length >= indentSize) {
          // indentSize分のスペースを削除
          const newLine = currentLine.slice(indentSize)
          const newContent = content.slice(0, currentLineStart) + newLine + content.slice(lineEnd)
          updateBlock(blockId, newContent)
          nextTick(() => {
            const newCursorPos = Math.max(currentLineStart, cursorPos - indentSize)
            textarea.setSelectionRange(newCursorPos, newCursorPos)
          })
        } else if (currentIndent.length > 0) {
          // 残りの空白を削除
          const newLine = currentLine.slice(currentIndent.length)
          const newContent = content.slice(0, currentLineStart) + newLine + content.slice(lineEnd)
          updateBlock(blockId, newContent)
          nextTick(() => {
            const newCursorPos = Math.max(currentLineStart, cursorPos - currentIndent.length)
            textarea.setSelectionRange(newCursorPos, newCursorPos)
          })
        }
      } else {
        // Tab: インデント追加
        const beforeLine = content.slice(0, cursorPos)
        const afterLine = content.slice(cursorPos)
        const newContent = beforeLine + indent + afterLine
        updateBlock(blockId, newContent)
        nextTick(() => {
          textarea.setSelectionRange(cursorPos + indentSize, cursorPos + indentSize)
        })
      }
      return
    }

    // 箇条書きまたは番号付きリストの場合
    const isBullet = trimmed.match(/^([-*+])\s/)
    const isNumbered = trimmed.match(/^(\d+)\.\s/)
    const isChecklist = trimmed.match(/^([-*+])\s\[[ x]\]\s/)

    if (isBullet || isNumbered || isChecklist) {
      event.preventDefault()
      const cursorPos = textarea.selectionStart

      // 現在のカーソル位置の行を特定
      const lines = content.split('\n')
      let currentLineIndex = 0
      let charCount = 0
      for (let i = 0; i < lines.length; i++) {
        if (charCount + lines[i].length >= cursorPos) {
          currentLineIndex = i
          break
        }
        charCount += lines[i].length + 1 // +1 for newline
      }
      const currentLine = lines[currentLineIndex]

      // 現在の行の開始位置を計算
      let lineStartPos = 0
      for (let i = 0; i < currentLineIndex; i++) {
        lineStartPos += lines[i].length + 1
      }

      // 現在のインデントレベルを取得
      const currentIndentMatch = currentLine.match(/^(\s*)/)
      const currentIndent = currentIndentMatch ? currentIndentMatch[1].length : 0

      if (event.shiftKey) {
        // Shift+Tab: インデント解除（現在の行の先頭からスペースを削除）
        if (currentIndent > 0) {
          const removeSpaces = Math.min(2, currentIndent)
          const newLine = currentLine.slice(removeSpaces)
          const newLines = [...lines]
          newLines[currentLineIndex] = newLine
          const newContent = newLines.join('\n')
          updateBlock(blockId, newContent)
          nextTick(() => {
            const newCursorPos = Math.max(lineStartPos, cursorPos - removeSpaces)
            textarea.setSelectionRange(newCursorPos, newCursorPos)
          })
        }
      } else {
        // Tab: インデント追加（現在の行の先頭に2スペース追加）
        // 直前の行のインデント+2までに制限
        let maxIndent = 10 // 最大インデント

        if (currentLineIndex > 0) {
          const prevLine = lines[currentLineIndex - 1]
          const prevIndentMatch = prevLine.match(/^(\s*)/)
          const prevIndent = prevIndentMatch ? prevIndentMatch[1].length : 0
          const prevIsList = prevLine.trim().match(/^([-*+]|\d+\.)\s/)

          if (prevIsList) {
            // 直前がリストの場合、そのインデント+2まで許可
            maxIndent = prevIndent + 2
          }
        }

        if (currentIndent < maxIndent) {
          const newLine = '  ' + currentLine
          const newLines = [...lines]
          newLines[currentLineIndex] = newLine
          const newContent = newLines.join('\n')
          updateBlock(blockId, newContent)
          nextTick(() => {
            textarea.setSelectionRange(cursorPos + 2, cursorPos + 2)
          })
        }
      }
      return
    }
  }
}

function adjustTextareaHeight(textarea: HTMLTextAreaElement) {
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

function undo() {
  if (historyIndex.value > 0) {
    historyIndex.value--
    const state = history.value[historyIndex.value]
    isUndoRedo.value = true
    emit('update:modelValue', state.content)

    // 編集状態とカーソル位置を復元
    nextTick(() => {
      if (state.editingBlockIndex !== null) {
        editingBlockIndex.value = state.editingBlockIndex
        const blockId = editingBlockId.value
        if (blockId) {
          nextTick(() => {
            const textarea = blockRefs.value.get(blockId)
            if (textarea) {
              textarea.focus()
              if (state.cursorPos !== null) {
                textarea.setSelectionRange(state.cursorPos, state.cursorPos)
              }
              adjustTextareaHeight(textarea)
            }
          })
        }
      } else {
        editingBlockIndex.value = null
      }
    })
  }
}

function redo() {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++
    const state = history.value[historyIndex.value]
    isUndoRedo.value = true
    emit('update:modelValue', state.content)

    // 編集状態とカーソル位置を復元
    nextTick(() => {
      if (state.editingBlockIndex !== null) {
        editingBlockIndex.value = state.editingBlockIndex
        const blockId = editingBlockId.value
        if (blockId) {
          nextTick(() => {
            const textarea = blockRefs.value.get(blockId)
            if (textarea) {
              textarea.focus()
              if (state.cursorPos !== null) {
                textarea.setSelectionRange(state.cursorPos, state.cursorPos)
              }
              adjustTextareaHeight(textarea)
            }
          })
        }
      } else {
        editingBlockIndex.value = null
      }
    })
  }
}

function setBlockRef(blockId: string, el: HTMLTextAreaElement | null) {
  if (el) {
    blockRefs.value.set(blockId, el)
    // フォーカス待ちがあれば実行
    if (pendingFocus.value && pendingFocus.value.blockId === blockId) {
      el.focus()
      adjustTextareaHeight(el)
      el.setSelectionRange(pendingFocus.value.cursorPos, pendingFocus.value.cursorPos)
      pendingFocus.value = null
    }
  } else {
    blockRefs.value.delete(blockId)
  }
}

function handleContainerClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.classList.contains('blocks-container')) {
    const lastBlockIndex = blocks.value.length - 1
    if (lastBlockIndex >= 0) {
      startEditingByIndex(lastBlockIndex)
    }
  }
}

function toggleCheckbox(blockId: string, lineIndex: number = 0) {
  const block = blocks.value.find(b => b.id === blockId)
  if (!block) return

  const lines = block.content.split('\n')
  if (lineIndex >= lines.length) return

  const line = lines[lineIndex]
  let newLine: string

  if (line.match(/\[ \]/)) {
    newLine = line.replace('[ ]', '[x]')
  } else if (line.match(/\[x\]/)) {
    newLine = line.replace('[x]', '[ ]')
  } else {
    return
  }

  lines[lineIndex] = newLine
  const newContent = lines.join('\n')
  updateBlock(blockId, newContent)
}

function handlePreviewClick(event: MouseEvent, blockId: string) {
  const target = event.target as HTMLElement

  // チェックボックス本体（input要素）がクリックされた場合のみトグル
  if (target.tagName === 'INPUT' && target.classList.contains('checklist-checkbox')) {
    event.preventDefault()
    event.stopPropagation()
    const lineIndex = target.getAttribute('data-line-index')
    toggleCheckbox(blockId, lineIndex ? parseInt(lineIndex) : 0)
    return
  }

  // リンクがクリックされた場合は新しいタブで開く
  if (target.tagName === 'A') {
    const href = target.getAttribute('href')
    if (href) {
      event.preventDefault()
      event.stopPropagation()
      window.open(href, '_blank', 'noopener,noreferrer')
      return
    }
  }

  // それ以外は編集モードに切り替え
  startEditing(blockId)
}

// フォーマットツールバー関数
function applyFormat(format: string) {
  if (editingBlockId.value === null) return

  // テーブルの場合は/tableコマンドを挿入
  if (format === 'table') {
    const blockId = editingBlockId.value
    const textarea = blockRefs.value.get(blockId)
    if (!textarea) return

    // 現在のコンテンツをクリアして /table 3 3 を挿入
    updateBlock(blockId, '/table 3 3')

    nextTick(() => {
      textarea.focus()
      // カーソルを最後に移動
      textarea.setSelectionRange(10, 10)
      adjustTextareaHeight(textarea)
    })
    return
  }

  const blockId = editingBlockId.value
  const textarea = blockRefs.value.get(blockId)
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const content = textarea.value
  const selectedText = content.substring(start, end)

  let newContent = ''
  let newCursorPos = start

  switch (format) {
    case 'h1':
      if (content.startsWith('# ')) {
        newContent = content.substring(2)
        newCursorPos = Math.max(0, start - 2)
      } else {
        newContent = '# ' + content.replace(/^#{1,6}\s/, '')
        newCursorPos = start + 2
      }
      break
    case 'h2':
      if (content.startsWith('## ')) {
        newContent = content.substring(3)
        newCursorPos = Math.max(0, start - 3)
      } else {
        newContent = '## ' + content.replace(/^#{1,6}\s/, '')
        newCursorPos = start + 3
      }
      break
    case 'h3':
      if (content.startsWith('### ')) {
        newContent = content.substring(4)
        newCursorPos = Math.max(0, start - 4)
      } else {
        newContent = '### ' + content.replace(/^#{1,6}\s/, '')
        newCursorPos = start + 4
      }
      break
    case 'bold':
      if (selectedText) {
        newContent = content.substring(0, start) + `**${selectedText}**` + content.substring(end)
        newCursorPos = end + 4
      } else {
        newContent = content.substring(0, start) + '****' + content.substring(end)
        newCursorPos = start + 2
      }
      break
    case 'italic':
      if (selectedText) {
        newContent = content.substring(0, start) + `*${selectedText}*` + content.substring(end)
        newCursorPos = end + 2
      } else {
        newContent = content.substring(0, start) + '**' + content.substring(end)
        newCursorPos = start + 1
      }
      break
    case 'code':
      if (selectedText) {
        newContent = content.substring(0, start) + `\`${selectedText}\`` + content.substring(end)
        newCursorPos = end + 2
      } else {
        newContent = content.substring(0, start) + '``' + content.substring(end)
        newCursorPos = start + 1
      }
      break
    case 'code-block':
      newContent = '```\n' + content + '\n```'
      newCursorPos = 4
      break
    case 'bullet':
      if (content.startsWith('- ')) {
        newContent = content.substring(2)
        newCursorPos = Math.max(0, start - 2)
      } else {
        newContent = '- ' + content.replace(/^(\d+\.|-|\*|\+)\s/, '')
        newCursorPos = start + 2
      }
      break
    case 'numbered':
      if (content.match(/^\d+\.\s/)) {
        newContent = content.replace(/^\d+\.\s/, '')
        newCursorPos = Math.max(0, start - 3)
      } else {
        newContent = '1. ' + content.replace(/^(\d+\.|-|\*|\+)\s/, '')
        newCursorPos = start + 3
      }
      break
    case 'checklist':
      if (content.startsWith('- [ ] ')) {
        newContent = content.substring(6)
        newCursorPos = Math.max(0, start - 6)
      } else {
        newContent = '- [ ] ' + content.replace(/^([-*+]\s\[[ x]\]\s|[-*+]\s|\d+\.\s)/, '')
        newCursorPos = start + 6
      }
      break
    case 'quote':
      if (content.startsWith('> ')) {
        newContent = content.substring(2)
        newCursorPos = Math.max(0, start - 2)
      } else {
        newContent = '> ' + content
        newCursorPos = start + 2
      }
      break
    default:
      return
  }

  updateBlock(blockId, newContent)

  nextTick(() => {
    textarea.focus()
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    adjustTextareaHeight(textarea)
  })
}

function insertTable() {
  if (editingBlockId.value === null) return

  const blockId = editingBlockId.value
  const textarea = blockRefs.value.get(blockId)
  if (!textarea) return

  const rows = tableRows.value
  const cols = tableCols.value

  // ヘッダー行を生成
  const headerCells = Array(cols).fill(0).map((_, i) => `Header ${i + 1}`).join(' | ')
  const headerRow = `| ${headerCells} |`

  // セパレーター行を生成
  const separatorCells = Array(cols).fill('---').join(' | ')
  const separatorRow = `| ${separatorCells} |`

  // データ行を生成
  const dataRows = Array(rows - 1).fill(0).map((_, rowIndex) => {
    const cells = Array(cols).fill(0).map((_, colIndex) => `Cell ${rowIndex + 1}-${colIndex + 1}`).join(' | ')
    return `| ${cells} |`
  }).join('\n')

  const newContent = `${headerRow}\n${separatorRow}\n${dataRows}`
  const newCursorPos = 2 // カーソルを最初のヘッダーの位置に

  updateBlock(blockId, newContent)
  showTableInput.value = false

  nextTick(() => {
    textarea.focus()
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    adjustTextareaHeight(textarea)
  })
}

// ドラッグアンドドロップハンドラ
function handleDragStart(event: DragEvent, blockIndex: number) {
  draggedBlockIndex.value = blockIndex
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', blockIndex.toString())
  }
}

function handleDragOver(event: DragEvent, blockIndex: number) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dragOverBlockIndex.value = blockIndex
}

function handleDragLeave() {
  dragOverBlockIndex.value = null
}

function handleDrop(event: DragEvent, dropIndex: number) {
  event.preventDefault()

  if (draggedBlockIndex.value === null || draggedBlockIndex.value === dropIndex) {
    draggedBlockIndex.value = null
    dragOverBlockIndex.value = null
    return
  }

  const dragIndex = draggedBlockIndex.value
  const newBlocks = [...blocks.value]

  // ドラッグされたブロックを取得
  const [draggedBlock] = newBlocks.splice(dragIndex, 1)

  // ドロップ位置に挿入
  const insertIndex = dropIndex > dragIndex ? dropIndex : dropIndex
  newBlocks.splice(insertIndex, 0, draggedBlock)

  // 更新
  emit('update:modelValue', newBlocks.map(b => b.content).join('\n'))

  // クリーンアップ
  draggedBlockIndex.value = null
  dragOverBlockIndex.value = null
}

function handleDragEnd() {
  draggedBlockIndex.value = null
  dragOverBlockIndex.value = null
}

// 見出しセクションをコピー
function copySection(blockId: string) {
  const blockIndex = blocks.value.findIndex(b => b.id === blockId)
  if (blockIndex === -1) return

  const currentBlock = blocks.value[blockIndex]
  const currentContent = currentBlock.content.trim()

  // 見出しレベルを取得
  const headingMatch = currentContent.match(/^(#{1,6})\s/)
  if (!headingMatch) return

  const currentLevel = headingMatch[1].length
  const sectionBlocks = [currentBlock.content]

  // 次の同レベルまたはそれ以上の見出しが現れるまでのブロックを集める
  for (let i = blockIndex + 1; i < blocks.value.length; i++) {
    const nextBlock = blocks.value[i]
    const nextContent = nextBlock.content.trim()
    const nextHeadingMatch = nextContent.match(/^(#{1,6})\s/)

    // 次の見出しが同レベルまたはそれ以上の場合は終了
    if (nextHeadingMatch && nextHeadingMatch[1].length <= currentLevel) {
      break
    }

    sectionBlocks.push(nextBlock.content)
  }

  try {
    // セクション全体を改行で連結してコピー
    navigator.clipboard.writeText(sectionBlocks.join('\n'))
    copiedBlockId.value = blockId
    // 2秒後にリセット
    setTimeout(() => {
      copiedBlockId.value = null
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

</script>

<template>
  <div class="markdown-editor">
    <div class="blocks-container" @click="handleContainerClick">
      <div
        v-for="(block, index) in blocks"
        :key="block.id"
        class="block"
        :class="[
          `block-type-${getBlockType(block.content)}`,
          {
            'is-editing': editingBlockId === block.id,
            'is-hovered': hoveredBlockId === block.id && editingBlockId !== block.id,
            'is-dragging': draggedBlockIndex === index,
            'is-drag-over': dragOverBlockIndex === index,
            'is-in-copy-section': sectionBlockIds.has(block.id)
          }
        ]"
        @mouseenter="hoveredBlockId = block.id"
        @mouseleave="hoveredBlockId = null"
        @dragover="handleDragOver($event, index)"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, index)"
      >
        <div
          class="block-handle"
          :class="{ visible: hoveredBlockId === block.id || editingBlockId === block.id }"
          draggable="true"
          @dragstart="handleDragStart($event, index)"
          @dragend="handleDragEnd"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="2" />
            <circle cx="15" cy="6" r="2" />
            <circle cx="9" cy="12" r="2" />
            <circle cx="15" cy="12" r="2" />
            <circle cx="9" cy="18" r="2" />
            <circle cx="15" cy="18" r="2" />
          </svg>
        </div>
        <div class="block-content">
          <button
            v-if="(hoveredBlockId === block.id || editingBlockId === block.id) && block.content.trim().match(/^#{1,6}\s/)"
            class="block-copy-btn"
            :class="{ copied: copiedBlockId === block.id }"
            @click.stop="copySection(block.id)"
            @mouseenter="hoveredCopyBlockId = block.id"
            @mouseleave="hoveredCopyBlockId = null"
            :title="copiedBlockId === block.id ? 'Copied!' : 'Copy section'"
          >
            <svg v-if="copiedBlockId !== block.id" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          <!-- フォーマットツールバー -->
          <div v-if="editingBlockId === block.id" class="format-toolbar">
            <button @mousedown.prevent="applyFormat('h1')" class="toolbar-btn" title="見出し1">H1</button>
            <button @mousedown.prevent="applyFormat('h2')" class="toolbar-btn" title="見出し2">H2</button>
            <button @mousedown.prevent="applyFormat('h3')" class="toolbar-btn" title="見出し3">H3</button>
            <div class="toolbar-divider"></div>
            <button @mousedown.prevent="applyFormat('bold')" class="toolbar-btn" title="太字">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
              </svg>
            </button>
            <button @mousedown.prevent="applyFormat('italic')" class="toolbar-btn" title="斜体">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="19" y1="4" x2="10" y2="4"></line>
                <line x1="14" y1="20" x2="5" y2="20"></line>
                <line x1="15" y1="4" x2="9" y2="20"></line>
              </svg>
            </button>
            <button @mousedown.prevent="applyFormat('code')" class="toolbar-btn" title="コード">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </button>
            <div class="toolbar-divider"></div>
            <button @mousedown.prevent="applyFormat('bullet')" class="toolbar-btn" title="箇条書き">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="9" y1="6" x2="20" y2="6"></line>
                <line x1="9" y1="12" x2="20" y2="12"></line>
                <line x1="9" y1="18" x2="20" y2="18"></line>
                <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"></circle>
                <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"></circle>
                <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"></circle>
              </svg>
            </button>
            <button @mousedown.prevent="applyFormat('checklist')" class="toolbar-btn" title="チェックリスト">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="3" y="5" width="6" height="6" rx="1"></rect>
                <line x1="12" y1="8" x2="21" y2="8"></line>
              </svg>
            </button>
            <button @mousedown.prevent="applyFormat('quote')" class="toolbar-btn" title="引用">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
              </svg>
            </button>
            <div class="toolbar-divider"></div>
            <button @mousedown.prevent="applyFormat('code-block')" class="toolbar-btn" title="コードブロック">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <polyline points="10 9 7 12 10 15"></polyline>
                <polyline points="14 15 17 12 14 9"></polyline>
              </svg>
            </button>
            <button @mousedown.prevent="applyFormat('table')" class="toolbar-btn" :class="{ active: showTableInput }" title="テーブル">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="3" y1="15" x2="21" y2="15"></line>
                <line x1="12" y1="3" x2="12" y2="21"></line>
              </svg>
            </button>
            <div v-if="showTableInput" class="table-input-group" @mousedown.stop>
              <input
                type="number"
                v-model.number="tableRows"
                min="2"
                max="20"
                class="table-input"
                placeholder="行"
                @focus="ignoreBlur = true"
                @blur="ignoreBlur = false"
              />
              <span class="table-input-separator">×</span>
              <input
                type="number"
                v-model.number="tableCols"
                min="2"
                max="10"
                class="table-input"
                placeholder="列"
                @focus="ignoreBlur = true"
                @blur="ignoreBlur = false"
              />
              <button @mousedown.prevent="insertTable" class="toolbar-btn table-insert-btn" title="挿入">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
            </div>
          </div>

          <textarea
            v-if="editingBlockId === block.id"
            :ref="(el) => setBlockRef(block.id, el as HTMLTextAreaElement)"
            :value="block.content"
            class="block-textarea"
            :placeholder="index === 0 ? 'Type \'/\' for commands or start writing...' : ''"
            @input="(e) => handleInput(e, block.id)"
            @blur="() => handleBlur(block.id)"
            @keydown="(e) => handleKeydown(e, block.id, index)"
            @paste="(e) => handlePaste(e, block.id)"
          />
          <div
            v-else
            class="block-preview"
            @click.stop="(e) => handlePreviewClick(e, block.id)"
            v-html="getRenderedBlock(block)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.markdown-editor {
  min-height: 400px;
  position: relative;
}

.format-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 4px;
  padding: 2px 4px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.15s ease-out;
  width: fit-content;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: #666;
  cursor: pointer;
  transition: all 0.12s;
  padding: 0 4px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
}

.toolbar-btn:hover {
  background: rgba(55, 53, 47, 0.08);
  color: #000;
}

.toolbar-btn:active {
  background: rgba(55, 53, 47, 0.14);
  transform: scale(0.96);
}

.toolbar-btn.active {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.toolbar-divider {
  width: 1px;
  height: 14px;
  background: #e5e5e5;
  margin: 0 2px;
}

.table-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-left: 4px;
  border-left: 1px solid #e5e5e5;
  margin-left: 4px;
}

.table-input {
  width: 36px;
  height: 22px;
  padding: 0 6px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 11px;
  text-align: center;
  color: #37352f;
  background: white;
}

.table-input:focus {
  outline: none;
  border-color: #2563eb;
}

.table-input::placeholder {
  color: #9ca3af;
  font-size: 10px;
}

.table-input-separator {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
}

.table-insert-btn {
  background: #2563eb;
  color: white;
}

.table-insert-btn:hover {
  background: #1d4ed8;
}

.blocks-container {
  min-height: 400px;
  padding: 28px 20px 28px 48px;
  cursor: text;
}

.block {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin: 0;
  padding: 3px 0;
  border-radius: 4px;
  transition: background 0.1s;
}

.block.is-hovered {
  background: rgba(55, 53, 47, 0.03);
}

.block.is-editing {
  background: rgba(55, 53, 47, 0.06);
}

.block.is-dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.block.is-drag-over {
  border-top: 2px solid #2563eb;
  margin-top: -2px;
}

.block.is-in-copy-section {
  background: rgba(37, 99, 235, 0.08);
  border-left: 3px solid #2563eb;
  padding-left: 5px;
  margin-left: -8px;
}

.block-handle {
  position: absolute;
  left: -32px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: #b0b0b0;
  cursor: grab;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s;
  user-select: none;
}

.block-handle:active {
  cursor: grabbing;
}

.block-handle.visible {
  opacity: 1;
}

.block-handle:hover {
  background: rgba(55, 53, 47, 0.08);
  color: #888;
}

.block-copy-btn {
  position: absolute;
  right: 0;
  top: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e5e5;
  color: #666;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  z-index: 10;
}

.block-copy-btn:hover {
  background: white;
  border-color: #d0d0d0;
  color: #37352f;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.block-copy-btn.copied {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.block-content {
  flex: 1;
  min-width: 0;
  position: relative;
}

.block-textarea {
  width: 100%;
  padding: 4px 8px;
  margin: -4px -8px;
  border: none;
  border-radius: 4px;
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  outline: none;
  background: transparent;
  overflow: hidden;
  min-height: 26px;
  color: #37352f;
}

.block-type-heading-1 .block-textarea,
.block-type-heading-2 .block-textarea,
.block-type-heading-3 .block-textarea {
  font-weight: 600;
}

.block-type-heading-1 .block-textarea {
  font-size: 30px;
  line-height: 1.3;
}

.block-type-heading-2 .block-textarea {
  font-size: 24px;
  line-height: 1.3;
}

.block-type-heading-3 .block-textarea {
  font-size: 20px;
  line-height: 1.3;
}

.block-type-code-block .block-textarea {
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  background: #f8f8f8;
  color: #37352f;
  padding: 16px 20px;
  margin: 0;
  border-radius: 6px;
  border: 1px solid #e5e5e5;
  line-height: 1.6;
}

.block-preview {
  cursor: text;
  line-height: 1.6;
  font-size: 15px;
  min-height: 26px;
  color: #37352f;
  padding: 0 4px;
}

.block-preview :deep(.empty-line) {
  min-height: 26px;
}

.block-preview :deep(> *:first-child) {
  margin-top: 0;
}

.block-preview :deep(> *:last-child) {
  margin-bottom: 0;
}

.block-preview :deep(p) {
  margin: 0;
  min-height: 26px;
}

.block-preview :deep(h1) {
  font-size: 30px;
  font-weight: 600;
  margin: 0;
  padding: 3px 0;
  line-height: 1.3;
  color: #37352f;
}

.block-preview :deep(h2) {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  padding: 3px 0;
  line-height: 1.3;
  color: #37352f;
}

.block-preview :deep(h3) {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  padding: 2px 0;
  line-height: 1.3;
  color: #37352f;
}

.block-preview :deep(h4),
.block-preview :deep(h5),
.block-preview :deep(h6) {
  font-weight: 600;
  margin: 0;
  padding: 2px 0;
  color: #37352f;
}

.block-preview :deep(ul),
.block-preview :deep(ol) {
  margin: 0;
  padding-left: 1.5em;
}

.block-preview :deep(li) {
  margin: 0;
  padding: 2px 0;
}

.block-preview :deep(li p) {
  margin: 0;
}

.block-preview :deep(li::marker) {
  color: #37352f;
}

.block-preview :deep(code) {
  background: rgba(135, 131, 120, 0.15);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-size: 0.875em;
  color: #eb5757;
}

.block-preview :deep(.code-block-wrapper) {
  position: relative;
  margin: 4px 0;
}

.block-preview :deep(.code-lang-label) {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #6b7280;
  text-transform: lowercase;
  pointer-events: none;
  z-index: 1;
}

.block-preview :deep(.shiki) {
  background: #f8f8f8 !important;
  padding: 16px 20px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0;
  border: 1px solid #e5e5e5;
}

.block-preview :deep(.shiki code) {
  background: none !important;
  padding: 0;
  color: inherit;
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.block-preview :deep(pre:not(.shiki)) {
  background: #f8f8f8;
  padding: 16px 20px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 4px 0;
  border: 1px solid #e5e5e5;
}

.block-preview :deep(pre:not(.shiki) code) {
  background: none;
  padding: 0;
  color: #37352f;
  font-size: 13px;
}

.block-preview :deep(blockquote) {
  border-left: 3px solid #37352f;
  margin: 4px 0;
  padding-left: 14px;
  color: #37352f;
}

.block-preview :deep(blockquote p) {
  margin: 0;
}

.block-preview :deep(a) {
  color: #2563eb;
  text-decoration: underline;
  text-decoration-color: rgba(37, 99, 235, 0.4);
  text-underline-offset: 2px;
  cursor: pointer;
}

.block-preview :deep(a:hover) {
  text-decoration-color: #2563eb;
  color: #1d4ed8;
}

.block-preview :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 4px 0;
  font-size: 14px;
  display: block;
  overflow-x: auto;
  white-space: nowrap;
}

.block-preview :deep(thead),
.block-preview :deep(tbody),
.block-preview :deep(tr) {
  display: table;
  width: 100%;
  table-layout: fixed;
}

.block-preview :deep(th),
.block-preview :deep(td) {
  border: 1px solid #e9e9e7;
  padding: 8px 10px;
  text-align: left;
  white-space: normal;
  word-wrap: break-word;
}

.block-preview :deep(th) {
  background: #f7f6f3;
  font-weight: 500;
}

.block-preview :deep(tr:hover td) {
  background: rgba(55, 53, 47, 0.03);
}

.block-preview :deep(hr) {
  border: none;
  border-top: 1px solid #e9e9e7;
  margin: 8px 0;
}

.block-preview :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.block-preview :deep(strong) {
  font-weight: 600;
}

.block-preview :deep(em) {
  font-style: italic;
}

/* チェックリストスタイル */
.block-preview :deep(.checklist-item) {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  padding: 2px 0;
}

.block-preview :deep(.checklist-checkbox) {
  width: 16px;
  height: 16px;
  margin-top: 4px;
  cursor: pointer;
  accent-color: #2563eb;
  flex-shrink: 0;
  pointer-events: auto;
}

.block-preview :deep(.checklist-text) {
  flex: 1;
  line-height: 1.6;
}

.block-preview :deep(.checklist-item.checked .checklist-text) {
  text-decoration: line-through;
  color: #9ca3af;
}

/* リンクプレビューカード */
.block-preview :deep(.link-preview-card) {
  display: flex;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  background: #fff;
  transition: box-shadow 0.2s, border-color 0.2s;
  max-width: 100%;
  margin-top: 8px;
}

.block-preview :deep(.link-preview-card:hover) {
  border-color: #d0d0d0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.block-preview :deep(.link-preview-content) {
  flex: 1;
  min-width: 0;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.block-preview :deep(.link-preview-title) {
  font-weight: 500;
  font-size: 14px;
  color: #37352f;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.block-preview :deep(.link-preview-description) {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.block-preview :deep(.link-preview-site) {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.block-preview :deep(.link-preview-favicon) {
  width: 14px;
  height: 14px;
  border-radius: 2px;
}

/* ローディングスケルトン */
@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.block-preview :deep(.link-preview-loading) {
  pointer-events: none;
}

.block-preview :deep(.link-preview-title-skeleton) {
  height: 16px;
  width: 60%;
  background: #e5e5e5;
  border-radius: 4px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.block-preview :deep(.link-preview-description-skeleton) {
  height: 12px;
  width: 80%;
  background: #e5e5e5;
  border-radius: 4px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  animation-delay: 0.1s;
}

.block-preview :deep(.link-preview-favicon-skeleton) {
  width: 14px;
  height: 14px;
  background: #e5e5e5;
  border-radius: 2px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  animation-delay: 0.2s;
}
</style>

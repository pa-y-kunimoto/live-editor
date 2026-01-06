<script setup lang="ts">
import { marked } from 'marked'

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

    if (trimmed.match(/^#{1,6}\s/) || trimmed.match(/^[-*+]\s(\[[ x]\]\s)?/) || trimmed.match(/^\d+\.\s/) || trimmed.match(/^>\s/) || trimmed.match(/^[-*_]{3,}$/)) {
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

  // チェックリストのレンダリング
  const checklistInfo = parseChecklist(content)
  if (checklistInfo) {
    const checkedClass = checklistInfo.checked ? 'checked' : ''
    const checkedAttr = checklistInfo.checked ? 'checked' : ''
    const indentStyle = checklistInfo.indent ? `style="margin-left: ${checklistInfo.indent.length * 8}px"` : ''
    const textHtml = marked.parseInline(checklistInfo.text, { async: false }) as string
    highlightedBlocks.value.set(
      block.id,
      `<div class="checklist-item ${checkedClass}" ${indentStyle} data-block-id="${block.id}">
        <input type="checkbox" ${checkedAttr} class="checklist-checkbox" />
        <span class="checklist-text">${textHtml}</span>
      </div>`
    )
    return
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

  if (event.key === 'Escape') {
    stopEditing()
    return
  }

  if (event.key === 'Enter' && !event.shiftKey) {
    // IME変換中は何もしない
    if (event.isComposing) {
      return
    }

    const cursorPos = textarea.selectionStart
    const content = textarea.value

    // コードブロック内では通常の改行を許可
    if (content.trim().startsWith('```')) {
      return
    }

    event.preventDefault()

    // blurイベントを無視するフラグを設定（Enter処理中のblur発火を防ぐ）
    ignoreBlur.value = true

    const beforeCursor = content.slice(0, cursorPos)
    const afterCursor = content.slice(cursorPos)

    // 箇条書きの自動補完
    let nextContent = afterCursor
    let nextCursorPos = 0
    const trimmedContent = content.trim()

    // チェックリスト（- [ ] または - [x]）
    const checklistMatch = trimmedContent.match(/^([-*+])\s\[[ x]\]\s/)
    if (checklistMatch) {
      // 空のチェックリストの場合は終了
      if (trimmedContent.match(/^[-*+]\s\[[ x]\]\s*$/)) {
        const newBlocks = [...blocks.value]
        newBlocks[blockIndex] = { ...newBlocks[blockIndex], content: '' }
        emit('update:modelValue', newBlocks.map(b => b.content).join('\n'))
        return
      }
      nextContent = `${checklistMatch[1]} [ ] ${afterCursor}`
      nextCursorPos = 6
    }
    // 箇条書き（- または * または +）
    else {
      const bulletMatch = trimmedContent.match(/^([-*+])\s/)
      if (bulletMatch) {
        // 空の箇条書きの場合は箇条書きを終了
        if (trimmedContent === bulletMatch[0].trim()) {
          const newBlocks = [...blocks.value]
          newBlocks[blockIndex] = { ...newBlocks[blockIndex], content: '' }
          emit('update:modelValue', newBlocks.map(b => b.content).join('\n'))
          return
        }
        nextContent = `${bulletMatch[1]} ${afterCursor}`
        nextCursorPos = 2
      }
    }

    // 番号付きリスト（1. 2. など）
    const numberedMatch = trimmedContent.match(/^(\d+)\.\s/)
    if (numberedMatch) {
      // 空の番号付きリストの場合はリストを終了
      if (trimmedContent === numberedMatch[0].trim()) {
        const newBlocks = [...blocks.value]
        newBlocks[blockIndex] = { ...newBlocks[blockIndex], content: '' }
        emit('update:modelValue', newBlocks.map(b => b.content).join('\n'))
        return
      }
      const nextNumber = parseInt(numberedMatch[1]) + 1
      nextContent = `${nextNumber}. ${afterCursor}`
      nextCursorPos = `${nextNumber}. `.length
    }

    // URLのみのブロックの場合、ハイパーリンク化してOGP取得
    const urlPattern = /^(https?:\/\/[^\s]+)$/
    const urlMatch = trimmedContent.match(urlPattern)
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

    // 箇条書きまたは番号付きリストの場合
    const isBullet = trimmed.match(/^([-*+])\s/)
    const isNumbered = trimmed.match(/^(\d+)\.\s/)

    if (isBullet || isNumbered) {
      event.preventDefault()
      const cursorPos = textarea.selectionStart

      // 現在のインデントレベルを取得
      const currentIndentMatch = content.match(/^(\s*)/)
      const currentIndent = currentIndentMatch ? currentIndentMatch[1].length : 0

      if (event.shiftKey) {
        // Shift+Tab: インデント解除（先頭のスペースを削除）
        if (currentIndent > 0) {
          const removeSpaces = Math.min(2, currentIndent)
          const newContent = content.slice(removeSpaces)
          updateBlock(blockId, newContent)
          nextTick(() => {
            textarea.setSelectionRange(
              Math.max(0, cursorPos - removeSpaces),
              Math.max(0, cursorPos - removeSpaces)
            )
          })
        }
      } else {
        // Tab: インデント追加（先頭に2スペース追加）
        // 直前のブロックのインデント+2までに制限
        let maxIndent = 2 // デフォルトは1レベル（2スペース）まで

        if (blockIndex > 0) {
          const prevBlock = blocks.value[blockIndex - 1]
          const prevContent = prevBlock.content
          const prevIndentMatch = prevContent.match(/^(\s*)/)
          const prevIndent = prevIndentMatch ? prevIndentMatch[1].length : 0
          const prevIsList = prevContent.trim().match(/^([-*+]|\d+\.)\s/)

          if (prevIsList) {
            // 直前がリストの場合、そのインデント+2まで許可
            maxIndent = prevIndent + 2
          }
        }

        if (currentIndent < maxIndent) {
          const newContent = '  ' + content
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

function toggleCheckbox(blockId: string) {
  const block = blocks.value.find(b => b.id === blockId)
  if (!block) return

  const content = block.content
  let newContent: string

  if (content.match(/\[ \]/)) {
    newContent = content.replace('[ ]', '[x]')
  } else if (content.match(/\[x\]/)) {
    newContent = content.replace('[x]', '[ ]')
  } else {
    return
  }

  updateBlock(blockId, newContent)
}

function handlePreviewClick(event: MouseEvent, blockId: string) {
  const target = event.target as HTMLElement

  // チェックボックス本体（input要素）がクリックされた場合のみトグル
  if (target.tagName === 'INPUT' && target.classList.contains('checklist-checkbox')) {
    event.preventDefault()
    event.stopPropagation()
    toggleCheckbox(blockId)
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
            'is-hovered': hoveredBlockId === block.id && editingBlockId !== block.id
          }
        ]"
        @mouseenter="hoveredBlockId = block.id"
        @mouseleave="hoveredBlockId = null"
      >
        <div class="block-handle" :class="{ visible: hoveredBlockId === block.id || editingBlockId === block.id }">
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
}

.block-handle.visible {
  opacity: 1;
}

.block-handle:hover {
  background: rgba(55, 53, 47, 0.08);
  color: #888;
}

.block-content {
  flex: 1;
  min-width: 0;
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
}

.block-preview :deep(th),
.block-preview :deep(td) {
  border: 1px solid #e9e9e7;
  padding: 8px 10px;
  text-align: left;
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

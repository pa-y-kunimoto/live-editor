import { nextTick } from 'vue'

export function useFormatToolbar(
  getEditingBlockId: () => string | null,
  getTextarea: (blockId: string) => HTMLTextAreaElement | null,
  updateBlock: (blockId: string, content: string) => void,
  adjustTextareaHeight: (textarea: HTMLTextAreaElement) => void
) {
  function applyFormat(format: string) {
    const blockId = getEditingBlockId()
    if (blockId === null) return

    // テーブルの場合は/tableコマンドを挿入
    if (format === 'table') {
      const textarea = getTextarea(blockId)
      if (!textarea) return

      updateBlock(blockId, '/table 3 3')

      nextTick(() => {
        textarea.focus()
        textarea.setSelectionRange(10, 10)
        adjustTextareaHeight(textarea)
      })
      return
    }

    const textarea = getTextarea(blockId)
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

  return {
    applyFormat
  }
}

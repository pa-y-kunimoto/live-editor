import { nextTick, type Ref, type ComputedRef } from 'vue'
import type { Block } from './useMarkdownBlocks'
import { useTableGenerator } from './useTableGenerator'

interface KeyboardHandlerDeps {
  blocks: ComputedRef<Block[]>
  editingBlockIndex: Ref<number | null>
  editingBlockId: ComputedRef<string | null>
  blockRefs: Ref<Map<string, HTMLTextAreaElement>>
  pendingFocus: Ref<{ blockIndex: number; cursorPos: number } | null>
  ignoreBlur: Ref<boolean>
  emit: (event: 'update:modelValue', value: string) => void
  updateBlock: (blockId: string, newContent: string) => void
  adjustTextareaHeight: (textarea: HTMLTextAreaElement) => void
  startEditingByIndex: (blockIndex: number, cursorPos?: number) => void
  stopEditing: () => void
  undo: () => void
  redo: () => void
  processUrlBlock: (url: string) => void
}

export function useKeyboardHandler(deps: KeyboardHandlerDeps) {
  const { generateTableMarkdown, parseTableCommand } = useTableGenerator()

  function handleKeydown(event: KeyboardEvent, blockId: string, blockIndex: number) {
    const textarea = event.target as HTMLTextAreaElement
    const {
      blocks,
      editingBlockId,
      blockRefs,
      pendingFocus,
      ignoreBlur,
      emit,
      updateBlock,
      adjustTextareaHeight,
      startEditingByIndex,
      stopEditing,
      undo,
      redo,
      processUrlBlock
    } = deps

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

      const tableParams = parseTableCommand(beforeCursor)
      if (tableParams) {
        event.preventDefault()
        const tableMarkdown = generateTableMarkdown(tableParams.rows, tableParams.cols)
        if (tableMarkdown) {
          const afterCursor = content.slice(cursorPos)
          updateBlock(blockId, tableMarkdown + afterCursor)

          nextTick(() => {
            const ta = blockRefs.value.get(blockId)
            if (ta) {
              adjustTextareaHeight(ta)
              const firstCellPos = 2
              ta.setSelectionRange(firstCellPos, firstCellPos + 7)
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
      const tableParams = parseTableCommand(content)
      if (tableParams) {
        event.preventDefault()
        const tableMarkdown = generateTableMarkdown(tableParams.rows, tableParams.cols)
        if (tableMarkdown) {
          updateBlock(blockId, tableMarkdown)

          nextTick(() => {
            const ta = blockRefs.value.get(blockId)
            if (ta) {
              adjustTextareaHeight(ta)
              const firstCellPos = 2
              ta.setSelectionRange(firstCellPos, firstCellPos + 7)
            }
          })
        }
        return
      }

      // コードブロック内では通常の改行を許可し、インデントを維持
      if (content.trim().startsWith('```')) {
        event.preventDefault()

        const beforeCursor = content.slice(0, cursorPos)
        const lastNewlineIndex = beforeCursor.lastIndexOf('\n')
        const currentLineStart = lastNewlineIndex + 1
        const currentLine = content.slice(currentLineStart, cursorPos)

        const indentMatch = currentLine.match(/^(\s*)/)
        const indent = indentMatch?.[1] ?? ''

        const newContent = content.slice(0, cursorPos) + '\n' + indent + content.slice(cursorPos)
        updateBlock(blockId, newContent)

        nextTick(() => {
          const ta = blockRefs.value.get(blockId)
          if (ta) {
            const newCursorPos = cursorPos + 1 + indent.length
            ta.setSelectionRange(newCursorPos, newCursorPos)
            adjustTextareaHeight(ta)
          }
        })
        return
      }

      event.preventDefault()
      ignoreBlur.value = true

      const beforeCursor = content.slice(0, cursorPos)
      const afterCursor = content.slice(cursorPos)

      // 現在のカーソル位置の行を特定
      const lines = content.split('\n')
      let currentLineIndex = 0
      let charCount = 0
      for (let i = 0; i < lines.length; i++) {
        const lineLen = lines[i]?.length ?? 0
        if (charCount + lineLen >= cursorPos) {
          currentLineIndex = i
          break
        }
        charCount += lineLen + 1
      }
      const currentLine = lines[currentLineIndex] ?? ''
      const currentLineTrimmed = currentLine.trim()

      let lineStartPos = 0
      for (let i = 0; i < currentLineIndex; i++) {
        lineStartPos += (lines[i]?.length ?? 0) + 1
      }

      const currentLineLen = lines[currentLineIndex]?.length ?? 0
      const currentLineEndPos = currentLineIndex < lines.length - 1
        ? lineStartPos + currentLineLen
        : content.length
      const afterCurrentLine = currentLineIndex < lines.length - 1 ? content.slice(currentLineEndPos) : ''
      const currentLineAfterCursor = content.slice(cursorPos, currentLineEndPos)

      let nextContent = afterCursor
      let nextCursorPos = 0

      // チェックリスト
      const checklistMatch = currentLineTrimmed.match(/^([-*+])\s\[[ x]\]\s/)
      if (checklistMatch) {
        if (currentLineTrimmed.match(/^[-*+]\s\[[ x]\]\s*$/)) {
          handleEmptyListExit(lines, currentLineIndex, blockIndex, blocks, emit, startEditingByIndex, ignoreBlur)
          return
        }
        const indentMatch = currentLine.match(/^(\s*)/)
        const indent = indentMatch?.[1] ?? ''
        nextContent = `${indent}${checklistMatch[1]} [ ] ${currentLineAfterCursor}`
        nextCursorPos = indent.length + 6
      }

      // 箇条書き
      const bulletMatch = !checklistMatch ? currentLineTrimmed.match(/^([-*+])\s/) : null
      if (bulletMatch) {
        if (currentLineTrimmed === bulletMatch[0].trim()) {
          handleEmptyListExit(lines, currentLineIndex, blockIndex, blocks, emit, startEditingByIndex, ignoreBlur)
          return
        }
        const indentMatch = currentLine.match(/^(\s*)/)
        const indent = indentMatch?.[1] ?? ''
        nextContent = `${indent}${bulletMatch[1]} ${currentLineAfterCursor}`
        nextCursorPos = indent.length + 2
      }

      // 番号付きリスト
      const numberedMatch = currentLineTrimmed.match(/^(\d+)\.\s/)
      if (numberedMatch && numberedMatch[1]) {
        if (currentLineTrimmed === numberedMatch[0].trim()) {
          handleEmptyListExit(lines, currentLineIndex, blockIndex, blocks, emit, startEditingByIndex, ignoreBlur)
          return
        }
        const nextNumber = parseInt(numberedMatch[1]) + 1
        const indentMatch = currentLine.match(/^(\s*)/)
        const indent = indentMatch?.[1] ?? ''
        nextContent = `${indent}${nextNumber}. ${currentLineAfterCursor}`
        nextCursorPos = indent.length + `${nextNumber}. `.length
      }

      // 引用
      const quoteMatch = currentLineTrimmed.match(/^(>+)\s?/)
      if (quoteMatch && quoteMatch[1]) {
        if (currentLineTrimmed === quoteMatch[0].trim() || currentLineTrimmed === quoteMatch[1]) {
          handleEmptyListExit(lines, currentLineIndex, blockIndex, blocks, emit, startEditingByIndex, ignoreBlur)
          return
        }
        const indentMatch = currentLine.match(/^(\s*)/)
        const indent = indentMatch?.[1] ?? ''
        nextContent = `${indent}${quoteMatch[1]} ${currentLineAfterCursor}`
        nextCursorPos = indent.length + quoteMatch[1].length + 1
      }

      // URLのみのブロックの場合
      const urlPattern = /^(https?:\/\/[^\s]+)$/
      const urlMatch = currentLineTrimmed.match(urlPattern)
      if (urlMatch && urlMatch[1]) {
        const url = urlMatch[1]

        const currentBlock = blocks.value[blockIndex]
        if (!currentBlock) return

        const newBlocks = [...blocks.value]
        newBlocks[blockIndex] = { ...currentBlock, content: `[${url}](${url})` }
        newBlocks.splice(blockIndex + 1, 0, {
          id: `block-${Date.now()}`,
          content: ''
        })

        emit('update:modelValue', newBlocks.map(b => b.content).join('\n'))

        const nextBlockIndex = blockIndex + 1
        pendingFocus.value = { blockIndex: nextBlockIndex, cursorPos: 0 }
        deps.editingBlockIndex.value = nextBlockIndex

        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            const nextBlockId = editingBlockId.value
            if (nextBlockId) {
              const ta = blockRefs.value.get(nextBlockId)
              if (ta) {
                ta.focus()
                adjustTextareaHeight(ta)
                if (pendingFocus.value) {
                  ta.setSelectionRange(pendingFocus.value.cursorPos, pendingFocus.value.cursorPos)
                  pendingFocus.value = null
                }
              }
              setTimeout(() => {
                ignoreBlur.value = false
              }, 50)
            }
          })
        })

        processUrlBlock(url)
        return
      }

      // リスト項目または引用の場合は、同じブロック内に新しい行を追加
      if (checklistMatch || bulletMatch || numberedMatch || quoteMatch) {
        const newContent = beforeCursor + '\n' + nextContent + afterCurrentLine
        updateBlock(blockId, newContent)

        setTimeout(() => {
          ignoreBlur.value = false
        }, 0)

        nextTick(() => {
          const ta = blockRefs.value.get(blockId)
          if (ta) {
            const newCursorPos = beforeCursor.length + 1 + nextCursorPos
            ta.focus()
            ta.setSelectionRange(newCursorPos, newCursorPos)
            adjustTextareaHeight(ta)
          }
        })
        return
      }

      // リスト以外の場合は新しいブロックを作成
      const currentBlock = blocks.value[blockIndex]
      if (!currentBlock) return

      const newBlocks = [...blocks.value]
      newBlocks[blockIndex] = { ...currentBlock, content: beforeCursor }
      newBlocks.splice(blockIndex + 1, 0, {
        id: `block-${Date.now()}`,
        content: nextContent
      })

      emit('update:modelValue', newBlocks.map(b => b.content).join('\n'))

      const nextBlockIndex = blockIndex + 1
      pendingFocus.value = { blockIndex: nextBlockIndex, cursorPos: nextCursorPos }
      deps.editingBlockIndex.value = nextBlockIndex

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const nextBlockId = editingBlockId.value
          if (nextBlockId) {
            const ta = blockRefs.value.get(nextBlockId)
            if (ta) {
              ta.focus()
              adjustTextareaHeight(ta)
              if (pendingFocus.value) {
                ta.setSelectionRange(pendingFocus.value.cursorPos, pendingFocus.value.cursorPos)
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

    // Backspace
    if (event.key === 'Backspace' && textarea.selectionStart === 0 && textarea.selectionEnd === 0 && blockIndex > 0) {
      event.preventDefault()
      ignoreBlur.value = true
      const currentContent = textarea.value
      const prevBlockIndex = blockIndex - 1

      const newBlocks = [...blocks.value]
      const prevBlock = newBlocks[prevBlockIndex]
      if (!prevBlock) return

      const prevContent = prevBlock.content
      const cursorPosition = prevContent.length

      newBlocks[prevBlockIndex] = { ...prevBlock, content: prevContent + currentContent }
      newBlocks.splice(blockIndex, 1)

      emit('update:modelValue', newBlocks.map(b => b.content).join('\n'))

      startEditingByIndex(prevBlockIndex, cursorPosition)
      return
    }

    // ArrowUp
    if (event.key === 'ArrowUp' && textarea.selectionStart === 0 && blockIndex > 0) {
      event.preventDefault()
      ignoreBlur.value = true
      startEditingByIndex(blockIndex - 1)
      return
    }

    // ArrowDown
    if (event.key === 'ArrowDown' && textarea.selectionEnd === textarea.value.length && blockIndex < blocks.value.length - 1) {
      event.preventDefault()
      ignoreBlur.value = true
      startEditingByIndex(blockIndex + 1)
      return
    }

    // Tab
    if (event.key === 'Tab') {
      handleTabKey(event, textarea, blockId, updateBlock, adjustTextareaHeight)
      return
    }
  }

  function handleEmptyListExit(
    lines: string[],
    currentLineIndex: number,
    blockIndex: number,
    blocks: ComputedRef<Block[]>,
    emit: (event: 'update:modelValue', value: string) => void,
    startEditingByIndex: (index: number, cursorPos?: number) => void,
    ignoreBlur: Ref<boolean>
  ) {
    const newLines = [...lines]
    newLines.splice(currentLineIndex, 1)
    const currentBlockContent = newLines.join('\n').trim()

    const currentBlock = blocks.value[blockIndex]
    if (!currentBlock) return

    const newBlocks = [...blocks.value]
    if (currentBlockContent) {
      newBlocks[blockIndex] = { ...currentBlock, content: currentBlockContent }
      newBlocks.splice(blockIndex + 1, 0, { id: `block-${Date.now()}`, content: '' })
    } else {
      newBlocks[blockIndex] = { ...currentBlock, content: '' }
    }

    emit('update:modelValue', newBlocks.map(b => b.content).join('\n'))

    const nextBlockIndex = currentBlockContent ? blockIndex + 1 : blockIndex
    nextTick(() => {
      startEditingByIndex(nextBlockIndex, 0)
      ignoreBlur.value = false
    })
  }

  function handleTabKey(
    event: KeyboardEvent,
    textarea: HTMLTextAreaElement,
    blockId: string,
    updateBlock: (blockId: string, content: string) => void,
    adjustTextareaHeight: (textarea: HTMLTextAreaElement) => void
  ) {
    const content = textarea.value
    const trimmed = content.trim()

    // コードブロック内の場合
    if (trimmed.startsWith('```')) {
      event.preventDefault()
      const cursorPos = textarea.selectionStart

      const langMatch = trimmed.match(/^```(\w+)/)
      const lang = langMatch?.[1]?.toLowerCase() ?? ''

      let indentSize = 2
      if (['python', 'java', 'c', 'cpp', 'csharp', 'go', 'php', 'rust', 'swift'].includes(lang)) {
        indentSize = 4
      }

      const indent = ' '.repeat(indentSize)

      const beforeCursor = content.slice(0, cursorPos)
      const lastNewlineIndex = beforeCursor.lastIndexOf('\n')
      const currentLineStart = lastNewlineIndex + 1
      const currentLineEnd = content.indexOf('\n', cursorPos)
      const lineEnd = currentLineEnd === -1 ? content.length : currentLineEnd
      const currentLine = content.slice(currentLineStart, lineEnd)

      if (event.shiftKey) {
        const currentIndentMatch = currentLine.match(/^(\s*)/)
        const currentIndent = currentIndentMatch?.[1] ?? ''

        if (currentIndent.length >= indentSize) {
          const newLine = currentLine.slice(indentSize)
          const newContent = content.slice(0, currentLineStart) + newLine + content.slice(lineEnd)
          updateBlock(blockId, newContent)
          nextTick(() => {
            const newCursorPos = Math.max(currentLineStart, cursorPos - indentSize)
            textarea.setSelectionRange(newCursorPos, newCursorPos)
          })
        } else if (currentIndent.length > 0) {
          const newLine = currentLine.slice(currentIndent.length)
          const newContent = content.slice(0, currentLineStart) + newLine + content.slice(lineEnd)
          updateBlock(blockId, newContent)
          nextTick(() => {
            const newCursorPos = Math.max(currentLineStart, cursorPos - currentIndent.length)
            textarea.setSelectionRange(newCursorPos, newCursorPos)
          })
        }
      } else {
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

      const lines = content.split('\n')
      let currentLineIndex = 0
      let charCount = 0
      for (let i = 0; i < lines.length; i++) {
        const lineLen = lines[i]?.length ?? 0
        if (charCount + lineLen >= cursorPos) {
          currentLineIndex = i
          break
        }
        charCount += lineLen + 1
      }
      const currentLine = lines[currentLineIndex] ?? ''

      let lineStartPos = 0
      for (let i = 0; i < currentLineIndex; i++) {
        lineStartPos += (lines[i]?.length ?? 0) + 1
      }

      const currentIndentMatch = currentLine.match(/^(\s*)/)
      const currentIndent = currentIndentMatch?.[1]?.length ?? 0

      if (event.shiftKey) {
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
        let maxIndent = 10

        if (currentLineIndex > 0) {
          const prevLine = lines[currentLineIndex - 1] ?? ''
          const prevIndentMatch = prevLine.match(/^(\s*)/)
          const prevIndent = prevIndentMatch?.[1]?.length ?? 0
          const prevIsList = prevLine.trim().match(/^([-*+]|\d+\.)\s/)

          if (prevIsList) {
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
    }
  }

  return {
    handleKeydown
  }
}

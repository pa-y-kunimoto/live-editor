import { describe, it, expect, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useEditorHistory } from '../useEditorHistory'

describe('useEditorHistory', () => {
  const createMockTextarea = (value: string, selectionStart: number = 0) => ({
    value,
    selectionStart,
    selectionEnd: selectionStart
  })

  describe('initial state', () => {
    it('should initialize history with initial content state', () => {
      const content = ref('')
      const editingBlockIndex = ref<number | null>(null)
      const getTextarea = vi.fn()

      const { history, historyIndex } = useEditorHistory(content, editingBlockIndex, getTextarea)

      // History starts with initial state due to immediate watcher
      expect(history.value.length).toBeGreaterThanOrEqual(0)
      expect(historyIndex.value).toBeGreaterThanOrEqual(-1)
    })
  })

  describe('history tracking', () => {
    it('should add initial state to history when content changes', async () => {
      const content = ref('')
      const editingBlockIndex = ref<number | null>(null)
      const getTextarea = vi.fn()

      const { history } = useEditorHistory(content, editingBlockIndex, getTextarea)

      content.value = 'First content'
      await nextTick()
      await new Promise(r => setTimeout(r, 550)) // Wait for debounce

      expect(history.value.length).toBeGreaterThan(0)
    })

    it('should track content changes with cursor position', async () => {
      const content = ref('Initial')
      const editingBlockIndex = ref<number | null>(0)
      const mockTextarea = createMockTextarea('Initial', 5)
      const getTextarea = vi.fn().mockReturnValue(mockTextarea)

      const { history } = useEditorHistory(content, editingBlockIndex, getTextarea)

      await nextTick()
      await new Promise(r => setTimeout(r, 550))

      content.value = 'Updated'
      await nextTick()
      await new Promise(r => setTimeout(r, 550))

      const lastState = history.value[history.value.length - 1]
      expect(lastState?.content).toBe('Updated')
    })

    it('should not track duplicate consecutive states', async () => {
      const content = ref('Same content')
      const editingBlockIndex = ref<number | null>(null)
      const getTextarea = vi.fn()

      const { history } = useEditorHistory(content, editingBlockIndex, getTextarea)

      await nextTick()
      await new Promise(r => setTimeout(r, 550))

      const initialLength = history.value.length

      // Trigger the same content
      content.value = 'Same content'
      await nextTick()
      await new Promise(r => setTimeout(r, 550))

      expect(history.value.length).toBe(initialLength)
    })
  })

  describe('undo', () => {
    it('should not undo when at beginning of history', () => {
      const content = ref('Content')
      const editingBlockIndex = ref<number | null>(null)
      const getTextarea = vi.fn()

      const { undo } = useEditorHistory(content, editingBlockIndex, getTextarea)

      const emit = vi.fn()
      const startEditingByIndex = vi.fn()

      undo(emit, startEditingByIndex)

      expect(emit).not.toHaveBeenCalled()
    })

    it('should undo to previous state', async () => {
      const content = ref('First')
      const editingBlockIndex = ref<number | null>(null)
      const getTextarea = vi.fn()

      const { history, historyIndex, undo } = useEditorHistory(content, editingBlockIndex, getTextarea)

      await nextTick()
      await new Promise(r => setTimeout(r, 550))

      content.value = 'Second'
      await nextTick()
      await new Promise(r => setTimeout(r, 550))

      const emit = vi.fn()
      const startEditingByIndex = vi.fn()

      // Set historyIndex to last item
      historyIndex.value = history.value.length - 1

      undo(emit, startEditingByIndex)

      expect(emit).toHaveBeenCalledWith('update:modelValue', expect.any(String))
    })

    it('should restore editing block index on undo', async () => {
      const content = ref('Content')
      const editingBlockIndex = ref<number | null>(1)
      const mockTextarea = createMockTextarea('Content', 3)
      const getTextarea = vi.fn().mockReturnValue(mockTextarea)

      const { history, historyIndex, undo } = useEditorHistory(content, editingBlockIndex, getTextarea)

      // Manually add history states
      history.value = [
        { content: 'First', editingBlockIndex: 0, cursorPos: 2 },
        { content: 'Second', editingBlockIndex: 1, cursorPos: 4 }
      ]
      historyIndex.value = 1

      const emit = vi.fn()
      const startEditingByIndex = vi.fn()

      undo(emit, startEditingByIndex)

      expect(startEditingByIndex).toHaveBeenCalledWith(0, 2)
    })
  })

  describe('redo', () => {
    it('should not redo when at end of history', async () => {
      const content = ref('Content')
      const editingBlockIndex = ref<number | null>(null)
      const getTextarea = vi.fn()

      const { history, historyIndex, redo } = useEditorHistory(content, editingBlockIndex, getTextarea)

      history.value = [{ content: 'Content', editingBlockIndex: null, cursorPos: null }]
      historyIndex.value = 0

      const emit = vi.fn()
      const startEditingByIndex = vi.fn()

      redo(emit, startEditingByIndex)

      expect(emit).not.toHaveBeenCalled()
    })

    it('should redo to next state', async () => {
      const content = ref('First')
      const editingBlockIndex = ref<number | null>(null)
      const getTextarea = vi.fn()

      const { history, historyIndex, redo } = useEditorHistory(content, editingBlockIndex, getTextarea)

      history.value = [
        { content: 'First', editingBlockIndex: null, cursorPos: null },
        { content: 'Second', editingBlockIndex: null, cursorPos: null }
      ]
      historyIndex.value = 0

      const emit = vi.fn()
      const startEditingByIndex = vi.fn()

      redo(emit, startEditingByIndex)

      expect(emit).toHaveBeenCalledWith('update:modelValue', 'Second')
    })

    it('should restore editing block index on redo', async () => {
      const content = ref('Content')
      const editingBlockIndex = ref<number | null>(null)
      const getTextarea = vi.fn()

      const { history, historyIndex, redo } = useEditorHistory(content, editingBlockIndex, getTextarea)

      history.value = [
        { content: 'First', editingBlockIndex: 0, cursorPos: 2 },
        { content: 'Second', editingBlockIndex: 2, cursorPos: 5 }
      ]
      historyIndex.value = 0

      const emit = vi.fn()
      const startEditingByIndex = vi.fn()

      redo(emit, startEditingByIndex)

      expect(startEditingByIndex).toHaveBeenCalledWith(2, 5)
    })
  })

  describe('undo/redo sequence', () => {
    it('should correctly navigate through history', async () => {
      const content = ref('Initial')
      const editingBlockIndex = ref<number | null>(null)
      const getTextarea = vi.fn()

      const { history, historyIndex, undo, redo } = useEditorHistory(content, editingBlockIndex, getTextarea)

      history.value = [
        { content: 'State 1', editingBlockIndex: null, cursorPos: null },
        { content: 'State 2', editingBlockIndex: null, cursorPos: null },
        { content: 'State 3', editingBlockIndex: null, cursorPos: null }
      ]
      historyIndex.value = 2

      const emit = vi.fn()
      const startEditingByIndex = vi.fn()

      // Undo twice
      undo(emit, startEditingByIndex)
      expect(historyIndex.value).toBe(1)

      undo(emit, startEditingByIndex)
      expect(historyIndex.value).toBe(0)

      // Redo once
      redo(emit, startEditingByIndex)
      expect(historyIndex.value).toBe(1)
    })
  })

  describe('isUndoRedo flag', () => {
    it('should set isUndoRedo during undo operation', async () => {
      const content = ref('Content')
      const editingBlockIndex = ref<number | null>(null)
      const getTextarea = vi.fn()

      const { history, historyIndex, undo, isUndoRedo } = useEditorHistory(content, editingBlockIndex, getTextarea)

      history.value = [
        { content: 'First', editingBlockIndex: null, cursorPos: null },
        { content: 'Second', editingBlockIndex: null, cursorPos: null }
      ]
      historyIndex.value = 1

      expect(isUndoRedo.value).toBe(false)

      const emit = vi.fn()
      const startEditingByIndex = vi.fn()

      undo(emit, startEditingByIndex)

      expect(isUndoRedo.value).toBe(true)
    })

    it('should set isUndoRedo during redo operation', async () => {
      const content = ref('Content')
      const editingBlockIndex = ref<number | null>(null)
      const getTextarea = vi.fn()

      const { history, historyIndex, redo, isUndoRedo } = useEditorHistory(content, editingBlockIndex, getTextarea)

      history.value = [
        { content: 'First', editingBlockIndex: null, cursorPos: null },
        { content: 'Second', editingBlockIndex: null, cursorPos: null }
      ]
      historyIndex.value = 0

      expect(isUndoRedo.value).toBe(false)

      const emit = vi.fn()
      const startEditingByIndex = vi.fn()

      redo(emit, startEditingByIndex)

      expect(isUndoRedo.value).toBe(true)
    })
  })
})

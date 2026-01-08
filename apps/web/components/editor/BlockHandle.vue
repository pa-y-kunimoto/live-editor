<script setup lang="ts">
defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  dragstart: [event: DragEvent]
  dragend: [event: DragEvent]
}>()
</script>

<template>
  <div
    class="block-handle"
    :class="{ visible }"
    draggable="true"
    @dragstart="emit('dragstart', $event)"
    @dragend="emit('dragend', $event)"
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
</template>

<style scoped>
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
</style>

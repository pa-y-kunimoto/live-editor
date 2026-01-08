<script setup lang="ts">
defineProps<{
  copied: boolean
}>()

const emit = defineEmits<{
  click: []
  mouseenter: []
  mouseleave: []
}>()
</script>

<template>
  <button
    class="block-copy-btn"
    :class="{ copied }"
    @click.stop="emit('click')"
    @mouseenter="emit('mouseenter')"
    @mouseleave="emit('mouseleave')"
    :title="copied ? 'Copied!' : 'Copy section'"
  >
    <svg v-if="!copied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
    <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  </button>
</template>

<style scoped>
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
</style>

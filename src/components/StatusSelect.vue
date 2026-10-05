<script lang="ts">
import type { ProgressState } from '@/types'

type StatusOptionKey = ProgressState | null

interface StatusOptionValue {
  label: string
  class: string
  colorVar: string
}

const STATUS_OPTIONS = new Map<ProgressState, StatusOptionValue>([
  ['reading', { label: 'En cours', class: 'status-reading', colorVar: 'var(--status-reading)' }],
  ['pause', { label: 'En pause', class: 'status-paused', colorVar: 'var(--status-paused)' }],
  ['break', { label: 'Pas intéressé', class: 'status-disinterested', colorVar: 'var(--status-disinterested)' }],
  ['completed', { label: 'Terminé', class: 'status-completed', colorVar: 'var(--status-completed)' }]
])
</script>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  state?: ProgressState | null
}>()

const emit = defineEmits<{
  (e: 'update:state', value: StatusOptionKey): void
}>()

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const closeDropdown = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

const defaultStatus: StatusOptionValue = { label: 'Aucun', class: 'status-none', colorVar: 'var(--status-none)' }

const currentStatus = computed<StatusOptionValue>(() => {
  if (!props.state) return defaultStatus
  return STATUS_OPTIONS.get(props.state) ?? defaultStatus
})

const selectStatus = (statusId: ProgressState) => {
  if (props.state === statusId) {
    emit('update:state', null)
  } else {
    emit('update:state', statusId)
  }
  isOpen.value = false
}

onMounted(() => window.addEventListener('click', closeDropdown))
onUnmounted(() => window.removeEventListener('click', closeDropdown))
</script>

<template>
  <div class="custom-select-container" ref="containerRef">
    <button 
      type="button"
      @click.stop="isOpen = !isOpen" 
      class="status-pill-btn" 
      :class="[currentStatus.class, { 'is-active': isOpen, 'is-empty': !state }]"
      :title="state ? `Statut : ${currentStatus.label}` : 'Sélectionner un statut'"
    >
      <span v-if="state" class="status-label">{{ currentStatus.label }}</span>
    </button>

    <div v-if="isOpen" class="status-pills-popover">
      <button
        v-for="([id, data]) in STATUS_OPTIONS"
        :key="id"
        type="button"
        class="pill-option"
        :class="[data.class, { active: state === id }]"
        @click.stop="selectStatus(id)"
      >
        {{ data.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.custom-select-container { 
  position: relative; 
  display: inline-block;
}

.status-pill-btn {
  border: none;
  border-radius: 12px;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 3px 8px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  transition: transform 0.2s ease, filter 0.2s ease;
}

.status-pill-btn.is-empty {
  width: 16px;
  height: 16px;
  padding: 0;
  border-radius: 50%;
}

.status-pill-btn:hover {
  transform: scale(1.05);
}

.status-none { background-color: rgba(85, 85, 85, 0.85); }
.status-reading { background-color: rgba(33, 150, 243, 0.85); }
.status-paused { background-color: rgba(255, 152, 0, 0.85); }
.status-disinterested { background-color: rgba(229, 9, 20, 0.85); }
.status-completed { background-color: rgba(76, 175, 80, 0.85); }

.status-pills-popover {
  position: absolute;
  top: 110%;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  background-color: rgba(20, 20, 20, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  z-index: 100;
  box-shadow: 0 4px 15px rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
}

.pill-option {
  border: none;
  border-radius: 6px;
  color: #ffffff;
  padding: 4px 8px;
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
  opacity: 0.7;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.pill-option:hover,
.pill-option.active {
  opacity: 1;
  transform: translateX(-2px);
}
</style>
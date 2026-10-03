<script setup lang="ts">
import { computed } from 'vue'
import type { ProgressState } from '@/types'

const rawProgress = defineModel('progress', {
  type: Object,
  default: () => ({ bookmark: null, rate: null, state: null, id: null })
})

const progress = computed({
  get: () => rawProgress.value || { bookmark: null, rate: null, state: null, id: null },
  set: (val) => { rawProgress.value = val }
})

const props = defineProps({
  loading: { type: Boolean, default: false },
  isEditMode: { type: Boolean, default: false },
  isCreator: { type: Boolean, default: false },
  readersCount: { type: Number, default: 0 },
  publish: { type: Boolean, default: false }
})

const emit = defineEmits(['delete', 'validate', 'change'])

const STATUS_OPTIONS: { key: ProgressState; label: string; class: string }[] = [
  { key: 'reading', label: 'En cours', class: 'pill-reading' },
  { key: 'pause', label: 'En pause', class: 'pill-pause' },
  { key: 'break', label: 'Pas intéressé', class: 'pill-break' },
  { key: 'completed', label: 'Terminé', class: 'pill-completed' }
]

const toggleStatus = (stateKey: ProgressState) => {
  progress.value.state = progress.value.state === stateKey ? null : stateKey
  emit('validate')
  emit('change')
}

const currentBookmark = computed(() => {
  const bm = progress.value.bookmark
  return bm !== null && bm !== undefined && !isNaN(Number(bm)) ? Number(bm) : 0
})

const adjustBookmark = (delta: number) => {
  const updated = Math.max(0, currentBookmark.value + delta)
  progress.value.bookmark = updated
  emit('validate')
  emit('change')
}

const handleBookmarkInput = () => {
  emit('validate')
  emit('change')
}

const creatorHasProgress = computed(() => {
  const p = progress.value
  return Boolean(p.id || p.state || p.rate !== null || p.bookmark !== null)
})

const canDelete = computed(() => {
  if (props.publish || !props.isCreator || !props.isEditMode) {
    return false
  }
  const maxAllowedReaders = creatorHasProgress.value ? 2 : 1
  return props.readersCount < maxAllowedReaders
})

const currentRate = computed(() => {
  return progress.value.rate !== null && progress.value.rate !== undefined 
    ? Number(progress.value.rate) 
    : 0
})

const handleSliderInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  progress.value.rate = isNaN(value) ? null : Number(value.toFixed(1))
  emit('validate')
  emit('change')
}

const adjustRate = (delta: number) => {
  const current = currentRate.value
  const updated = Math.min(10, Math.max(0, current + delta))
  progress.value.rate = Number(updated.toFixed(1))
  emit('validate')
  emit('change')
}

const resetRate = () => {
  progress.value.rate = null
  emit('validate')
  emit('change')
}
</script>

<template>
  <div class="modal-form">
    <!-- Statut de lecture -->
    <div class="form-group">
      <div class="status-pills">
        <button
          v-for="option in STATUS_OPTIONS"
          :key="option.key"
          type="button"
          class="pill-btn"
          :class="[option.class, { active: (progress.state ?? null) === option.key }]"
          @click="toggleStatus(option.key)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- Dernier chapitre lu -->
    <div class="form-group bookmark-group">
      <div class="label-row">
        <label for="progress-bookmark" class="field-label">Ma progression</label>
      </div>
      <div class="chapter-control">
        <button 
          type="button" 
          class="stepper-btn" 
          @click="adjustBookmark(-1)" 
          :disabled="currentBookmark <= 0"
          title="-1 chapitre"
        >
          -
        </button>

        <div class="input-unit-wrapper">
          <input 
            id="progress-bookmark"
            type="number" 
            v-model.number="progress.bookmark" 
            min="0" 
            placeholder="0"
            class="app-input-field input-chapter" 
            @input="handleBookmarkInput"
          >
          <span class="unit-label">Chap.</span>
        </div>

        <button 
          type="button" 
          class="stepper-btn" 
          @click="adjustBookmark(1)" 
          title="+1 chapitre"
        >
          +
        </button>
      </div>
    </div>

    <!-- Note personnelle -->
    <div class="form-group">
      <div class="label-row">
        <label for="progress-rate" class="field-label">Ma note</label>
      </div>
      <div class="rating-control">
        <button 
          type="button" 
          class="stepper-btn" 
          @click="adjustRate(-0.1)" 
          :disabled="currentRate <= 0"
          title="-0.1"
        >
          -
        </button>

        <input 
          id="progress-rate"
          type="range" 
          min="0" 
          max="10" 
          step="0.1" 
          :value="currentRate"
          class="rating-slider"
          @input="handleSliderInput"
        >

        <button 
          type="button" 
          class="stepper-btn" 
          @click="adjustRate(0.1)" 
          :disabled="currentRate >= 10"
          title="+0.1"
        >
          +
        </button>

        <span class="rating-display">
          {{ progress.rate !== null && progress.rate !== undefined ? Number(progress.rate).toFixed(1) : '-' }}
        </span>

        <button 
          type="button" 
          class="btn-reset-rate" 
          @click="resetRate" 
          title="Réinitialiser la note"
          :disabled="progress.rate === null || progress.rate === undefined"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Supprimer Webtoon (Créateur uniquement) -->
    <div v-if="canDelete" class="modal-actions">
      <button 
        type="button" 
        class="btn btn-primary btn-delete" 
        @click="emit('delete')" 
        :disabled="loading"
      >
        Supprimer le webtoon
      </button>
    </div>
  </div>
</template>

<style scoped>
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.bookmark-group {
  margin-top: 6px;
}

.label-row {
  display: flex;
  align-items: center;
}

.field-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-muted);
}

.chapter-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-unit-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-chapter {
  width: 105px;
  padding-left: 10px;
  padding-right: 42px;
  text-align: left;
}

.unit-label {
  position: absolute;
  right: 10px;
  font-size: 0.75rem;
  color: var(--text-muted);
  pointer-events: none;
}

.btn-reset-rate {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 4px;
  height: var(--input-height);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s ease, color 0.2s ease;
}

.btn-reset-rate:hover:not(:disabled) {
  opacity: 1;
  color: var(--primary-red);
}

.btn-reset-rate:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 25px;
}

.btn-delete {
  background-color: var(--primary-red);
}
</style>
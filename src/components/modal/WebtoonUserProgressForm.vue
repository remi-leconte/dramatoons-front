<script setup>
import { computed } from 'vue'
import StatusSelect from './../StatusSelect.vue'

const rawProgress = defineModel('progress', {
  type: Object,
  default: () => ({ bookmark: null, rate: null, state: null, id: null })
})

// Securise l'accès aux propriétés si rawProgress vaut null
const progress = computed({
  get: () => rawProgress.value || { bookmark: null, rate: null, state: null, id: null },
  set: (val) => { rawProgress.value = val }
})

defineProps({
  loading: { type: Boolean, default: false },
  isEditMode: { type: Boolean, default: false },
  isCreator: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false }
})

const emit = defineEmits(['save', 'cancel', 'delete', 'validate'])
</script>

<template>
  <div class="modal-form">
    <div class="form-group">
      <label for="progress-status">Statut de lecture :</label>
      <div class="modal-select-wrapper">
        <StatusSelect id="progress-status" v-model:state="progress.state">
          <template #default="slotProps">
            <span class="text-label">{{ slotProps.label }}</span>
          </template>
        </StatusSelect>
      </div>
    </div>

    <div class="form-group">
      <label for="progress-bookmark">Dernier chapitre lu :</label>
      <input 
        id="progress-bookmark"
        type="number" 
        v-model="progress.bookmark" 
        min="0" 
        placeholder="N°"
        class="app-input-field input-small" 
        @blur="emit('validate')"
      >
    </div>

    <div class="form-group">
      <label for="progress-rate">Ma note :</label>
      <input 
        id="progress-rate"
        type="number" 
        v-model="progress.rate" 
        min="0" 
        max="10" 
        step="0.1" 
        placeholder="Note" 
        class="app-input-field input-small" 
        @blur="emit('validate')"
      >
    </div>

    <div class="modal-actions">
      <button type="button" class="btn btn-secondary" @click="emit('cancel')" :disabled="loading">
        Annuler
      </button>
      <button type="button" class="btn btn-primary" @click="emit('save')" :disabled="loading">
        {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
      </button>
      <button type="button" v-if="(isAdmin || isCreator) && isEditMode" class="btn btn-primary btn-delete" @click="emit('delete')" :disabled="loading">
        Supprimer
      </button>
    </div>
  </div>
</template>

<style scoped>
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.form-group label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.modal-select-wrapper {
  width: fit-content;
  min-width: 150px;
  height: 35px;
}
.modal-select-wrapper :deep(.status-btn) {
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 0.9rem;
}
.modal-select-wrapper :deep(.text-label) {
  margin-right: 10px;
}
.modal-select-wrapper :deep(.status-dropdown) {
  width: 100%;
  left: 0;
  right: auto;
}

.input-small {
  width: 70px;
  padding: 0 8px;
}

.modal-actions {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  margin-top: 25px;
}

.btn-delete {
  margin-left: auto;
  margin-right: 0;
}
</style>
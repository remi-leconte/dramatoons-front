<script setup lang="ts">
import type { Webtoon, WebtoonPayload, Progress, ProgressPayload } from '@/types';
import api, { COVER_BASE_URL } from '../../services/api.ts'
import { ref, computed, watch, nextTick, type PropType } from 'vue'
import { isAxiosError } from 'axios'
import { useAuthStore } from '../../stores/auth.ts'
import { createDefaultProgress } from '@/types/progress'
import { createDefaultWebtoon } from '@/types/webtoon'
import WebtoonCoverUploader from './WebtoonCoverUploader.vue'
import WebtoonUserProgressForm from './WebtoonUserProgressForm.vue'

const props = defineProps({
  webtoon: {
    type: Object as PropType<Webtoon | null>,
    default: null
  }
})
const emit = defineEmits(['close', 'saved', 'created', 'deleted'])
const authStore = useAuthStore()

const isEditMode = computed(() => !!props.webtoon)
const isCreator = computed(() => {
  if (!isEditMode.value) return true
  return authStore.userId === props.webtoon?.creator?.id
})

const localWebtoon = ref<Webtoon | null>(null)
const loading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const selectedFile = ref<File | null>(null)
const isEditingTitle = ref(false)
const titleInputRef = ref<HTMLInputElement | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const bannerUrl = computed(() => {
  if (!localWebtoon.value?.image) return null
  return `${COVER_BASE_URL}${localWebtoon.value.image}${localWebtoon.value.updated ? `?t=${new Date(localWebtoon.value.updated).getTime()}` : ''}`
})

watch(() => props.webtoon, (newWebtoon) => {
  if (newWebtoon) {
    const cloned: Webtoon = JSON.parse(JSON.stringify(newWebtoon))
    if (!cloned.userProgress) {
      cloned.userProgress = createDefaultProgress()
    }
    localWebtoon.value = cloned
  } else {
    localWebtoon.value = createDefaultWebtoon()
    isEditingTitle.value = true
  }

  errorMessage.value = ''
  selectedFile.value = null
}, { immediate: true })

const startEditingTitle = () => {
  isEditingTitle.value = true
  nextTick(() => {
    titleInputRef.value?.focus()
  })
}

const validateInputs = () => {
  if (!localWebtoon.value?.userProgress) return
  const progress = localWebtoon.value.userProgress

  if (progress.bookmark !== null && progress.bookmark !== undefined) {
    if (isNaN(progress.bookmark) || progress.bookmark < 0) progress.bookmark = 0
  }

  if (progress.rate !== null && progress.rate !== undefined) {
    if (isNaN(progress.rate)) progress.rate = null
    else progress.rate = Math.min(10, Math.max(0, progress.rate))
  }
}

const performAutoSave = async () => {
  if (!localWebtoon.value) return

  validateInputs()
  errorMessage.value = ''

  if (isCreator.value && !localWebtoon.value.title?.trim()) {
    errorMessage.value = "Le titre est obligatoire."
    return
  }

  isSaving.value = true

  try {
    if (isEditMode.value) {
      // 1. webtoon_user
      const progress = localWebtoon.value.userProgress ||= createDefaultProgress()
      const userProgressPayload: ProgressPayload = {
        state: progress.state ?? null,
        rate: progress.rate ?? null,
        bookmark: progress.bookmark ?? null
      }

      if (progress.id) {
        await api.patch(`/webtoon_users/${progress.id}`, userProgressPayload, {
          headers: { 'Content-Type': 'application/merge-patch+json' }
        })
      } else {
        const payload: ProgressPayload = {
          webtoon: `/webtoons/${localWebtoon.value.id}`,
          ...userProgressPayload
        }
        const response = await api.post('/webtoon_users', payload, {
          headers: { 'Content-Type': 'application/ld+json' }
        })
        progress.id = response.data.id
      }

      // 2. webtoon
      if (isCreator.value) {
        const webtoonPayload: WebtoonPayload = {
          title: localWebtoon.value.title,
          status: localWebtoon.value.status,
          publish: localWebtoon.value.publish
        }

        await api.patch(`/webtoons/${localWebtoon.value.id}`, webtoonPayload, {
          headers: { 'Content-Type': 'application/merge-patch+json' }
        })
      }

      const refreshedResponse = await api.get<Webtoon>(`/webtoons/${localWebtoon.value.id}`)
      emit('saved', { ...refreshedResponse.data, userProgress: localWebtoon.value.userProgress })
    } else {
      const webtoonPayload: WebtoonPayload = {
        title: localWebtoon.value.title,
        status: localWebtoon.value.status,
        publish: localWebtoon.value.publish
      }

      const { data: createdWebtoon } = await api.post<Webtoon>('/webtoons', webtoonPayload, {
        headers: { 'Content-Type': 'application/ld+json' }
      })

      if (selectedFile.value) {
        const formData = new FormData()
        formData.append('file', selectedFile.value)
        const coverResponse = await api.post(`/webtoons/${createdWebtoon.id}/cover`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        createdWebtoon.image = coverResponse.data.image || createdWebtoon.image
      }

      if (authStore.isAuthenticated && (localWebtoon.value.userProgress?.state || localWebtoon.value.userProgress?.bookmark || localWebtoon.value.userProgress?.rate)) {
        const initialProgressPayload: ProgressPayload = {
          webtoon: `/webtoons/${createdWebtoon.id}`,
          state: localWebtoon.value.userProgress.state ?? null,
          rate: localWebtoon.value.userProgress.rate ?? null,
          bookmark: localWebtoon.value.userProgress.bookmark ?? null
        }

        const progressResponse = await api.post<Progress>('/webtoon_users', initialProgressPayload, {
          headers: { 'Content-Type': 'application/ld+json' }
        })
        createdWebtoon.userProgress = progressResponse.data
      }

      emit('created', createdWebtoon)
    }
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(error)
      errorMessage.value = error.response ? "Une erreur est survenue lors de la sauvegarde." : "Impossible de joindre le serveur."
    }
  } finally {
    isSaving.value = false
  }
}

const onFieldChanged = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    performAutoSave()
  }, 500)
}

const handleCoverSelected = async (file: File) => {
  selectedFile.value = file
  if (isEditMode.value && localWebtoon.value?.id) {
    isSaving.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)
      const coverResponse = await api.post(`/webtoons/${localWebtoon.value.id}/cover`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      localWebtoon.value.image = coverResponse.data.image || localWebtoon.value.image
      localWebtoon.value.updated = new Date().toISOString()
      emit('saved', localWebtoon.value)
    } catch (e) {
      console.error(e)
      errorMessage.value = "Erreur lors de l'envoi de l'image."
    } finally {
      isSaving.value = false
    }
  }
}

const deleteWebtoon = async () => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce webtoon ? Cette action est irréversible.')) return

  errorMessage.value = ''
  loading.value = true

  try {
    await api.delete(`/webtoons/${localWebtoon.value?.id}`)
    emit('deleted', localWebtoon.value?.id)
    emit('close')
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(error)
      errorMessage.value = error.response ? "Une erreur est survenue." : "Impossible de joindre le serveur."
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-overlay" @click="emit('close')">
    <div class="modal-container modal-has-banner" @click.stop>
      <div v-if="bannerUrl" class="modal-banner">
        <img :src="bannerUrl" alt="" />
        <div class="banner-gradient"></div>
      </div>

      <span v-if="isSaving" class="saving-indicator">Sauvegarde...</span>
      <button class="modal-close" @click="emit('close')">&times;</button>
      
      <div v-if="localWebtoon" class="modal-content">
        <WebtoonCoverUploader 
          :image-path="localWebtoon.updated ? `${localWebtoon.image}?t=${new Date(localWebtoon.updated).getTime()}`: localWebtoon.image"
          :title="localWebtoon.title"
          :is-editable="isCreator"
          @file-selected="handleCoverSelected"
        />

        <div class="modal-right-info">
          <div v-if="errorMessage" class="error-alert">{{ errorMessage }}</div>

          <div class="title-container">
            <div v-if="isEditingTitle || !isEditMode" class="modal-form form-group">
              <div class="field-with-check">
                <input 
                  ref="titleInputRef"
                  id="webtoon-title" 
                  type="text" 
                  v-model="localWebtoon.title"
                  placeholder="Titre du webtoon"
                  class="app-input-field input-title-full"
                  @input="onFieldChanged"
                  @keyup.enter="isEditingTitle = false"
                >
                <button 
                  v-if="isEditMode"
                  type="button" 
                  class="btn-confirm-title" 
                  title="Valider le titre"
                  @click="isEditingTitle = false"
                >
                  ✓
                </button>
              </div>
            </div>
            <div v-else class="title-display">
              <h2>{{ localWebtoon.title }}</h2>
              <button 
                v-if="isCreator" 
                type="button" 
                class="btn-edit-title" 
                title="Modifier le titre"
                @click="startEditingTitle"
              >
                Modifier
              </button>
            </div>
          </div>

          <div v-if="isCreator" class="toggles-section">
            <div class="toggle-row">
              <span class="toggle-label">
                <span class="status-indicator" :class="{ 'is-completed': localWebtoon.status === 'completed' }"></span>
                Série terminée
              </span>
              <label class="switch">
                <input 
                  type="checkbox" 
                  :checked="localWebtoon?.status === 'completed'"
                  @change="() => {
                    if (localWebtoon) {
                      localWebtoon.status = (localWebtoon.status === 'completed' ? 'ongoing' : 'completed');
                      onFieldChanged();
                    }
                  }"
                >
                <span class="slider round"></span>
              </label>
            </div>

            <div v-if="authStore.isAdmin" class="toggle-row">
              <span class="toggle-label">Publier au catalogue</span>
              <label class="switch">
                <input 
                  type="checkbox" 
                  v-model="localWebtoon.publish"
                  @change="onFieldChanged"
                >
                <span class="slider round"></span>
              </label>
            </div>
          </div>
          
          <div v-if="isEditMode" class="modal-stats">
            <span>⭐ Note Globale : {{ localWebtoon.averageRating || '-' }}</span>
            <span>👤 Lecteurs : {{ localWebtoon.readersCount || 0 }}</span>
          </div>

          <hr class="modal-separator">

          <WebtoonUserProgressForm
            v-if="authStore.isAuthenticated"
            v-model:progress="localWebtoon.userProgress"
            :loading="loading"
            :is-edit-mode="isEditMode"
            :is-creator="isCreator"
            :readers-count="localWebtoon.readersCount ?? 0"
            :publish="localWebtoon.publish"
            @change="onFieldChanged"
            @delete="deleteWebtoon"
            @validate="validateInputs"
          />
          <div v-else class="modal-auth-notice">
            Connectez-vous pour renseigner votre progression sur ce webtoon.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-has-banner {
  overflow: hidden;
  padding-top: 0;
}

.modal-banner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 160px;
  overflow: hidden;
  z-index: 0;
}

.modal-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(20px) brightness(0.6);
  transform: scale(1.2);
}

.banner-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(24, 24, 24, 0.2) 0%, var(--bg-dark) 100%);
}

.saving-indicator {
  position: absolute;
  top: 12px;
  left: 15px;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-style: italic;
  z-index: 10;
  background: rgba(0, 0, 0, 0.4);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.modal-close { 
  position: absolute; 
  top: 8px; 
  right: 12px; 
  background: rgba(0, 0, 0, 0.4); 
  border: none; 
  color: #fff; 
  font-size: 1.8rem; 
  cursor: pointer; 
  z-index: 10; 
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.modal-content { 
  position: relative; 
  z-index: 1; 
  display: flex; 
  flex-direction: column; 
  gap: 20px; 
  margin-top: 50px; 
}

.modal-right-info { flex: 1; }
.modal-right-info h2 { margin: 0 0 8px 0; font-size: 1.4rem; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8); }
.modal-stats { display: flex; flex-wrap: wrap; gap: 15px; font-size: 0.85rem; color: #ddd; margin-top: 10px; }
.modal-separator { border: 0; border-top: 1px solid var(--border-color); margin: 15px 0; }

.form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }

.field-with-check {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.input-title-full { flex: 1; padding: 0 12px; }

.btn-confirm-title {
  background: transparent;
  border: none;
  color: #4CAF50;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  padding: 0 6px;
}

/* Conteneur des Toggles */
.toggles-section {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  background-color: rgba(255, 255, 255, 0.03);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-input);
  margin-bottom: 15px;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-label {
  font-size: 0.85rem;
  color: #ddd;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--status-reading);
  display: inline-block;
}

.status-indicator.is-completed {
  background-color: #4CAF50;
}

/* Interrupteur On/Off (Switch) */
.switch {
  position: relative;
  display: inline-block;
  width: 38px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #555555;
  transition: .3s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
}

input:checked + .slider {
  background-color: #4CAF50;
}

input:focus + .slider {
  box-shadow: 0 0 1px #4CAF50;
}

input:checked + .slider:before {
  transform: translateX(18px);
}

.slider.round {
  border-radius: 20px;
}

.slider.round:before {
  border-radius: 50%;
}

.title-container {
  margin-bottom: 15px;
}

.title-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-display h2 {
  margin: 0;
}

.btn-edit-title {
  background: transparent;
  border: 1px solid var(--border-input);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.75rem;
  padding: 3px 8px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.btn-edit-title:hover {
  color: var(--text-main);
  background-color: var(--bg-card);
}

@media (min-width: 576px) {
  .modal-content { flex-direction: row; align-items: flex-start; gap: 30px; }
}
</style>
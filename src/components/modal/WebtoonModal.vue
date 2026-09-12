<script setup>
import { ref, computed, watch } from 'vue'
import api from '../../services/api.ts'
import { useAuthStore } from '../../stores/auth.ts'

import WebtoonCoverUploader from './WebtoonCoverUploader.vue'
import WebtoonUserProgressForm from './WebtoonUserProgressForm.vue'

const props = defineProps({
  webtoon: { type: Object, default: null }
})
const emit = defineEmits(['close', 'saved', 'created', 'deleted'])
const authStore = useAuthStore()

const isEditMode = computed(() => !!props.webtoon)
const isCreator = computed(() => {
  if (!isEditMode.value) return true
  return authStore.userId === props.webtoon?.creator?.id
})

const localWebtoon = ref(null)
const loading = ref(false)
const errorMessage = ref('')
const selectedFile = ref(null)
const isEditingTitle = ref(false)

watch(() => props.webtoon, (newWebtoon) => {
  if (newWebtoon) {
    localWebtoon.value = JSON.parse(JSON.stringify(newWebtoon))
    if (!localWebtoon.value.userProgress) {
      localWebtoon.value.userProgress = { bookmark: null, rate: null, state: null, id: null }
    }
  } else {
    localWebtoon.value = {
      id: null,
      title: '',
      status: 'ongoing',
      chapter: 0,
      image: '',
      userProgress: { bookmark: null, rate: null, state: null, id: null }
    }
  }

  errorMessage.value = ''
  selectedFile.value = null
  isEditingTitle.value = !newWebtoon
}, { immediate: true })

const validateInputs = () => {
  if (!localWebtoon.value?.userProgress) return
  const progress = localWebtoon.value.userProgress

  if (progress.bookmark !== null && progress.bookmark !== '') {
    if (progress.bookmark < 0) progress.bookmark = 0
  }

  if (progress.rate !== null && progress.rate !== '') {
    if (progress.rate > 10) progress.rate = 10
    if (progress.rate < 0) progress.rate = 0
  }
}

const saveModalData = async () => {
  validateInputs()
  errorMessage.value = ''

  if (isCreator.value && !localWebtoon.value.title?.trim()) {
    errorMessage.value = "Le titre est obligatoire."
    return
  }

  loading.value = true

  try {
    if (isEditMode.value) {
      const userProgressPayload = {
        state: localWebtoon.value.userProgress.state,
        rate: localWebtoon.value.userProgress.rate ? parseFloat(localWebtoon.value.userProgress.rate) : null,
        bookmark: localWebtoon.value.userProgress.bookmark ? parseInt(localWebtoon.value.userProgress.bookmark) : null
      }

      if (localWebtoon.value.userProgress.id) {
        await api.patch(`/webtoon_users/${localWebtoon.value.userProgress.id}`, userProgressPayload, {
          headers: { 'Content-Type': 'application/merge-patch+json' }
        })
      } else {
        const response = await api.post('/webtoon_users', {
          webtoon: `/webtoons/${localWebtoon.value.id}`,
          ...userProgressPayload
        }, {
          headers: { 'Content-Type': 'application/ld+json' }
        })
        localWebtoon.value.userProgress.id = response.data.id
      }

      if (authStore.isAdmin || isCreator.value) {
        if (selectedFile.value) {
          const formData = new FormData()
          formData.append('file', selectedFile.value)
          await api.post(`/webtoons/${localWebtoon.value.id}/cover`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        }

        await api.patch(`/webtoons/${localWebtoon.value.id}`, {
          title: localWebtoon.value.title,
          status: localWebtoon.value.status
        }, {
          headers: { 'Content-Type': 'application/merge-patch+json' }
        })
      }

      const refreshedResponse = await api.get(`/webtoons/${localWebtoon.value.id}`)
      emit('saved', { ...refreshedResponse.data, userProgress: localWebtoon.value.userProgress })
    } else {
      const response = await api.post('/webtoons', {
        title: localWebtoon.value.title,
        status: localWebtoon.value.status
      }, {
        headers: { 'Content-Type': 'application/ld+json' }
      })

      const createdWebtoon = response.data

      if (selectedFile.value) {
        const formData = new FormData()
        formData.append('file', selectedFile.value)
        const coverResponse = await api.post(`/webtoons/${createdWebtoon.id}/cover`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        createdWebtoon.image = coverResponse.data.image || createdWebtoon.image
      }

      if (authStore.isAuthenticated && (localWebtoon.value.userProgress.state || localWebtoon.value.userProgress.bookmark || localWebtoon.value.userProgress.rate)) {
        const progressResponse = await api.post('/webtoon_users', {
          webtoon: `/webtoons/${createdWebtoon.id}`,
          state: localWebtoon.value.userProgress.state,
          rate: localWebtoon.value.userProgress.rate ? parseFloat(localWebtoon.value.userProgress.rate) : null,
          bookmark: localWebtoon.value.userProgress.bookmark ? parseInt(localWebtoon.value.userProgress.bookmark) : null
        }, {
          headers: { 'Content-Type': 'application/ld+json' }
        })
        createdWebtoon.userProgress = progressResponse.data
      }

      emit('created', createdWebtoon)
      emit('close')
    }
  } catch (error) {
    console.error(error)
    errorMessage.value = error.response ? "Une erreur est survenue." : "Impossible de joindre le serveur."
  } finally {
    loading.value = false
  }
}

const deleteWebtoon = async () => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce webtoon ? Cette action est irréversible.')) return

  errorMessage.value = ''
  loading.value = true

  try {
    await api.delete(`/webtoons/${localWebtoon.value.id}`)
    emit('deleted', localWebtoon.value.id)
    emit('close')
  } catch (error) {
    console.error(error)
    errorMessage.value = error.response ? "Une erreur est survenue." : "Impossible de joindre le serveur."
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-overlay" @click="emit('close')">
    <div class="modal-container" @click.stop>
      <button class="modal-close" @click="emit('close')">&times;</button>
      
      <div v-if="localWebtoon" class="modal-content">
        <WebtoonCoverUploader 
          :image-path="localWebtoon.updated ? `${localWebtoon.image}?t=${new Date(localWebtoon.updated).getTime()}`: localWebtoon.image"
          :title="localWebtoon.title"
          :is-editable="authStore.isAdmin || isCreator"
          @file-selected="(file) => selectedFile = file"
        />

        <div class="modal-right-info">
          <div v-if="errorMessage" class="error-alert">{{ errorMessage }}</div>

            <div class="title-container">
              <div v-if="(isEditingTitle || !isEditMode) && authStore.isAdmin" class="modal-form form-group">
                <input 
                  id="webtoon-title" 
                  type="text" 
                  v-model="localWebtoon.title"
                  placeholder="Titre du webtoon"
                  class="app-input-field input-title-full"
                  @keyup.enter="isEditingTitle = false"
                >
              </div>
              <div v-else class="title-display">
                <h2>{{ localWebtoon.title }}</h2>
                <button 
                  v-if="authStore.isAdmin" 
                  type="button" 
                  class="btn-edit-title" 
                  title="Modifier le titre"
                  @click="isEditingTitle = true"
                >
                  ✏️
                </button>
              </div>
            </div>

          <div v-if="authStore.isAdmin" class="completed-toggle-wrapper">
            <button 
              type="button"
              class="btn-toggle-completed"
              :class="{ active: localWebtoon.status === 'completed' }"
              @click="localWebtoon.status = localWebtoon.status === 'completed' ? 'ongoing' : 'completed'"
            >
              Terminé
            </button>
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
            :is-admin="authStore.isAdmin"
            @save="saveModalData"
            @cancel="emit('close')"
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
.modal-close { position: absolute; top: 5px; right: 12px; background: none; border: none; color: #aaa; font-size: 1.8rem; cursor: pointer; z-index: 10; }
.modal-content { display: flex; flex-direction: column; gap: 20px; margin-top: 10px; }

.modal-right-info { flex: 1; }
.modal-right-info h2 { margin: 0 0 8px 0; font-size: 1.4rem; }
.modal-stats { display: flex; flex-wrap: wrap; gap: 15px; font-size: 0.85rem; color: #ddd; margin-top: 10px; }
.modal-separator { border: 0; border-top: 1px solid var(--border-color); margin: 15px 0; }

.form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }

.input-title-full { width: 100%; padding: 0 12px; }

.completed-toggle-wrapper { margin-bottom: 12px; }
.btn-toggle-completed {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid #444;
  background-color: #333333;
  color: #aaaaaa;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.btn-toggle-completed.active {
  background-color: #4CAF50;
  color: var(--text-main);
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
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 2px 4px;
  opacity: 0.7;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.btn-edit-title:hover {
  opacity: 1;
  transform: scale(1.15);
}

@media (min-width: 576px) {
  .modal-content { flex-direction: row; align-items: flex-start; gap: 30px; }
}
</style>
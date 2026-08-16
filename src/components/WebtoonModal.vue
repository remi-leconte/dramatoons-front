<script setup>
import { ref, watch } from 'vue'
import api, { COVER_BASE_URL } from '../services/api'
import { useAuthStore } from '../stores/auth'
import StatusSelect from './StatusSelect.vue'

const props = defineProps({
  webtoon: {
    type: Object,
    required: true
  }
})
const emit = defineEmits(['close', 'saved', 'deleted'])

const authStore = useAuthStore()
const localWebtoon = ref(null)
const loading = ref(false)
const errorMessage = ref('')

const fileInputRef = ref(null)
const selectedFile = ref(null)
const previewImage = ref(null)

// watch est utilisé au lieu de computed pour faire une copie éditable (formulaire)
watch(() => props.webtoon, (newWebtoon) => {
  if (newWebtoon) {
    localWebtoon.value = JSON.parse(JSON.stringify(newWebtoon))
    if (!localWebtoon.value.userProgress) {
      localWebtoon.value.userProgress = { bookmark: null, rate: null, state: null, id: null }
    }
    errorMessage.value = ''
    selectedFile.value = null
    previewImage.value = null
  }
}, { immediate: true })

const handleImageClick = () => {
  if (authStore.isAdmin && fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    previewImage.value = URL.createObjectURL(file)
  }
}

const validateInputs = () => {
  if (!localWebtoon.value?.userProgress) return

  const progress = localWebtoon.value.userProgress
  const maxChapters = localWebtoon.value.chapter || 0

  if (progress.bookmark !== null && progress.bookmark !== '') {
    if (progress.bookmark > maxChapters) progress.bookmark = maxChapters
    if (progress.bookmark < 0) progress.bookmark = 0
  }

  if (progress.rate !== null && progress.rate !== '') {
    if (progress.rate > 10) progress.rate = 10
    if (progress.rate < 0) progress.rate = 0
  }

  if (authStore.isAdmin) {
    if (localWebtoon.value.chapter !== null && localWebtoon.value.chapter !== '') {
      if (localWebtoon.value.chapter < 0) localWebtoon.value.chapter = 0
    }
  }
}

const saveModalData = async () => {
  validateInputs()
  errorMessage.value = ''
  loading.value = true

  try {
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

    if (authStore.isAdmin) {
      if (selectedFile.value) {
        const formData = new FormData()
        formData.append('file', selectedFile.value)
        await api.post(`/webtoons/${localWebtoon.value.id}/cover`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      const webtoonDetailsPayload = {
        title: localWebtoon.value.title,
        chapter: localWebtoon.value.chapter ? parseInt(localWebtoon.value.chapter) : null,
        status: localWebtoon.value.status
      }

      await api.patch(`/webtoons/${localWebtoon.value.id}`, webtoonDetailsPayload, {
        headers: { 'Content-Type': 'application/merge-patch+json' }
      })
    }

    // Récupération des données du Webtoon depuis le serveur (avec averageRating et readersCount calculés)
    const refreshedResponse = await api.get(`/webtoons/${localWebtoon.value.id}`)
    
    const updatedWebtoonData = {
      ...refreshedResponse.data,
      userProgress: localWebtoon.value.userProgress
    }

    // 4. Émission des données mises à jour
    emit('saved', updatedWebtoonData)
  } catch (error) {
    console.error(error)
    if (error.response) {
      errorMessage.value = "Une erreur est survenue."
    } else {
      errorMessage.value = "Impossible de joindre le serveur."
    }
  } finally {
    loading.value = false
  }
}

const deleteWebtoon = async () => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce webtoon ? Cette action est irréversible.')) {
    return;
  }

  errorMessage.value = '';
  loading.value = true;

  try {
    await api.delete(`/webtoons/${localWebtoon.value.id}`);
    emit('deleted', localWebtoon.value.id);
    emit('close');
  } catch (error) {
    console.error(error);
    if (error.response) {
      errorMessage.value = "Une erreur est survenue."
    } else {
      errorMessage.value = "Impossible de joindre le serveur."
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="modal-overlay" @click="emit('close')">
    <div class="modal-container" @click.stop>
      <button class="modal-close" @click="emit('close')">&times;</button>
      
      <div v-if="localWebtoon" class="modal-content">
        <div class="modal-left">
          <div 
            class="image-container" 
            :class="{ 'is-admin-clickable': authStore.isAdmin }"
            @click="handleImageClick"
          >
            <img
              :src="previewImage || `${COVER_BASE_URL}${localWebtoon.image}`"
              :alt="localWebtoon.title"
              @error="(e) => e.target.src = `${COVER_BASE_URL}defaut.jpg`"
            >
            <div v-if="authStore.isAdmin" class="image-overlay">
              <span>Changer l'image</span>
            </div>
          </div>

          <input 
            v-if="authStore.isAdmin"
            ref="fileInputRef"
            type="file" 
            accept="image/*" 
            style="display: none;" 
            @change="handleFileChange"
          >
        </div>

        <div class="modal-right-info">
          <div v-if="errorMessage" class="error-alert">
            {{ errorMessage }}
          </div>

          <div v-if="authStore.isAdmin" class="modal-form form-group">
            <input 
              id="webtoon-title" 
              type="text" 
              v-model="localWebtoon.title"
              class="input-box"
            >
          </div>

          <h2 v-else>{{ localWebtoon.title }}</h2>

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
          <!--<p class="modal-genres">Genres : Action, Fantasy</p>-->
          
          <div class="modal-stats">
            <span>⭐ Note Globale : {{ localWebtoon.averageRating || '-' }}</span>
            <span>👤 Lecteurs : {{ localWebtoon.readersCount || 0 }}</span>
          </div>

          <hr class="modal-separator">

          <div v-if="authStore.isAuthenticated" class="modal-form">
            <div class="form-group">
              <label>Statut de lecture :</label>
              <div class="modal-select-wrapper">
                <StatusSelect v-model:state="localWebtoon.userProgress.state">
                  <template #default="slotProps">
                    <span class="text-label">{{ slotProps.label }}</span>
                  </template>
                </StatusSelect>
              </div>
            </div>

            <div class="form-group">
              <label>Chapitres lus :</label>
              <div class="input-inline input-box input-box-chapter">
                <input 
                  type="number" 
                  v-model="localWebtoon.userProgress.bookmark" 
                  min="0" 
                  :max="localWebtoon.chapter"
                  @blur="validateInputs"
                >
                <span v-if="authStore.isAdmin">/ <input 
                  id="webtoon-chapter" 
                  type="number" 
                  v-model="localWebtoon.chapter" 
                  min="0"
                ></span>

                <span v-else>/ {{ localWebtoon.chapter }}</span>
              </div>
            </div>

            <div class="form-group">
              <label>Ma Note :</label>
              <input 
                type="number" 
                v-model="localWebtoon.userProgress.rate" 
                min="0" 
                max="10" 
                step="0.1" 
                placeholder="Note" 
                class="small-number-input" 
                @blur="validateInputs"
              >
            </div>

            <div class="modal-actions">
              <button class="btn-cancel" @click="emit('close')" :disabled="loading">
                Annuler
              </button>
              <button class="btn-save" @click="saveModalData" :disabled="loading">
                {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
              <button v-if="authStore.isAdmin" class="btn-delete" @click="deleteWebtoon" :disabled="loading">
                Supprimer
              </button>
            </div>
          </div>
          <div v-else class="modal-auth-notice">
            Connectez-vous pour modifier votre progression sur ce webtoon.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, -0.15); display: flex; justify-content: center; align-items: center; z-index: 9999; padding: 15px; }
.modal-container { background: #181818; border: 1px solid #282828; border-radius: 8px; width: 100%; max-width: 650px; max-height: 90vh; padding: 25px; position: relative; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8); color: #ffffff; overflow-y: auto; }
.modal-close { position: absolute; top: 5px; right: 12px; background: none; border: none; color: #aaa; font-size: 1.8rem; cursor: pointer; z-index: 10; }
.modal-content { display: flex; flex-direction: column; gap: 20px; margin-top: 10px; }
.modal-left { align-self: center; width: 140px; }

/* Image upload styles */
.image-container { position: relative; width: 100%; aspect-ratio: 2 / 3; border-radius: 6px; overflow: hidden; }
.image-container img { width: 100%; height: 100%; object-fit: cover; display: block; }
.image-container.is-admin-clickable { cursor: pointer; }
.image-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.2s ease;
  text-align: center;
  padding: 5px;
}
.image-container.is-admin-clickable:hover .image-overlay { opacity: 1; }

.modal-right-info { flex: 1; }
.modal-right-info h2 { margin: 0 0 8px 0; font-size: 1.4rem; }
.modal-genres { font-size: 0.85rem; color: #aaa; margin: 0 0 10px 0; }
.modal-stats { display: flex; flex-wrap: wrap; gap: 15px; font-size: 0.85rem; color: #ddd; }
.modal-separator { border: 0; border-top: 1px solid #282828; margin: 15px 0; }

.form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
.form-group label { font-size: 0.85rem; color: #bbb; } 

.error-alert {
  background-color: rgba(229, 9, 20, 0.1);
  border: 1px solid #e50914;
  color: #e50914;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 0.9rem;
}

.modal-form input { border: 1px solid #383838; color: #fff; padding: 8px 12px; border-radius: 4px; font-size: 0.9rem; outline: none; }
.modal-form input:focus { border-color: #e50914; }

.modal-form input[type="number"]::-webkit-outer-spin-button,
.modal-form input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.modal-form input[type="number"] { -moz-appearance: textfield; }

.modal-select-wrapper { width: fit-content; min-width: 150px; height: 35px; }
.modal-select-wrapper :deep(.status-btn) { justify-content: space-between; padding: 8px 12px; font-size: 0.9rem; }
.modal-select-wrapper :deep(.text-label) { margin-right: 10px; }
.modal-select-wrapper :deep(.status-dropdown) { width: 100%; left: 0; right: auto; }

.input-box { display: flex; align-items: center; background: #252525; border: 1px solid #383838; border-radius: 4px; padding-right: 12px; }
.input-box-chapter { width: fit-content; }
.input-box input { width: 35px; border: none !important; background: transparent !important; text-align: left; padding-right: 2px; padding-left: 12px; }
.input-box span { font-size: 0.85rem; color: #888; white-space: nowrap; }
.input-box:focus-within { border-color: #e50914; }

.small-number-input { background: #252525; width: 27px !important; text-align: left; padding-left: 8px !important; padding-right: 2px !important; }

.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; }
.btn-cancel, .btn-save, .btn-delete { padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 0.85rem; border: none; font-weight: bold; }
.btn-cancel { background: #333; color: #fff; }
.btn-save { background: #e50914; color: #fff; }
.btn-delete { background: #e50914; color: #fff; margin-left: auto; }

.completed-toggle-wrapper {
  margin-bottom: 12px;
}

.btn-toggle-completed {
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #444;
  background-color: #333333;
  color: #aaaaaa;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.btn-toggle-completed.active {
  background-color: #4CAF50;
  color: #ffffff;
}

@media (min-width: 576px) {
  .modal-content { flex-direction: row; align-items: flex-start; gap: 30px; }
  .modal-left { flex: 0 0 180px; }
}
</style>
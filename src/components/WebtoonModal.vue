<script setup>
import { ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'
import StatusSelect from './StatusSelect.vue'

// 1. Reçoit le webtoon cliqué depuis le parent
const props = defineProps({
  webtoon: {
    type: Object,
    required: true
  }
})

// 2. Événements renvoyés au parent (fermeture et succès de sauvegarde)
const emit = defineEmits(['close', 'saved'])

const authStore = useAuthStore()

// Copie locale et isolée pour le formulaire (évite de modifier la grille en direct)
const localWebtoon = ref(null)

// À chaque fois que la prop "webtoon" change, on recrée une copie propre
watch(() => props.webtoon, (newWebtoon) => {
  if (newWebtoon) {
    localWebtoon.value = JSON.parse(JSON.stringify(newWebtoon))
    if (!localWebtoon.value.userProgress) {
      localWebtoon.value.userProgress = { bookmark: null, rate: null, state: null, id: null }
    }
  }
}, { immediate: true })

// Vérifie et corrige les saisies numériques (chapitres et note)
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
}

// Valide et envoie l'ensemble des données à l'API
const saveModalData = async () => {
  validateInputs()

  try {
    const payload = {
      state: localWebtoon.value.userProgress.state,
      rate: localWebtoon.value.userProgress.rate ? parseFloat(localWebtoon.value.userProgress.rate) : null,
      bookmark: localWebtoon.value.userProgress.bookmark ? parseInt(localWebtoon.value.userProgress.bookmark) : null
    }

    if (localWebtoon.value.userProgress.id) {
      await api.patch(`/webtoon_users/${localWebtoon.value.userProgress.id}`, payload, {
        headers: { 'Content-Type': 'application/merge-patch+json' }
      })
    } else {
      const response = await api.post('/webtoon_users', {
        webtoon: `/webtoons/${localWebtoon.value.id}`,
        ...payload
      }, {
        headers: { 'Content-Type': 'application/ld+json' }
      })
      localWebtoon.value.userProgress.id = response.data.id
    }

    // Informe le parent du succès en lui transmettant les données mises à jour
    emit('saved', localWebtoon.value.userProgress)
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des informations :", error)
  }
}
</script>

<template>
  <div class="modal-overlay" @click="emit('close')">
    <div class="modal-container" @click.stop>
      <button class="modal-close" @click="emit('close')">&times;</button>
      
      <div v-if="localWebtoon" class="modal-content">
        <div class="modal-left">
          <img 
            :src="`http://dramatoons.api.local:8081/upload/cover/${localWebtoon.image}`" 
            :alt="localWebtoon.title"
            @error="(e) => e.target.src = 'http://dramatoons.api.local:8081/upload/cover/defaut.jpg'"
          >
        </div>

        <div class="modal-right-info">
          <h2>{{ localWebtoon.title }}</h2>
          <p class="modal-genres">Genres : Action, Fantasy</p>
          
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
              <div class="input-inline chapter-input-box">
                <input 
                  type="number" 
                  v-model="localWebtoon.userProgress.bookmark" 
                  min="0" 
                  :max="localWebtoon.chapter"
                  @input="validateInputs"
                >
                <span>/ {{ localWebtoon.chapter }}</span>
              </div>
            </div>

            <div class="form-group">
              <label>Ma Note (Perso) :</label>
              <input 
                type="number" 
                v-model="localWebtoon.userProgress.rate" 
                min="0" 
                max="10" 
                step="0.1" 
                placeholder="Note" 
                class="small-number-input"
                @input="validateInputs"
              >
            </div>

            <div class="modal-actions">
              <button class="btn-cancel" @click="emit('close')">Annuler</button>
              <button class="btn-save" @click="saveModalData">Enregistrer</button>
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
/* --- DESIGN DE LA POPUP MODAL (Isolé grâce à scoped) --- */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.85); display: flex; justify-content: center; align-items: center; z-index: 9999; padding: 15px; }
.modal-container { background: #181818; border: 1px solid #282828; border-radius: 8px; width: 100%; max-width: 650px; max-height: 90vh; padding: 25px; position: relative; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8); color: #ffffff; overflow-y: auto; }
.modal-close { position: absolute; top: 5px; right: 12px; background: none; border: none; color: #aaa; font-size: 1.8rem; cursor: pointer; z-index: 10; }
.modal-content { display: flex; flex-direction: column; gap: 20px; margin-top: 10px; }
.modal-left { align-self: center; width: 140px; }
.modal-left img { width: 100%; aspect-ratio: 2 / 3; object-fit: cover; border-radius: 6px; }
.modal-right-info { flex: 1; }
.modal-right-info h2 { margin: 0 0 8px 0; font-size: 1.4rem; }
.modal-genres { font-size: 0.85rem; color: #aaa; margin: 0 0 10px 0; }
.modal-stats { display: flex; flex-wrap: wrap; gap: 15px; font-size: 0.85rem; color: #ddd; }
.modal-separator { border: 0; border-top: 1px solid #282828; margin: 15px 0; }

.form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
.form-group label { font-size: 0.85rem; color: #bbb; }

.modal-form input[type="number"] { border: 1px solid #383838; color: #fff; padding: 8px 12px; border-radius: 4px; font-size: 0.9rem; outline: none; }
.modal-form input:focus { border-color: #e50914; }

.modal-form input[type="number"]::-webkit-outer-spin-button,
.modal-form input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.modal-form input[type="number"] { -moz-appearance: textfield; }

.modal-select-wrapper { width: fit-content; min-width: 150px; height: 35px; }
.modal-select-wrapper :deep(.status-btn) { justify-content: space-between; padding: 8px 12px; font-size: 0.9rem; }
.modal-select-wrapper :deep(.text-label) { margin-right: 10px; }
.modal-select-wrapper :deep(.status-dropdown) { width: 100%; left: 0; right: auto; }

.chapter-input-box { width: fit-content; display: flex; align-items: center; background: #252525; border: 1px solid #383838; border-radius: 4px; padding-right: 12px; }
.chapter-input-box input { width: 35px; border: none !important; background: transparent !important; text-align: left; padding-right: 2px; padding-left: 12px; }
.chapter-input-box span { font-size: 0.85rem; color: #888; white-space: nowrap; }

.small-number-input { background: #252525; width: 27px !important; text-align: left; padding-left: 8px !important; padding-right: 2px !important; }

.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; }
.btn-cancel, .btn-save { padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 0.85rem; border: none; font-weight: bold; }
.btn-cancel { background: #333; color: #fff; }
.btn-save { background: #e50914; color: #fff; }

@media (min-width: 576px) {
  .modal-content { flex-direction: row; align-items: flex-start; gap: 30px; }
  .modal-left { flex: 0 0 180px; }
}
</style>
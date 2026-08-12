<script setup>
import { ref } from 'vue'
import api from '../services/api'

const emit = defineEmits(['close', 'created'])

const title = ref('')
const chapter = ref(0)
const loading = ref(false)
const errorMessage = ref('')

const validateInputs = () => {
  if (chapter.value < 0) chapter.value = 0
}

const createWebtoon = async () => {
  if (!title.value.trim()) {
    errorMessage.value = "Le titre est obligatoire."
    return
  }

  errorMessage.value = ''
  loading.value = true

  try {
    const response = await api.post('/webtoons', {
      title: title.value,
      chapter: chapter.value ? parseInt(chapter.value) : 0
    }, {
      headers: { 'Content-Type': 'application/ld+json' }
    })

    emit('created', response.data)
    emit('close')
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
</script>

<template>
  <div class="modal-overlay" @click="emit('close')">
    <div class="modal-container" @click.stop>
      <button class="modal-close" @click="emit('close')">&times;</button>
      
      <div class="modal-content">
        <div class="modal-right-info">
          <h2>Créer un nouveau Webtoon</h2>
          
          <div v-if="errorMessage" class="error-alert">
            {{ errorMessage }}
          </div>

          <div class="modal-form">
            <div class="form-group">
              <label for="webtoon-title">Titre du Webtoon :</label>
              <input 
                id="webtoon-title" 
                type="text" 
                v-model="title"
                placeholder="Ex: Solo Leveling"
                class="input-box-full"
                :disabled="loading"
              >
            </div>

            <div class="form-group">
              <label for="webtoon-chapter">Nombre total de chapitres :</label>
              <div class="input-box input-box-chapter">
                <input 
                  id="webtoon-chapter" 
                  type="number" 
                  v-model="chapter" 
                  min="0"
                  @blur="validateInputs"
                  :disabled="loading"
                >
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn-cancel" @click="emit('close')" :disabled="loading">
                Annuler
              </button>
              <button class="btn-save" @click="createWebtoon" :disabled="loading">
                {{ loading ? 'Création...' : 'Créer' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 9999; padding: 15px; }
.modal-container { background: #181818; border: 1px solid #282828; border-radius: 8px; width: 100%; max-width: 500px; padding: 25px; position: relative; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8); color: #ffffff; }
.modal-close { position: absolute; top: 5px; right: 12px; background: none; border: none; color: #aaa; font-size: 1.8rem; cursor: pointer; z-index: 10; }
.modal-content { display: flex; flex-direction: column; gap: 20px; }
.modal-right-info { flex: 1; }
.modal-right-info h2 { margin: 0 0 20px 0; font-size: 1.4rem; border-left: 4px solid #e50914; padding-left: 10px; }

.form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
.form-group label { font-size: 0.85rem; color: #bbb; } 

.error-alert { background-color: rgba(229, 9, 20, 0.1); border: 1px solid #e50914; color: #e50914; padding: 10px; border-radius: 4px; margin-bottom: 15px; font-size: 0.9rem; }

.modal-form input { border: 1px solid #383838; color: #fff; padding: 8px 12px; border-radius: 4px; font-size: 0.9rem; outline: none; }
.modal-form input:focus { border-color: #e50914; }
.input-box-full { background: #252525; width: 100%; }

.input-box { display: flex; align-items: center; background: #252525; border: 1px solid #383838; border-radius: 4px; }
.input-box-chapter { width: 100px; }
.input-box input { width: 100%; border: none !important; background: transparent !important; padding: 8px 12px; }

.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; }
.btn-cancel, .btn-save { padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 0.85rem; border: none; font-weight: bold; }
.btn-cancel { background: #333; color: #fff; }
.btn-save { background: #e50914; color: #fff; }
</style>
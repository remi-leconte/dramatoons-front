<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../services/api'
import WebtoonCoverUploader from '../../components/modal/WebtoonCoverUploader.vue'

import type { Progress } from '@/types/progress';

const route = useRoute()
const router = useRouter()
const webtoonId = route.params.id

const webtoon = ref({ 
  id: webtoonId,
  title: '', 
  status: 'ongoing',
  publish: false,
  image: '',
  updated: null as string | null
})
const readerProgressions = ref<Progress[]>([]);
const loading = ref(true)
const saving = ref(false)
const selectedFile = ref<File | null>(null)

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '-'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(dateString))
}

const fetchData = async () => {
  loading.value = true
  try {
    const webtoonRes = await api.get(`/webtoons/${webtoonId}`)
    webtoon.value = {
      ...webtoonRes.data,
      status: webtoonRes.data.status || 'ongoing'
    }

    const progressRes = await api.get(`/webtoon_users?webtoon=${webtoonId}`)
    readerProgressions.value = progressRes.data['hydra:member'] || progressRes.data.member || []
  } catch (error) {
    console.error('Erreur lors de la récupération du détail :', error)
  } finally {
    loading.value = false
  }
}

const handleUpdate = async () => {
  saving.value = true
  try {
    if (selectedFile.value) {
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      await api.post(`/webtoons/${webtoonId}/cover`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }

    await api.patch(`/webtoons/${webtoonId}`, {
      title: webtoon.value.title,
      status: webtoon.value.status || 'ongoing',
      publish: webtoon.value.publish
    }, {
      headers: { 'Content-Type': 'application/merge-patch+json' }
    })

    alert('Modifications enregistrées.')
    await fetchData()
    selectedFile.value = null
  } catch (error) {
    console.error('Erreur de mise à jour :', error)
  } finally {
    saving.value = false
  }
}

const handleDelete = async () => {
  if (!confirm('Confirmer la suppression de ce webtoon ?')) return
  try {
    await api.delete(`/webtoons/${webtoonId}`)
    router.push('/admin/webtoons')
  } catch (error) {
    console.error('Erreur de suppression :', error)
  }
}

onMounted(() => fetchData())
</script>

<template>
  <div class="admin-page">
    <router-link to="/admin/webtoons" class="back-link">← Retour à la liste</router-link>
    <h1>Détail Webtoon #{{ webtoonId }}</h1>

    <div v-if="loading">Chargement...</div>

    <template v-else>
      <form @submit.prevent="handleUpdate" class="detail-form">
        <div class="field cover-field">
          <label>Cover :</label>
          <div class="cover-container">
            <WebtoonCoverUploader 
              :image-path="webtoon.updated ? `${webtoon.image}?t=${new Date(webtoon.updated).getTime()}` : webtoon.image"
              :title="webtoon.title"
              :is-editable="true"
              @file-selected="(file: File) => selectedFile = file"
            />
          </div>
        </div>

        <div class="field">
          <label>Titre :</label>
          <input v-model="webtoon.title" class="app-input-field" required />
        </div>

        <div class="field toggle-row">
          <label>Terminé :</label>
          <label class="switch">
            <input 
              type="checkbox" 
              :checked="webtoon.status === 'completed'"
              @change="webtoon.status = (($event.target as HTMLInputElement).checked ? 'completed' : 'ongoing')"
            >
            <span class="slider round"></span>
          </label>
        </div>

        <div class="field toggle-row">
          <label>Publié :</label>
          <label class="switch">
            <input 
              type="checkbox" 
              v-model="webtoon.publish"
            >
            <span class="slider round"></span>
          </label>
        </div>

        <div class="field">
          <label>Dernière modification :</label>
          <input :value="formatDate(webtoon.updated)" class="app-input-field" disabled />
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">Enregistrer</button>
          <button type="button" class="btn btn-secondary danger" @click="handleDelete">Supprimer</button>
        </div>
      </form>

      <h2>Lecteurs associés ({{ readerProgressions.length }})</h2>
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID WebtoonUser</th>
            <th>État</th>
            <th>Note</th>
            <th>Marque-page</th>
            <th>Lecteur</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="prog in readerProgressions" :key="prog.id">
            <td>{{ prog.id }}</td>
            <td>{{ prog.state || '-' }}</td>
            <td>{{ prog.rate || '-' }}</td>
            <td>{{ prog.bookmark || '-' }}</td>
            <td class="action-col">
              <router-link v-if="prog.reader?.id" :to="`/admin/users/${prog.reader.id}`">
                {{ prog.reader?.login || 'Utilisateur' }} →
              </router-link>
              <span v-else>-</span>
            </td>
          </tr>
          <tr v-if="readerProgressions.length === 0">
            <td colspan="5" class="empty">Aucun lecteur pour ce Webtoon.</td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<style scoped>
.admin-page { padding: 2rem 5%; color: #fff; }
.back-link { color: #888; text-decoration: none; font-size: 0.9rem; }
.detail-form { max-width: 400px; margin: 1.5rem 0 2.5rem 0; display: flex; flex-direction: column; gap: 15px; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 0.85rem; color: #888; }
.field input:disabled { opacity: 0.6; cursor: not-allowed; }
.app-input-field {
  background: #252525;
  border: 1px solid #383838;
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
}
.form-actions { display: flex; gap: 10px; margin-top: 10px; }
.btn { padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-weight: bold; }
.btn-primary { background: #e50914; color: #fff; }
.btn-secondary.danger { background: #8b0000; color: #fff; }
.btn-secondary.danger:hover { background: #b20710; }
.admin-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
.admin-table th, .admin-table td { border-bottom: 1px solid #282828; padding: 10px; text-align: left; }
.admin-table th { color: #888; font-size: 0.85rem; }
.empty { text-align: center; color: #666; font-style: italic; }
.action-col { text-align: right; }
.action-col a { color: #e50914; text-decoration: none; }
.cover-field { margin-bottom: 10px; }
.cover-container { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }

.toggle-row { flex-direction: row; align-items: center; justify-content: space-between; }
.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #252525; border: 1px solid #383838; transition: .3s; }
.slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: .3s; }
input:checked + .slider { background-color: #4CAF50; border-color: #4CAF50; }
input:checked + .slider:before { transform: translateX(20px); }
.slider.round { border-radius: 24px; }
.slider.round:before { border-radius: 50%; }
</style>
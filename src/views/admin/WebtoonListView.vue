<script setup lang="ts">
import { ref, onMounted, watch } from 'vue' // Ajout de watch
import api from '../../services/api'

import type { Webtoon } from '@/types/webtoon';

const webtoons = ref<Webtoon[]>([]);
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const itemsPerPage = ref(20)
const searchTitle = ref('')
const onlyUnpublished = ref(false)

const fetchWebtoons = async (page = 1) => {
  loading.value = true
  try {
    let url = `/webtoons?page=${page}&admin=1&itemsPerPage=${itemsPerPage.value}`
    if (searchTitle.value) {
      url += `&title=${searchTitle.value}` // Ajout du paramètre de recherche par titre
    }
    if (onlyUnpublished.value) {
      url += `&publish=0`
    }
    const response = await api.get(url)
    const data = response.data
    webtoons.value = data['hydra:member'] || data.member || []

    const totalItems = data['totalItems'] || 0;
    totalPages.value = Math.ceil(totalItems / itemsPerPage.value);
    currentPage.value = page
  } catch (error) {
    console.error('Erreur lors de la récupération des webtoons :', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchWebtoons(1)
}

const resetSearch = () => {
  searchTitle.value = ''
  onlyUnpublished.value = false
  handleSearch()
}

watch(itemsPerPage, () => {
  handleSearch()
})

onMounted(() => fetchWebtoons())
</script>

<template>
  <div class="admin-page">
    <h1>Webtoons</h1>

    <div class="search-form">
      <div class="form-group">
        <label for="searchTitle">Rechercher par titre :</label>
        <input type="text" id="searchTitle" v-model="searchTitle" @keyup.enter="handleSearch" placeholder="Titre du webtoon">
      </div>

      <div class="form-group">
        <label>Non publiés uniquement :</label>
        <label class="switch">
          <input type="checkbox" v-model="onlyUnpublished" @change="handleSearch">
          <span class="slider round"></span>
        </label>
      </div>

      <div class="form-group">
        <label for="itemsPerPage">Résultats par page :</label>
        <select id="itemsPerPage" v-model="itemsPerPage">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>

      <button @click="handleSearch">Rechercher</button>
      <button class="reset-button" @click="resetSearch">Réinitialiser</button> <!-- Nouveau bouton Réinitialiser -->
    </div>

    <div v-if="loading" class="loading">Chargement...</div>

    <table v-else class="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Titre</th>
          <th>Statut</th>
          <th>Publié</th> <!-- Nouvelle colonne -->
          <th class="action-col"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(webtoon, index) in webtoons" :key="webtoon.id ?? index">
          <td>{{ webtoon.id }}</td>
          <td>{{ webtoon.title }}</td>
          <td>{{ webtoon.status || '-' }}</td>
          <td>
            <span :class="['publish-dot', webtoon.publish ? 'publish-true' : 'publish-false']"></span>
          </td>
          <td class="action-col">
            <router-link :to="`/admin/webtoons/${webtoon.id}`">Détail →</router-link>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pagination" v-if="totalPages > 1">
      <button :disabled="currentPage <= 1" @click="fetchWebtoons(currentPage - 1)">Précédent</button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button :disabled="currentPage >= totalPages" @click="fetchWebtoons(currentPage + 1)">Suivant</button>
    </div>
  </div>
</template>

<style scoped>
.admin-page { padding: 2rem 5%; color: #fff; }
.admin-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
.admin-table th, .admin-table td { border-bottom: 1px solid #282828; padding: 10px; text-align: left; }
.admin-table th { color: #888; font-size: 0.85rem; }
.action-col { text-align: right; }
.action-col a { color: #e50914; text-decoration: none; }
.pagination { display: flex; gap: 10px; align-items: center; justify-content: center; margin-top: 1.5rem; }
.pagination button { background: #252525; border: 1px solid #383838; color: #fff; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.loading { margin-top: 1rem; color: #888; }

.search-form {
  display: flex;
  gap: 15px;
  align-items: flex-end;
  margin-bottom: 1.5rem;
  background-color: #1e1e1e;
  padding: 15px;
  border-radius: 8px;
}

.search-form .form-group {
  display: flex;
  flex-direction: column;
  color: #fff;
}

.search-form label {
  margin-bottom: 5px;
  font-size: 0.9rem;
  color: #888;
}

.search-form input[type="text"],
.search-form select {
  background-color: #252525;
  border: 1px solid #383838;
  color: #fff;
  padding: 8px 10px;
  border-radius: 4px;
  font-size: 1rem;
}

.search-form button {
  background: #e50914;
  border: none;
  color: #fff;
  padding: 9px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.search-form button:hover {
  background-color: #ff0000;
}

.search-form .reset-button { /* Style spécifique pour le bouton de réinitialisation */
  background-color: #4a4a4a;
}

.search-form .reset-button:hover {
  background-color: #666666;
}

.publish-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.publish-true {
  background-color: #4CAF50; /* Vert */
}

.publish-false {
  background-color: #f44336; /* Rouge */
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  margin-top: 4px;
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
  background-color: #252525;
  border: 1px solid #383838;
  transition: .3s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
}

input:checked + .slider {
  background-color: #e50914;
  border-color: #e50914;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.slider.round {
  border-radius: 24px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>
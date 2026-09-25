<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import type { Webtoon } from '@/types/webtoon'

const webtoons = ref<Webtoon[]>([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const itemsPerPage = ref(20)

// Filtres
const searchFilters = ref({
  id: '',
  title: '',
  onlyUnpublished: false
})

// Tri
const sortKey = ref<'id' | 'title' | 'status' | 'publish' | 'updated'>('id')
const sortOrder = ref<'asc' | 'desc'>('asc')

const formatDate = (dateString?: string | Date | null): string => {
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

const fetchWebtoons = async (page = 1) => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('itemsPerPage', itemsPerPage.value.toString())
    params.append('admin', '1')

    if (searchFilters.value.id) params.append('id', searchFilters.value.id.trim())
    if (searchFilters.value.title) params.append('title', searchFilters.value.title.trim())
    if (searchFilters.value.onlyUnpublished) params.append('publish', 'false')

    params.append(`order[${sortKey.value}]`, sortOrder.value)

    const response = await api.get(`/webtoons?${params.toString()}`)
    const data = response.data
    webtoons.value = data['hydra:member'] || data.member || []

    const totalItems = data['hydra:totalItems'] || data.totalItems || 0
    totalPages.value = Math.max(1, Math.ceil(totalItems / itemsPerPage.value))
    currentPage.value = page
  } catch (error) {
    console.error('Erreur lors de la récupération des webtoons :', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchWebtoons(1)
}

const resetFilters = () => {
  searchFilters.value = {
    id: '',
    title: '',
    onlyUnpublished: false
  }
  itemsPerPage.value = 20
  fetchWebtoons(1)
}

const handleSort = (key: 'id' | 'title' | 'status' | 'publish' | 'updated') => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
  fetchWebtoons(currentPage.value)
}

onMounted(() => fetchWebtoons())
</script>

<template>
  <div class="admin-page">
    <h1>Webtoons</h1>

    <!-- Formulaire de recherche -->
    <form @submit.prevent="handleSearch" class="search-bar">
      <input v-model="searchFilters.id" type="text" placeholder="ID..." class="search-input input-id" />
      <input v-model="searchFilters.title" type="text" placeholder="Titre..." class="search-input" />
      
      <label class="checkbox-label">
        <input type="checkbox" v-model="searchFilters.onlyUnpublished" />
        Non publiés uniquement
      </label>

      <select v-model="itemsPerPage" @change="handleSearch" class="search-select">
        <option :value="10">10 / page</option>
        <option :value="20">20 / page</option>
        <option :value="50">50 / page</option>
        <option :value="100">100 / page</option>
      </select>

      <button type="submit" class="btn btn-primary">Rechercher</button>
      <button type="button" class="btn btn-secondary" @click="resetFilters">Réinitialiser</button>
    </form>

    <div v-if="loading" class="loading">Chargement...</div>

    <table v-else class="admin-table">
      <thead>
        <tr>
          <th class="sortable" @click="handleSort('id')">
            ID <span v-if="sortKey === 'id'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
          </th>
          <th class="sortable" @click="handleSort('title')">
            Titre <span v-if="sortKey === 'title'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
          </th>
          <th class="sortable" @click="handleSort('status')">
            Statut <span v-if="sortKey === 'status'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
          </th>
          <th class="sortable" @click="handleSort('publish')">
            Publié <span v-if="sortKey === 'publish'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
          </th>
          <th class="sortable" @click="handleSort('updated')">
            Dernière modification <span v-if="sortKey === 'updated'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
          </th>
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
          <td>{{ formatDate(webtoon.updated) }}</td>
          <td class="action-col">
            <router-link :to="`/admin/webtoons/${webtoon.id}`">Détail →</router-link>
          </td>
        </tr>
        <tr v-if="webtoons.length === 0">
          <td colspan="6" class="empty">Aucun webtoon ne correspond à la recherche.</td>
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

.search-bar { display: flex; gap: 10px; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center; }
.search-input, .search-select {
  background: #252525;
  border: 1px solid #383838;
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
}
.search-input.input-id { width: 80px; }
.search-input { flex: 1; min-width: 150px; }
.search-select { min-width: 110px; }

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #ccc;
  cursor: pointer;
}

.admin-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
.admin-table th, .admin-table td { border-bottom: 1px solid #282828; padding: 10px; text-align: left; }
.admin-table th { color: #888; font-size: 0.85rem; }
.admin-table th.sortable { cursor: pointer; user-select: none; }
.admin-table th.sortable:hover { color: #fff; }

.action-col { text-align: right; }
.action-col a { color: #e50914; text-decoration: none; }

.btn { padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-weight: bold; }
.btn-primary { background: #e50914; color: #fff; }
.btn-secondary { background: #333; color: #fff; }

.pagination { display: flex; gap: 10px; align-items: center; justify-content: center; margin-top: 1.5rem; }
.pagination button { background: #252525; border: 1px solid #383838; color: #fff; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.loading, .empty { text-align: center; color: #888; margin-top: 1rem; font-style: italic; }

.publish-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.publish-true { background-color: #4cd137; box-shadow: 0 0 6px rgba(76, 209, 55, 0.4); }
.publish-false { background-color: #e50914; box-shadow: 0 0 6px rgba(229, 9, 20, 0.4); }
</style>
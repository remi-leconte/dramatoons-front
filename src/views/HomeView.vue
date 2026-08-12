<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

import WebtoonCard from '../components/WebtoonCard.vue'
import WebtoonModal from '../components/WebtoonModal.vue'
import WebtoonCreateModal from '../components/WebtoonCreateModal.vue'

const authStore = useAuthStore()
const webtoons = ref([])
const loading = ref(false)
const nextPageUrl = ref('/webtoons')
const observerTarget = ref(null) // Référence l'élément HTML invisible en bas de page utilisé par l'IntersectionObserver pour déclencher le scroll infini
const selectedWebtoon = ref(null)
const isCreateModalOpen = ref(false)

// Filtres de recherche
const status = ref([])
const sortBy = ref('added')
const sortOrder = ref('desc')
const itemsPerPage = ref(20)
const isInitializing = ref(true)

const initPreferences = async () => {
  status.value = authStore.preferences.status || []
  sortBy.value = authStore.preferences.sortBy || 'added'
  sortOrder.value = authStore.preferences.sortOrder || 'desc'
  itemsPerPage.value = authStore.preferences.itemsPerPage || 20
}

const openModal = (webtoon) => {
  selectedWebtoon.value = webtoon
}

const closeModal = () => {
  selectedWebtoon.value = null
}

// Met à jour les données de la grille après une sauvegarde réussie dans la popup
const handleModalSave = (updatedWebtoon) => {
  const originalWebtoon = webtoons.value.find(w => w.id === updatedWebtoon.id)
  if (originalWebtoon) {
    Object.assign(originalWebtoon, updatedWebtoon)
  }
  closeModal()
}

// Insère le nouveau Webtoon créé au début de la liste
const handleWebtoonCreated = (newWebtoon) => {
  webtoons.value.unshift(newWebtoon)
}

// Supprime le Webtoon de la liste
const handleModalDelete = (deletedId) => {
  webtoons.value = webtoons.value.filter(item => item.id !== deletedId)
}

// Changement de statut direct depuis une carte de la grille
const changeStatus = async (webtoon, newState) => {
  if (!webtoon.userProgress) {
    webtoon.userProgress = { bookmark: null, rate: null, state: null, id: null }
  }

  const previousState = webtoon.userProgress.state
  webtoon.userProgress.state = newState

  try {
    if (webtoon.userProgress.id) {
      await api.patch(`/webtoon_users/${webtoon.userProgress.id}`, {
        state: newState
      }, {
        headers: { 'Content-Type': 'application/merge-patch+json' }
      })
    } else {
      const response = await api.post('/webtoon_users', {
        webtoon: `/webtoons/${webtoon.id}`,
        state: newState
      }, {
        headers: { 'Content-Type': 'application/ld+json' }
      })
      
      webtoon.userProgress.id = response.data.id
    }
  } catch (error) {
    console.error(error)
    webtoon.userProgress.state = previousState
  }
}

const fetchWebtoons = async () => {
  if (loading.value || !nextPageUrl.value) return

  loading.value = true
  try {
    const response = await api.get(nextPageUrl.value)

    const data = response.data
    const newItems = data.member || data['hydra:member'] || []
    webtoons.value = [...webtoons.value, ...newItems]

    const view = data['hydra:view'] || data.view
    nextPageUrl.value = view?.['hydra:next'] || view?.next || null
    //nextPageUrl.value = data.view?.next || data['hydra:view']?.next || null
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const resetAndFetchWebtoons = async () => {
  webtoons.value = []
  nextPageUrl.value = '/webtoons'
  await fetchWebtoons()
}

// Détection de tout changement dans le formulaire de recherche
watch([status, sortBy, sortOrder, itemsPerPage], async ([newStatus, newSortBy, newSortOrder, newItemsPerPage]) => {

  if (isInitializing.value) return

  await authStore.savePreferences({
    searchStatus: newStatus,
    searchSortBy: newSortBy,
    searchSortOrder: newSortOrder,
    searchItemsPerPage: newItemsPerPage
  })

  await resetAndFetchWebtoons()
}, { deep: true })

// Instance de l'IntersectionObserver pour le scroll infini
let observer = null

onMounted(async () => {
  isInitializing.value = true
  await authStore.fetchUserProfile()
  await initPreferences()
  isInitializing.value = false

  resetAndFetchWebtoons()

  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      fetchWebtoons()
    }
  }, { threshold: 0.1 })

  if (observerTarget.value) observer.observe(observerTarget.value)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<template>
  <main class="content" :class="{ 'content-dimmed': selectedWebtoon || isCreateModalOpen }">
    
    <div v-if="authStore.isAdmin" class="admin-link-container">
      <button class="admin-link" @click="isCreateModalOpen = true">Créer un Webtoon</button>
    </div>

    <form v-if="authStore.isAuthenticated" class="filter-bar" @submit.prevent>
      <div class="filter-group">
        <label for="filter-status">État :</label>
        <select id="filter-status" v-model="status" class="filter-select" multiple>
          <option value="">Tous les états</option>
          <option value="reading">En cours de lecture</option>
          <option value="pause">En pause</option>
          <option value="break">Pas interessé</option>
          <option value="completed">Terminé</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-sort">Trier par :</label>
        <select id="filter-sort" v-model="sortBy" class="filter-select">
          <option value="added">Ajouts</option>
          <option value="rating">Notes globales</option>
          <option value="user_rating">Notes personnelles</option>
          <option value="title">Titres</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-order">Ordre :</label>
        <select id="filter-order" v-model="sortOrder" class="filter-select">
          <option value="desc">Descendant</option>
          <option value="asc">Ascendant</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-limit">Par page :</label>
        <select id="filter-limit" v-model="itemsPerPage" class="filter-select select-small">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>
    </form>
    
    <div class="webtoon-grid">
      <WebtoonCard 
        v-for="(webtoon, index) in webtoons" 
        :key="webtoon.id || index"
        :webtoon="webtoon"
        @click="openModal(webtoon)"
        @status-change="(newState) => changeStatus(webtoon, newState)"
      />
    </div>

    <div ref="observerTarget" class="pagination-trigger">
      <div v-if="loading" class="loader-infinite">Chargement des prochains webtoons...</div>
      <p v-if="!nextPageUrl && webtoons.length > 0" class="end-message">
        Fin du catalogue.
      </p>
    </div>
  </main>

  <WebtoonModal 
    v-if="selectedWebtoon" 
    :webtoon="selectedWebtoon" 
    @close="closeModal" 
    @saved="handleModalSave"
    @deleted="handleModalDelete"
  />

  <WebtoonCreateModal
    v-if="isCreateModalOpen"
    @close="isCreateModalOpen = false"
    @created="handleWebtoonCreated"
  />
</template>

<style>
/* --- MISE EN PAGE GLOBALE --- */
.content { padding: 2rem 5%; transition: filter 0.3s ease, opacity 0.3s ease; }
.content-dimmed { filter: blur(4px); opacity: 0.3; pointer-events: none; }
.section-title { font-size: 1.2rem; margin-bottom: 1.5rem; border-left: 4px solid #e50914; padding-left: 10px; }

/* --- STYLE DU LIEN ADMIN --- */
.admin-link-container { display: flex; margin-bottom: 1rem; }
.admin-link { background: none; border: none; color: #e50914; font-weight: bold; font-size: 1rem; cursor: pointer; text-decoration: underline; padding: 0; }

/* --- STRUCTURE DE LA GRILLE --- */
.webtoon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 20px 12px; }
@media (min-width: 480px) { .webtoon-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 25px 15px; } }

/* --- PAGINATION --- */
.pagination-trigger { height: 100px; display: flex; justify-content: center; align-items: center; margin-top: 2rem; }
.loader-infinite { color: #666; font-weight: bold; font-size: 0.9rem; font-style: italic; }
.end-message { color: #666; font-style: italic; }

/* --- BARRE DE RECHERCHE ET FILTRES --- */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
  background-color: #181818;
  border: 1px solid #282828;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 200px;
}

.filter-group label {
  font-size: 0.85rem;
  color: #bbb;
  white-space: nowrap;
}

.filter-select {
  width: 100%;
  background-color: #252525;
  color: #ffffff;
  border: 1px solid #383838;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.filter-select:focus {
  border-color: #e50914;
}

.filter-select.select-small {
  flex: 0 0 70px;
}

#filter-status {
  height: 35px;
  padding: 1px 12px;

}

@media (max-width: 600px) {
  .filter-group {
    flex: 1 1 100%;
  }
}
</style>
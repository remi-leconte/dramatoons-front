<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

import WebtoonCard from '../components/WebtoonCard.vue'
import WebtoonModal from '../components/modal/WebtoonModal.vue'

const authStore = useAuthStore()
const webtoons = ref([])
const loading = ref(false)
const nextPageUrl = ref('/webtoons')
const observerTarget = ref(null) // Référence l'élément HTML invisible en bas de page utilisé par l'IntersectionObserver pour déclencher le scroll infini
const selectedWebtoon = ref(null)
const isModalOpen = ref(false)

const showScrollTop = ref(false)
let lastScrollY = 0

const handleScroll = () => {
  const currentScrollY = window.scrollY
  
  if (currentScrollY < lastScrollY && currentScrollY > 300) {
    showScrollTop.value = true
  } else {
    showScrollTop.value = false
  }
  
  lastScrollY = currentScrollY
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// Filtres de recherche
const status = ref('')
const sortBy = ref('added')
const sortOrder = ref('desc')
const itemsPerPage = ref(20)
const isInitializing = ref(true)

const initPreferences = async () => {
  status.value = authStore.preferences.status || ''
  sortBy.value = authStore.preferences.sortBy || 'added'
  sortOrder.value = authStore.preferences.sortOrder || 'desc'
  itemsPerPage.value = authStore.preferences.itemsPerPage || 20
}

const openModal = (webtoon = null) => {
  selectedWebtoon.value = webtoon
  isModalOpen.value = true
}

const closeModal = () => {
  selectedWebtoon.value = null
  isModalOpen.value = false
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
  closeModal()
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
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
    checkAndLoadMore()
  }
}

const checkAndLoadMore = () => {
  if (!observerTarget.value || !nextPageUrl.value || loading.value) return

  nextTick(() => {
    const rect = observerTarget.value.getBoundingClientRect()
    // Si le haut de l'élément cible est au-dessus du bas de la fenêtre
    if (rect.top <= window.innerHeight) {
      fetchWebtoons()
    }
  })
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
  window.addEventListener('scroll', handleScroll)

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
  window.removeEventListener('scroll', handleScroll)
  if (observer) observer.disconnect()
})
</script>

<template>
  <main class="content" :class="{ 'content-dimmed': isModalOpen }">
    
    <div v-if="authStore.isAdmin" class="admin-link-container">
      <button class="admin-link" @click="openModal(null)">Créer un Webtoon</button>
    </div>

    <form v-if="authStore.isAuthenticated" class="filter-bar" @submit.prevent>
      <div class="filter-group">
        <label for="filter-status">Filtrer par état :</label>
        <select id="filter-status" v-model="status" class="app-input-field filter-select">
          <option value="">Tous</option>
          <option value="reading">En cours de lecture</option>
          <option value="pause">Lecture en pause</option>
          <option value="break">Pas interessé</option>
          <option value="completed">Lecture Terminée</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-sort">Trier par :</label>
        <select id="filter-sort" v-model="sortBy" class="app-input-field filter-select">
          <option value="added">Ajouts</option>
          <option value="rating">Notes globales</option>
          <option value="user_rating">Notes personnelles</option>
          <option value="title">Titres</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-order">Ordre :</label>
        <select id="filter-order" v-model="sortOrder" class="app-input-field filter-select">
          <option value="desc">Descendant</option>
          <option value="asc">Ascendant</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-limit">Résultat par page :</label>
        <select id="filter-limit" v-model="itemsPerPage" class="app-input-field filter-select select-small">
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

  <Transition name="fade">
    <button 
      v-if="showScrollTop" 
      class="scroll-top-btn" 
      @click="scrollToTop"
      aria-label="Retourner en haut"
    >
      ▲
    </button>
  </Transition>

  <WebtoonModal 
    v-if="isModalOpen" 
    :webtoon="selectedWebtoon" 
    @close="closeModal" 
    @saved="handleModalSave"
    @created="handleWebtoonCreated"
    @deleted="handleModalDelete"
  />
</template>

<style scoped>
/* Layout */
.content { padding: 2rem 5%; transition: filter 0.3s ease, opacity 0.3s ease; }
.content-dimmed { filter: blur(4px); opacity: 0.3; pointer-events: none; }

/* Admin */
.admin-link-container { display: flex; margin-bottom: 1rem; }
.admin-link { background: none; border: none; color: var(--primary-red); font-weight: bold; font-size: 1rem; cursor: pointer; text-decoration: underline; padding: 0; }

/* Grille */
.webtoon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 20px 12px; }
@media (min-width: 480px) { .webtoon-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 25px 15px; } }

/* Pagination */
.pagination-trigger { height: 100px; display: flex; justify-content: center; align-items: center; margin-top: 2rem; }
.loader-infinite, .end-message { color: #666; font-weight: bold; font-size: 0.9rem; font-style: italic; }

/* Filtres */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
  background-color: var(--bg-dark);
  border: 1px solid var(--border-color);
  padding: 15px 20px;
  border-radius: var(--radius-lg);
  margin-bottom: 2rem;
}

.filter-group { display: flex; align-items: center; gap: 8px; flex: 1 1 200px; }
.filter-group label { font-size: 0.85rem; color: var(--text-muted); white-space: nowrap; }

.filter-select { width: 100%; padding: 0 12px; cursor: pointer; }
.filter-select.select-small { flex: 0 0 70px; }

@media (max-width: 600px) {
  .filter-group { flex: 1 1 100%; }
}

/* Bouton Scroll Top */
.scroll-top-btn {
  position: fixed;
  bottom: 25px; right: 25px;
  width: 45px; height: 45px;
  border-radius: 50%;
  background-color: var(--primary-red);
  color: var(--text-main);
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 99;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.scroll-top-btn:hover { background-color: var(--primary-red-hover); transform: scale(1.1); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(10px); }
</style>
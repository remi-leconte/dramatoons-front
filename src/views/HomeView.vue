<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import api from '../services/api'
// Importation des sous-composants
import WebtoonCard from '../components/WebtoonCard.vue'
import WebtoonModal from '../components/WebtoonModal.vue'

// Stocke la liste complète des webtoons récupérés depuis l'API pour l'affichage de la grille
const webtoons = ref([])

// Indique si une requête de chargement est en cours (affiche le message de chargement en bas de page)
const loading = ref(false)

// Conserve l'URL de la page suivante fournie par l'API pour gérer la pagination infinie
const nextPageUrl = ref('/webtoons')

// Référence l'élément HTML invisible en bas de page utilisé par l'IntersectionObserver pour déclencher le scroll infini
const observerTarget = ref(null)

// Contient le webtoon actuellement sélectionné pour l'affichage dans la popup (null si fermée)
const selectedWebtoon = ref(null)

// Ouvre la popup en y associant le webtoon cliqué
const openModal = (webtoon) => {
  selectedWebtoon.value = webtoon
}

// Ferme proprement la popup
const closeModal = () => {
  selectedWebtoon.value = null
}

// Met à jour les données de la grille après une sauvegarde réussie dans la popup
const handleModalSave = (updatedUserProgress) => {
  const originalWebtoon = webtoons.value.find(w => w.id === selectedWebtoon.value.id)
  if (originalWebtoon) {
    originalWebtoon.userProgress = { ...updatedUserProgress }
  }
  closeModal()
}

// Envoie une requête API immédiate lors d'un changement de statut direct depuis une carte de la grille
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
    console.error("Erreur lors de la sauvegarde du statut :", error)
    webtoon.userProgress.state = previousState
  }
}

// Interroge l'API pour récupérer la page courante des webtoons
const fetchWebtoons = async () => {
  if (loading.value || !nextPageUrl.value) return

  loading.value = true
  try {
    const response = await api.get(nextPageUrl.value, {
      headers: { 'Accept': 'application/ld+json' }
    })

    const data = response.data
    const newItems = data.member || data['hydra:member'] || []
    webtoons.value = [...webtoons.value, ...newItems]

    nextPageUrl.value = data.view?.next || data['hydra:view']?.next || null
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// Instance de l'IntersectionObserver pour le scroll infini
let observer = null

onMounted(() => {
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
  <main class="content" :class="{ 'content-dimmed': selectedWebtoon }">
    <h2 class="section-title">Dernières Sorties</h2>
    
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
  />
</template>

<style>
/* --- MISE EN PAGE GLOBALE --- */
.content { padding: 2rem 5%; transition: filter 0.3s ease, opacity 0.3s ease; }
.content-dimmed { filter: blur(4px); opacity: 0.3; pointer-events: none; }
.section-title { font-size: 1.2rem; margin-bottom: 1.5rem; border-left: 4px solid #e50914; padding-left: 10px; }

/* --- STRUCTURE DE LA GRILLE --- */
.webtoon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 20px 12px; }
@media (min-width: 480px) { .webtoon-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 25px 15px; } }

/* --- PAGINATION --- */
.pagination-trigger { height: 100px; display: flex; justify-content: center; align-items: center; margin-top: 2rem; }
.loader-infinite { color: #666; font-weight: bold; font-size: 0.9rem; font-style: italic; }
.end-message { color: #666; font-style: italic; }
</style>
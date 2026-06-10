<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

const webtoons = ref([])
const loading = ref(false)
const nextPageUrl = ref('/webtoons')
const observerTarget = ref(null)

const authStore = useAuthStore()

const activeDropdownIndex = ref(null)

// Tableau avec tes identifiants exacts de BDD (et id: null pour Aucun)
const statusOptions = [
  { id: null, label: 'Aucun', class: 'status-none' },
  { id: 'reading', label: 'En cours', class: 'status-reading' },
  { id: 'pause', label: 'En pause', class: 'status-paused' },
  { id: 'break', label: 'Pas intéressé', class: 'status-disinterested' },
  { id: 'completed', label: 'Terminé', class: 'status-completed' }
]

// Récupère la classe CSS associée à l'état actuel du webtoon
const getStatusClass = (webtoon) => {
  const currentState = webtoon.userProgress?.state ?? null
  const option = statusOptions.find(o => o.id === currentState)
  return option ? option.class : 'status-none'
}

// Récupère le texte de l'état actuel (utilisé désormais pour l'infobulle au survol)
const getStatusLabel = (webtoon) => {
  const currentState = webtoon.userProgress?.state ?? null
  const option = statusOptions.find(o => o.id === currentState)
  return option ? option.label : 'Aucun'
}

// 💡 Ouvre ou ferme le menu basé sur l'index unique de la carte
const toggleDropdown = (index) => {
  if (activeDropdownIndex.value === index) {
    activeDropdownIndex.value = null
  } else {
    activeDropdownIndex.value = index
  }
}

// Met à jour le champ .state avec la nouvelle valeur (qui peut être null)
const changeStatus = async (webtoon, newState) => {
  activeDropdownIndex.value = null 
  
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
    webtoon.userProgress.state = previousState // Annulation du changement visuel en cas d'erreur
  }
}

// Ferme le dropdown automatiquement si on clique n'importe où ailleurs sur la page
const closeAllDropdowns = (e) => {
  if (!e.target.closest('.custom-select-container')) {
    activeDropdownIndex.value = null
  }
}

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

let observer = null
onMounted(() => {
  window.addEventListener('click', closeAllDropdowns)
  
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      fetchWebtoons()
    }
  }, { threshold: 0.1 })

  if (observerTarget.value) observer.observe(observerTarget.value)
})

onUnmounted(() => {
  window.removeEventListener('click', closeAllDropdowns)
  if (observer) observer.disconnect()
})
</script>

<template>
  <main class="content">
    <h2 class="section-title">Dernières Sorties</h2>
    
    <div class="webtoon-grid">
      <article v-for="(webtoon, index) in webtoons" :key="webtoon.id || index" class="webtoon-card">
        <div class="poster-wrapper">
          <img 
            :src="`http://dramatoons.api.local:8081/upload/cover/${webtoon.image}`" 
            :alt="webtoon.title"
            @error="(e) => e.target.src = 'http://dramatoons.api.local:8081/upload/cover/defaut.jpg'"
          >
          
          <div v-if="authStore.isAuthenticated" class="custom-select-container">
            <button 
              @click.stop="toggleDropdown(index)" 
              class="status-btn" 
              :class="[getStatusClass(webtoon), { 'is-active': activeDropdownIndex === index }]"
              :title="`Statut : ${getStatusLabel(webtoon)}`"
            >
              <span class="arrow"></span>
            </button>

            <ul v-if="activeDropdownIndex === index" class="status-dropdown">
              <li 
                v-for="option in statusOptions" 
                :key="option.id"
                @click="changeStatus(webtoon, option.id)"
                :class="option.class"
              >
                {{ option.label }}
              </li>
            </ul>
          </div>

          <div class="overlay">
            <span class="chapter-badge">
              <template v-if="authStore.isAuthenticated && webtoon.userProgress && webtoon.userProgress.bookmark">
                Chap. {{ webtoon.userProgress.bookmark }}/{{ webtoon.chapter }}
              </template>
              <template v-else>
                Chap. {{ webtoon.chapter }}
              </template>
            </span>
          </div>
        </div>
        <div class="info">
          <h3 class="title" :title="webtoon.title">{{ webtoon.title }}</h3>

          <div class="stats-row">
            <span title="Note moyenne globale">⭐ {{ webtoon.averageRating || '-' }}</span>
            <span title="Nombre de lecteurs">👤 {{ webtoon.readersCount || 0 }}</span>
            <span v-if="authStore.isAuthenticated && webtoon.userProgress" title="Votre note" class="user-rating">🏷️ {{ webtoon.userProgress.rate || '-' }}</span>
          </div>

          <p class="genre">Action, Fantasy</p>
        </div>
      </article>
    </div>

    <div ref="observerTarget" class="pagination-trigger">
      <div v-if="loading" class="loader-infinite">Chargement des prochains webtoons...</div>
      <p v-if="!nextPageUrl && webtoons.length > 0" class="end-message">
        Fin du catalogue.
      </p>
    </div>

  </main>
</template>

<style>
/* content */
.content { padding: 2rem 5%; }

/* menu */
.section-title {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  border-left: 4px solid #e50914;
  padding-left: 10px;
}

/* grille */
.webtoon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 25px 15px;
}

/* card */
.webtoon-card {
  transition: transform 0.3s ease;
}

.webtoon-card:hover {
  transform: scale(1.05);
}

.poster-wrapper {
  position: relative;
  aspect-ratio: 2 / 3;
  box-shadow: 0 10px 20px rgba(0,0,0,0.5);
}

.poster-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  border-radius: 0 0 4px 4px;
}

.chapter-badge {
  background: #e50914;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 2px;
  font-weight: bold;
}

.info { 
  margin-top: 10px; 
}

.title {
  font-size: 0.9rem;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.genre {
  font-size: 0.75rem;
  color: #aaaaaa;
  margin-top: 4px;
}

/* Styles pour la ligne de statistiques */
.stats-row {
  display: flex;
  gap: 10px;
  font-size: 0.75rem;
  color: #cccccc;
  margin-top: 6px;
  align-items: center;
}

.stats-row span {
  display: flex;
  align-items: center;
  gap: 2px;
  cursor: pointer;
}

.user-rating {
  color: #ffcc00;
  font-weight: bold;
}

/* selecteur état */
.custom-select-container {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 16px;
  z-index: 20;
}

.status-btn {
  width: 100%;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 4px;
  color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  transition: background 0.2s ease;
}

.status-btn .arrow {
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 3.5px solid transparent;  
  border-right: 3.5px solid transparent; 
  border-top: 4.5px solid #ffffff;       
  transition: transform 0.2s ease;
  transform: rotate(0deg);               
}

.status-btn.is-active .arrow {
  transform: rotate(180deg);
}

/* Couleurs des états */
.status-none { background-color: rgba(85, 85, 85, 0.9); }
.status-reading { background-color: rgba(33, 150, 243, 0.9); }
.status-paused { background-color: rgba(255, 152, 0, 0.9); }
.status-disinterested { background-color: rgba(229, 9, 20, 0.9); }
.status-completed { background-color: rgba(76, 175, 80, 0.9); }

.status-btn:hover {
  filter: brightness(1.2);
}

/* La liste déroulante */
.status-dropdown {
  position: absolute;
  top: 100%;
  right: 0; 
  width: 110px; 
  margin: 4px 0 0 0;
  padding: 0;
  list-style: none;
  background-color: #1f1f1f;
  border: 1px solid #333333;
  border-radius: 4px;
  z-index: 100;
  box-shadow: 0 5px 15px rgba(0,0,0,0.6);
  overflow: hidden;
}

.status-dropdown li {
  padding: 6px 8px;
  font-size: 0.7rem;
  color: #ffffff;
  cursor: pointer;
  transition: padding-left 0.2s ease;
}

.status-dropdown li:hover {
  padding-left: 12px;
}
.status-dropdown li.status-none:hover { border-left: 3px solid #555555; background: #2a2a2a; }
.status-dropdown li.status-reading:hover { border-left: 3px solid #2196F3; background: #2a2a2a; }
.status-dropdown li.status-paused:hover { border-left: 3px solid #ff9800; background: #2a2a2a; }
.status-dropdown li.status-disinterested:hover { border-left: 3px solid #e50914; background: #2a2a2a; }
.status-dropdown li.status-completed:hover { border-left: 3px solid #4CAF50; background: #2a2a2a; }

/* Pagination (infinite scroll) */
.pagination-trigger {
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.loader-infinite {
  color: #666;
  font-weight: bold;
  font-size: 0.9rem;
  font-style: italic;
}

.end-message {
  color: #666;
  font-style: italic;
}
</style>
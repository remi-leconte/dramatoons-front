<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import api from '../services/api'

const webtoons = ref([])
const loading = ref(false)
const nextPageUrl = ref('/webtoons')
const observerTarget = ref(null)

const fetchWebtoons = async () => {
  if (loading.value || !nextPageUrl.value) return

  loading.value = true
  try {
    const response = await api.get(nextPageUrl.value, {
      headers: { 'Accept': 'application/ld+json' }
    })

    const data = response.data

    const newItems = data.member || data['hydra:member'] || []
    webtoons.value = [...webtoons.value, ...newItems] // ... permet de prendre chaque élément du tableau individuellement

    nextPageUrl.value = data.view?.next || data['hydra:view']?.next || null
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

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
  <main class="content">
    <h2 class="section-title">Dernières Sorties</h2>
    
    <!-- grille -->
    <div class="webtoon-grid">
      <article v-for="webtoon in webtoons" :key="webtoon.id" class="webtoon-card">
        <div class="poster-wrapper">
          <img 
            :src="`http://dramatoons.api.local:8081/upload/cover/${webtoon.image}`" 
            :alt="webtoon.title"
            @error="(e) => e.target.src = 'http://dramatoons.api.local:8081/upload/cover/defaut.jpg'"
          >
          <div class="overlay">
            <span class="chapter-badge">Chap. {{ webtoon.chapter }}</span>
          </div>
        </div>
        <div class="info">
          <h3 class="title">{{ webtoon.title }}</h3>
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
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 10px 20px rgba(0,0,0,0.5);
}

.poster-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
}

.chapter-badge {
  background: #e50914;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 2px;
  font-weight: bold;
}

.info { margin-top: 10px; }

.title {
  font-size: 0.9rem;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* Coupe le texte proprement */
}

.genre {
  font-size: 0.75rem;
  color: #aaaaaa;
  margin-top: 4px;
}

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
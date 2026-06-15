<script setup>
import { useAuthStore } from '../stores/auth'
import StatusSelect from './StatusSelect.vue'

// 1. Reçoit les données du webtoon à afficher
defineProps({
  webtoon: {
    type: Object,
    required: true
  }
})

// 2. Événement envoyé au parent quand le statut change directement sur la carte
const emit = defineEmits(['status-change'])

const authStore = useAuthStore()
</script>

<template>
  <article class="webtoon-card">
    <div class="poster-wrapper">
      <img 
        :src="`http://dramatoons.api.local:8081/upload/cover/${webtoon.image}`" 
        :alt="webtoon.title"
        @error="(e) => e.target.src = 'http://dramatoons.api.local:8081/upload/cover/defaut.jpg'"
      >
      
      <div v-if="authStore.isAuthenticated" class="grid-select-position" @click.stop>
        <StatusSelect 
          :state="webtoon.userProgress?.state"
          @update:state="(newState) => emit('status-change', newState)"
        />
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

      <div v-if="webtoon.type === 'completed'" class="status-inline-badge">
        <span class="badge-completed">Terminé</span>
      </div>

      <p class="genre">Action, Fantasy</p>
    </div>
  </article>
</template>

<style scoped>
/* --- DESIGN DE LA CARTE (Isolé grâce à scoped) --- */
.webtoon-card { transition: transform 0.3s ease; cursor: pointer; }
.webtoon-card:hover { transform: scale(1.05); }

.poster-wrapper { position: relative; aspect-ratio: 2 / 3; box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
.poster-wrapper img { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; }

.grid-select-position { position: absolute; top: 8px; right: 8px; width: 16px; height: 16px; z-index: 20; }

.overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 10px; background: linear-gradient(transparent, rgba(0,0,0,0.8)); border-radius: 0 0 4px 4px; }
.chapter-badge { background: #e50914; font-size: 0.7rem; padding: 2px 6px; border-radius: 2px; font-weight: bold; }

.info { margin-top: 10px; }
.title { font-size: 0.9rem; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.genre { font-size: 0.75rem; color: #aaaaaa; margin-top: 4px; }
.badge-completed { font-size: 0.65rem; padding: 2px 6px; border-radius: 10px; font-weight: bold; color: #fff; display: inline-block; background-color: #4CAF50; margin-top: 6px; }

.stats-row { display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.75rem; color: #cccccc; margin-top: 6px; align-items: center; }
.stats-row span { display: flex; align-items: center; gap: 2px; }
.user-rating { color: #ffcc00; font-weight: bold; }
</style>
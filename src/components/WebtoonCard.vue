<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { COVER_BASE_URL } from '../services/api'
import StatusSelect from './StatusSelect.vue'

const props = defineProps({
  webtoon: {
    type: Object,
    required: true
  }
})
const emit = defineEmits(['status-change'])

const authStore = useAuthStore()
const hasImageError = ref(false)

const secondaryTitlesArray = computed(() => {
  if (!props.webtoon.secondaryTitles) return []
  if (Array.isArray(props.webtoon.secondaryTitles)) {
    return props.webtoon.secondaryTitles
  }
  return Object.values(props.webtoon.secondaryTitles)
})

const secondaryTitlesText = computed(() => {
  if (secondaryTitlesArray.value.length === 0) return ''
  return secondaryTitlesArray.value.map((t: { title: string }) => t.title).join(', ')
})
</script>

<template>
  <article class="webtoon-card">
    <div class="poster-wrapper">
      <img 
        v-if="webtoon.image && !hasImageError"
        :src="`${COVER_BASE_URL}${webtoon.image}?t=${new Date(webtoon.updated).getTime()}`" 
        :alt="webtoon.title.title || 'Webtoon cover'"
        @error="hasImageError = true"
      >
      <div v-else class="cover-placeholder">
        <span class="placeholder-text">{{ webtoon.title.title || 'Sans titre' }}</span>
      </div>
      
      <div v-if="authStore.isAuthenticated" class="grid-select-position" @click.stop>
        <StatusSelect 
          :state="webtoon.userProgress?.state"
          @update:state="(newState) => emit('status-change', newState)"
        />
      </div>

      <div class="overlay">
        <span 
          v-if="authStore.isAuthenticated && webtoon.userProgress?.bookmark" 
          class="chapter-badge"
        >
          Chap. {{ webtoon.userProgress.bookmark }}
        </span>
      </div>
    </div>
    
    <div class="info">
      <div class="title-row">
        <h3 class="title" :title="webtoon.title.title">
          {{ webtoon.title.title }}
        </h3>

        <div v-if="secondaryTitlesText" class="secondary-titles-badge" :title="`Titres alternatifs : ${secondaryTitlesText}`">
          +{{ secondaryTitlesArray.length }}
        </div>
      </div>

      <div class="stats-row">
        <span v-if="authStore.isAuthenticated && webtoon.userProgress" title="Votre note" class="user-rating">🏷️ {{ webtoon.userProgress.rate || '-' }}</span>
        <span v-if="webtoon.publish" title="Note moyenne globale">⭐ {{ webtoon.averageRating || '-' }}</span>
        <span v-if="webtoon.publish" title="Nombre de lecteurs">👤 {{ webtoon.readersCount || 0 }}</span>
      </div>

      <div v-if="webtoon.status === 'completed'" class="status-inline-badge">
        <span class="badge-completed" title="Ce Webtoon est terminé">Terminé</span>
      </div>
    </div>

  </article>
</template>

<style scoped>
.webtoon-card { transition: transform 0.3s ease; cursor: pointer; }
.webtoon-card:hover { transform: scale(1.05); }

.poster-wrapper { position: relative; aspect-ratio: 2 / 3; box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
.poster-wrapper img { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; }

.grid-select-position { position: absolute; top: 8px; right: 8px; width: 16px; height: 16px; z-index: 20; }

.overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 10px; background: linear-gradient(transparent, rgba(0,0,0,0.8)); border-radius: 0 0 4px 4px; }
.chapter-badge { background: #e50914; font-size: 0.7rem; padding: 2px 6px; border-radius: 2px; font-weight: bold; }

.info { margin-top: 10px; }

.title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.title {
  font-size: 0.9rem;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.secondary-titles-badge {
  font-size: 0.7rem;
  color: var(--text-muted, #aaaaaa);
  background: rgba(255, 255, 255, 0.08);
  padding: 1px 5px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.genre { font-size: 0.75rem; color: #aaaaaa; margin-top: 4px; }
.badge-completed { font-size: 0.65rem; padding: 2px 6px; border-radius: 10px; font-weight: bold; color: #fff; display: inline-block; background-color: #4CAF50; margin-top: 6px; }

.stats-row { display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.75rem; color: #cccccc; margin-top: 6px; align-items: center; }
.stats-row span { display: flex; align-items: center; gap: 2px; }
.user-rating { color: #ffcc00; font-weight: bold; }
</style>
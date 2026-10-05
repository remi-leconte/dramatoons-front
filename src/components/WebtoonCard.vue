<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { COVER_BASE_URL } from '../services/api'
import StatusSelect from './StatusSelect.vue'

const props = defineProps({
  webtoon: {
    type: Object,
    required: true
  }
})
const emit = defineEmits(['status-change', 'bookmark-change'])

const authStore = useAuthStore()
const hasImageError = ref(false)
const isEditingBookmark = ref(false)
const bookmarkInput = ref<number | null>(null)

const tempBookmark = ref<number | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

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

const currentBookmark = computed(() => {
  if (tempBookmark.value !== null) {
    return tempBookmark.value
  }
  const bm = props.webtoon.userProgress?.bookmark
  return bm !== null && bm !== undefined && !isNaN(Number(bm)) ? Number(bm) : 0
})

watch(() => props.webtoon.userProgress?.bookmark, () => {
  if (debounceTimer === null) {
    tempBookmark.value = null
  }
})

const debouncedEmitBookmark = (value: number) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    emit('bookmark-change', value)
    debounceTimer = null
    tempBookmark.value = null
  }, 500)
}

const updateBookmark = (delta: number) => {
  const nextValue = Math.max(0, currentBookmark.value + delta)
  tempBookmark.value = nextValue
  debouncedEmitBookmark(nextValue)
}

const startEditingBookmark = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  bookmarkInput.value = currentBookmark.value
  isEditingBookmark.value = true
}

const saveBookmarkInput = () => {
  isEditingBookmark.value = false
  if (bookmarkInput.value !== null && !isNaN(bookmarkInput.value)) {
    const nextValue = Math.max(0, Number(bookmarkInput.value))
    tempBookmark.value = nextValue
    debouncedEmitBookmark(nextValue)
  }
}
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
        <!-- Badge & Contrôles rapides du Bookmark -->
        <div 
          v-if="authStore.isAuthenticated" 
          class="quick-actions-container"
          @click.stop
        >
          <div v-if="isEditingBookmark" class="bookmark-edit-wrapper">
            <input 
              type="number" 
              v-model.number="bookmarkInput"
              min="0"
              class="quick-bookmark-input"
              @keyup.enter="saveBookmarkInput"
              @blur="saveBookmarkInput"
              v-focus
            >
          </div>
          <div v-else class="quick-chapter-controls">
            <button 
              type="button" 
              class="quick-btn" 
              title="-1 chapitre"
              :disabled="currentBookmark <= 0"
              @click.stop="updateBookmark(-1)"
            >
              -
            </button>
            <span 
              class="chapter-badge"
              title="Cliquer pour modifier"
              @click.stop="startEditingBookmark"
            >
              Chap. {{ currentBookmark }}
            </span>
            <button 
              type="button" 
              class="quick-btn" 
              title="+1 chapitre"
              @click.stop="updateBookmark(1)"
            >
              +
            </button>
          </div>
        </div>
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

.poster-wrapper { position: relative; aspect-ratio: 2 / 3; box-shadow: 0 10px 20px rgba(0,0,0,0.5); overflow: hidden; border-radius: 4px; }
.poster-wrapper img { width: 100%; height: 100%; object-fit: cover; }

.grid-select-position { position: absolute; top: 8px; right: 8px; z-index: 20; }

.overlay { 
  position: absolute; 
  bottom: 0; 
  left: 0; 
  right: 0; 
  padding: 8px; 
  background: linear-gradient(transparent, rgba(0,0,0,0.85)); 
  border-radius: 0 0 4px 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.quick-actions-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.quick-chapter-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.chapter-badge { 
  background: #e50914; 
  font-size: 0.7rem; 
  padding: 2px 6px; 
  border-radius: 2px; 
  font-weight: bold; 
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.chapter-badge:hover {
  background: #b80710;
}

.quick-btn {
  opacity: 0;
  visibility: hidden;
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid var(--border-input, #383838);
  color: #ffffff;
  border-radius: 3px;
  width: 20px;
  height: 20px;
  font-size: 0.75rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s ease, visibility 0.2s ease, background-color 0.2s ease;
}

.poster-wrapper:hover .quick-btn {
  opacity: 1;
  visibility: visible;
}

.quick-btn:hover:not(:disabled) {
  background: var(--primary-red, #e50914);
  border-color: var(--primary-red, #e50914);
}

.quick-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.bookmark-edit-wrapper {
  display: flex;
  align-items: center;
}

.quick-bookmark-input {
  width: 60px;
  height: 22px;
  background: #181818;
  border: 1px solid var(--primary-red, #e50914);
  color: #fff;
  border-radius: 3px;
  font-size: 0.75rem;
  padding: 0 4px;
  text-align: center;
  outline: none;
}

.quick-bookmark-input::-webkit-outer-spin-button,
.quick-bookmark-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.quick-bookmark-input {
  -moz-appearance: textfield;
}

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
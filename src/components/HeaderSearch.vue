// Gère la Recherche rapide.
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Webtoon, HydraCollection, ProgressState } from '@/types'
import api, { COVER_BASE_URL } from '../services/api'

const emit = defineEmits<{
  (e: 'selectWebtoon', webtoon: Webtoon): void
}>()

const searchInput = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const results = ref<Webtoon[]>([])
const loading = ref(false)
const isOpen = ref(false)
const searchContainer = ref<HTMLElement | null>(null)

let debounceTimeout: ReturnType<typeof setTimeout> | null = null

const handleInput = () => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  
  if (!searchInput.value.trim()) {
    results.value = []
    isOpen.value = false
    loading.value = false
    return
  }

  loading.value = true
  isOpen.value = true

  debounceTimeout = setTimeout(async () => {
    try {
      const { data } = await api.get<HydraCollection<Webtoon>>('/webtoons', {
        params: {
          title: searchInput.value.trim(),
          mode: 'search'
        }
      })
      results.value = data['hydra:member'] ?? data.member ?? []
    } catch (error) {
      console.error('Erreur lors de la recherche dans le header :', error)
      results.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

const clearSearch = () => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  searchInput.value = ''
  results.value = []
  isOpen.value = false
  loading.value = false
}

const selectItem = (webtoon: Webtoon) => {
  emit('selectWebtoon', webtoon)
  clearSearch()
}

const getCoverUrl = (imagePath?: string) => {
  if (!imagePath) return null
  return `${COVER_BASE_URL}${imagePath}`
}

const getFrenchState = (state?: ProgressState | null): string => {
  switch (state) {
    case 'reading': return 'En cours'
    case 'pause': return 'En pause'
    case 'break': return 'Pas intéressé'
    case 'completed': return 'Terminé'
    default: return ''
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (searchContainer.value && !searchContainer.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

// Raccourci Ctrl+K conservé en tâche de fond
const handleGlobalKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    inputRef.value?.focus()
  } else if (e.key === 'Escape' && isOpen.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <div ref="searchContainer" class="header-search-wrapper">
    <div class="search-input-container" :class="{ 'is-active': isOpen }">
      <input
        ref="inputRef"
        v-model="searchInput"
        type="text"
        placeholder="Recherche rapide..."
        class="header-search-input"
        @input="handleInput"
        @focus="searchInput.trim() ? (isOpen = true) : null"
      />

      <button
        v-if="searchInput"
        type="button"
        class="clear-btn"
        title="Effacer"
        @click="clearSearch"
      >
        ✕
      </button>
    </div>

    <Transition name="search-dropdown-anim">
      <div v-if="isOpen" class="search-results-dropdown glass-panel">
        <div v-if="loading" class="search-state-message">
          <span class="pulse-loader"></span>
          Recherche en cours...
        </div>

        <div v-else-if="results.length === 0" class="search-state-message">
          Aucun résultat pour « {{ searchInput }} »
        </div>

        <div v-else class="results-list">
          <div
            v-for="webtoon in results"
            :key="webtoon.id"
            class="result-item"
            @click="selectItem(webtoon)"
          >
            <img
              v-if="webtoon.image"
              :src="getCoverUrl(webtoon.image)!"
              :alt="webtoon.title.title"
              class="result-cover"
            />
            <div v-else class="result-cover cover-placeholder">
              <span class="placeholder-icon">📖</span>
            </div>

            <div class="result-info">
              <span class="result-title">{{ webtoon.title.title }}</span>
              <div v-if="webtoon.userProgress" class="result-status">
                <span v-if="webtoon.userProgress.rate !== null && webtoon.userProgress.rate !== undefined">
                  ★ {{ webtoon.userProgress.rate }}/10
                </span>
                <span v-if="webtoon.userProgress.bookmark">
                  Ch. {{ webtoon.userProgress.bookmark }}
                </span>
                <span v-if="webtoon.userProgress.state">
                  {{ getFrenchState(webtoon.userProgress.state) }}
                </span>
              </div>
            </div>

            <span class="hover-arrow">→</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.header-search-wrapper {
  position: relative;
  flex: 1 1 200px;
  min-width: 180px;
  max-width: 450px;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border-input);
  border-radius: 20px;
  padding: 0 10px 0 14px;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
}

.search-input-container:hover {
  border-color: #555;
}

.search-input-container.is-active,
.search-input-container:focus-within {
  border-color: var(--primary-red);
  box-shadow: 0 0 12px rgba(229, 9, 20, 0.25);
  background-color: #1e1e1e;
}

.header-search-input {
  width: 100%;
  height: 36px;
  background: transparent;
  border: none;
  color: var(--text-main);
  font-size: 0.85rem;
  outline: none;
}

.clear-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.75rem;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease, transform 0.2s ease;
}

.clear-btn:hover {
  color: var(--text-main);
  transform: scale(1.15);
}

.search-results-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  border-radius: var(--radius-lg);
  z-index: 1000;
  max-height: 380px;
  overflow-y: auto;
}

.search-state-message {
  padding: 14px;
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: center;
  font-style: italic;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pulse-loader {
  width: 8px;
  height: 8px;
  background-color: var(--primary-red);
  border-radius: 50%;
  animation: pulse 0.8s ease-in-out infinite alternate;
}

@keyframes pulse {
  from { opacity: 0.3; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1.2); }
}

.results-list {
  display: flex;
  flex-direction: column;
  padding: 4px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.result-item:hover {
  background-color: rgba(255, 255, 255, 0.07);
  transform: translateX(2px);
}

.result-cover {
  width: 36px;
  height: 48px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background-color: var(--bg-card);
  flex-shrink: 0;
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  flex: 1;
}

.result-title {
  color: var(--text-main);
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hover-arrow {
  color: var(--primary-red);
  font-weight: bold;
  font-size: 0.9rem;
  opacity: 0;
  transform: translateX(-6px);
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.result-item:hover .hover-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* Animations d'ouverture/fermeture du dropdown */
.search-dropdown-anim-enter-active,
.search-dropdown-anim-leave-active {
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.search-dropdown-anim-enter-from,
.search-dropdown-anim-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

@media (max-width: 850px) {
  .header-search-wrapper {
    order: 3;
    flex: 1 1 100%;
    max-width: 100%;
  }
}
</style>
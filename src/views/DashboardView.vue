<script setup lang="ts">
import type { Webtoon, HydraCollection } from '@/types'
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

import { useWebtoonSearch } from '../composables/dashboard/useWebtoonSearch.ts'
import { useWebtoonProgress } from '../composables/dashboard/useWebtoonProgress.ts'

import WebtoonCard from '../components/dashboard/WebtoonCard.vue'
import WebtoonModal from '../components/dashboard/WebtoonModal.vue'
import DashboardHeader from '../components/dashboard/DashboardHeader.vue'
import DashboardFilterBar from '../components/dashboard/DashboardFilterBar.vue'
import ScrollToTopButton from '../components/dashboard/ScrollToTopButton.vue'

const route = useRoute()
const authStore = useAuthStore()

const {
  activeTab, title, includedStatuses, excludedStatuses,
  sortBy, sortOrder, currentSortOptions,
  cycleStatusFilter, toggleSort, buildQueryUrl, initPreferences
} = useWebtoonSearch()

const { changeStatus, changeBookmark } = useWebtoonProgress()

const webtoons = ref<Webtoon[]>([])
const loading = ref(false)
const nextPageUrl = ref<string | null>('/webtoons')
const observerTarget = ref<HTMLElement | null>(null)
const selectedWebtoon = ref<Webtoon | null>(null)
const isModalOpen = ref(false)
const isInitializing = ref(true)

const fetchWebtoons = async () => {
  if (loading.value || !nextPageUrl.value) return
  loading.value = true
  try {
    const { data } = await api.get<HydraCollection<Webtoon>>(nextPageUrl.value)
    webtoons.value.push(...(data['hydra:member'] ?? data.member ?? []))
    const view = data['hydra:view'] || data.view
    nextPageUrl.value = view?.['hydra:next'] || view?.next || null
  } catch (error) {
    console.error(error)
    nextPageUrl.value = null
  } finally {
    loading.value = false
    checkAndLoadMore()
  }
}

const resetAndFetchWebtoons = async () => {
  webtoons.value = []
  nextPageUrl.value = buildQueryUrl()
  await fetchWebtoons()
}

const checkAndLoadMore = () => {
  if (!observerTarget.value || !nextPageUrl.value || loading.value) return
  nextTick(() => {
    if (observerTarget.value!.getBoundingClientRect().top <= window.innerHeight) {
      fetchWebtoons()
    }
  })
}

const selectTab = (tab: 'bibliotheque' | 'catalogue') => {
  if (activeTab.value === tab) return
  activeTab.value = tab
  resetAndFetchWebtoons()
}

const openModal = (webtoon: Webtoon | null = null) => { selectedWebtoon.value = webtoon; isModalOpen.value = true }
const closeModal = () => { selectedWebtoon.value = null; isModalOpen.value = false }
const handleModalSave = (updated: Webtoon) => {
  const index = webtoons.value.findIndex(w => w.id === updated.id)
  if (index !== -1) webtoons.value[index] = updated
  selectedWebtoon.value = updated
}
const handleWebtoonCreated = (created: Webtoon) => { webtoons.value.unshift(created); selectedWebtoon.value = created }
const handleModalDelete = (id: number) => { webtoons.value = webtoons.value.filter(item => item.id !== id) }

watch([title, includedStatuses, excludedStatuses, sortBy, sortOrder], async () => {
  if (isInitializing.value) return
  await resetAndFetchWebtoons()
}, { deep: true })

watch(() => route.query.title, (newTitle) => {
  const parsed = (Array.isArray(newTitle) ? newTitle[0] : newTitle) || ''
  if (title.value !== parsed) title.value = parsed
})

let observer: IntersectionObserver | null = null

onMounted(async () => {
  isInitializing.value = true
  await authStore.fetchUserProfile()
  initPreferences()
  
  const queryTitle = route.query.title
  title.value = (Array.isArray(queryTitle) ? queryTitle[0] : queryTitle) || ''
  resetAndFetchWebtoons()
  isInitializing.value = false

  observer = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) fetchWebtoons()
  }, { threshold: 0.1 })

  if (observerTarget.value) observer.observe(observerTarget.value)
})

onUnmounted(() => { observer?.disconnect() })
</script>

<template>
  <main class="content" :class="{ 'content-dimmed': isModalOpen }">
    <DashboardHeader
      v-if="authStore.isAuthenticated"
      :active-tab="activeTab"
      :is-admin="authStore.isAdmin"
      @select-tab="selectTab"
      @open-create-modal="openModal(null)"
    />

    <DashboardFilterBar
      v-if="authStore.isAuthenticated"
      :included-statuses="includedStatuses"
      :excluded-statuses="excludedStatuses"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      :sort-options="currentSortOptions"
      @cycle-status="cycleStatusFilter"
      @toggle-sort="toggleSort"
    />
    
    <div class="webtoon-grid">
      <WebtoonCard 
        v-for="(webtoon, index) in webtoons" 
        :key="webtoon.id || index"
        :webtoon="webtoon"
        @click="openModal(webtoon)"
        @status-change="(newState) => changeStatus(webtoon, newState)"
        @bookmark-change="(newBookmark) => changeBookmark(webtoon, newBookmark)"
      />
    </div>

    <div ref="observerTarget" class="pagination-trigger">
      <div v-if="loading" class="loader-infinite">Chargement des prochains webtoons...</div>
      <p v-if="!nextPageUrl && webtoons.length > 0" class="end-message">
        Fin du catalogue.
      </p>
    </div>
  </main>

  <ScrollToTopButton />

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
.content {
  padding: 2rem 5%;
  transition: filter 0.3s ease, opacity 0.3s ease;
}

.content-dimmed {
  filter: blur(4px);
  opacity: 0.3;
  pointer-events: none;
}

.webtoon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 20px 12px;
}

@media (min-width: 480px) {
  .webtoon-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 25px 15px;
  }
}

.pagination-trigger {
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.loader-infinite,
.end-message {
  color: #666;
  font-weight: bold;
  font-size: 0.9rem;
  font-style: italic;
}
</style>
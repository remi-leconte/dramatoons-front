<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ProgressState, SortByOption, SortOrderOption } from '@/types'

interface SortOption {
  key: SortByOption
  label: string
  defaultOrder: SortOrderOption
}

interface StatusPill {
  key: ProgressState
  label: string
}

const props = defineProps<{
  title: string
  includedStatuses: ProgressState[]
  excludedStatuses: ProgressState[]
  sortBy: SortByOption
  sortOrder: SortOrderOption
  sortOptions: SortOption[]
  isFilterVisible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:title', value: string): void
  (e: 'cycleStatus', key: ProgressState): void
  (e: 'toggleSort', key: SortByOption, defaultOrder: SortOrderOption): void
  (e: 'toggleVisibility'): void
}>()

const STATUS_PILLS: StatusPill[] = [
  { key: 'reading', label: 'En cours' },
  { key: 'pause', label: 'En pause' },
  { key: 'break', label: 'Pas intéressé' },
  { key: 'completed', label: 'Terminé' }
]

const searchInput = ref(props.title)
let debounceTimeout: ReturnType<typeof setTimeout> | null = null

watch(() => props.title, (newVal) => {
  if (newVal !== searchInput.value) {
    searchInput.value = newVal
  }
})

const handleInput = () => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    emit('update:title', searchInput.value)
  }, 500)
}

const clearSearch = () => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  searchInput.value = ''
  emit('update:title', '')
}
</script>

<template>
  <div class="filter-wrapper">
    <Transition name="fade-slide">
      <button
        v-if="!props.isFilterVisible"
        type="button"
        class="floating-show-filters-btn"
        @click="emit('toggleVisibility')"
        title="Afficher les filtres"
      >
        <span class="floating-text">Filtres &gt;</span>
        <span v-if="props.includedStatuses.length > 0 || props.excludedStatuses.length > 0 || props.title" class="filter-badge-dot"></span>
      </button>
    </Transition>

    <div class="filter-bar-container glass-panel" :class="{ 'is-hidden': !props.isFilterVisible }">
      <div class="filter-bar-inner">
        <div class="filter-top-row">
          <div class="filter-group filter-left">
            <span class="filter-label">Filtrer par état :</span>
            <div class="pills-group">
              <button
                v-for="pill in STATUS_PILLS"
                :key="pill.key"
                type="button"
                class="filter-pill"
                :class="{
                  'is-included': props.includedStatuses.includes(pill.key),
                  'is-excluded': props.excludedStatuses.includes(pill.key)
                }"
                @click="emit('cycleStatus', pill.key)"
              >
                <span class="pill-icon">
                  <template v-if="props.includedStatuses.includes(pill.key)">✓</template>
                  <template v-else-if="props.excludedStatuses.includes(pill.key)">✕</template>
                </span>
                <span>{{ pill.label }}</span>
              </button>
            </div>
          </div>

          <div class="filter-group filter-right">
            <span class="filter-label">Trier par :</span>
            <div class="pills-group">
              <button
                v-for="option in props.sortOptions"
                :key="option.key"
                type="button"
                class="filter-pill"
                :class="{ 'is-active': props.sortBy === option.key }"
                @click="emit('toggleSort', option.key, option.defaultOrder)"
              >
                <span>{{ option.label }}</span>
                <span v-if="props.sortBy === option.key" class="sort-arrow">
                  {{ props.sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div class="filter-search">
          <div class="search-input-wrapper">
            <input
              v-model="searchInput"
              type="text"
              placeholder="Rechercher par titre..."
              class="search-input"
              @input="handleInput"
            />
            <button
              v-if="searchInput"
              type="button"
              class="clear-search-btn"
              title="Effacer la recherche"
              @click="clearSearch"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        class="outer-hide-btn"
        @click="emit('toggleVisibility')"
        title="Cacher les filtres"
      >
        <span>&lt;</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.filter-wrapper {
  position: relative;
}

.filter-bar-container {
  position: fixed;
  left: 0;
  top: 100px;
  z-index: 100;
  max-width: 90%;
  width: 100%;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: none;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease;
  transform: translateX(0);
  opacity: 1;
}

.filter-bar-container.is-hidden {
  transform: translateX(-100%);
  opacity: 0;
  pointer-events: none;
}

.filter-bar-inner {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  position: relative;
}

.filter-top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-left {
  justify-content: flex-start;
}

.filter-search {
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  background: #252525;
  border: 1px solid #383838;
  color: #fff;
  padding: 6px 32px 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: #e50914;
}

.clear-search-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  transition: color 0.2s ease;
}

.clear-search-btn:hover {
  color: #fff;
}

.filter-label {
  font-size: 0.85rem;
  color: #888;
  white-space: nowrap;
  font-weight: 500;
}

.pills-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-pill {
  background: #252525;
  border: 1px solid #383838;
  color: #aaa;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.82rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  user-select: none;
}

.filter-pill:hover {
  border-color: #666;
  color: #fff;
}

.filter-pill.is-included {
  background-color: rgba(76, 175, 80, 0.2);
  border-color: #4caf50;
  color: #4caf50;
  font-weight: 600;
}

.filter-pill.is-excluded {
  background-color: rgba(229, 9, 20, 0.2);
  border-color: #e50914;
  color: #e50914;
  font-weight: 600;
}

.filter-pill.is-active {
  background-color: #e50914;
  border-color: #e50914;
  color: #ffffff;
  font-weight: 600;
}

.pill-icon {
  font-weight: bold;
  font-size: 0.8rem;
}

.sort-arrow {
  font-size: 0.85rem;
  font-weight: bold;
}

.outer-hide-btn {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  transform: translateX(100%);
  background: rgba(22, 22, 22, 0.92);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: none;
  color: #aaa;
  padding: 0 16px;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 6px 0 20px rgba(0, 0, 0, 0.6);
  transition: all 0.2s ease;
}

.outer-hide-btn:hover {
  background-color: #e50914;
  border-color: #e50914;
  color: #fff;
}

.floating-show-filters-btn {
  position: fixed;
  left: 0;
  top: 100px;
  z-index: 90;
  background-color: #1a1a1a;
  color: #fff;
  border: 1px solid #383838;
  border-left: none;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  padding: 10px 14px 10px 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 4px 4px 15px rgba(0, 0, 0, 0.5);
  transition: all 0.25s ease;
}

.floating-show-filters-btn:hover {
  background-color: #e50914;
  border-color: #e50914;
  padding-left: 14px;
}

.filter-badge-dot {
  width: 8px;
  height: 8px;
  background-color: #e50914;
  border-radius: 50%;
  display: inline-block;
  margin-left: 2px;
}

.floating-show-filters-btn:hover .filter-badge-dot {
  background-color: #fff;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
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
}>()

const emit = defineEmits<{
  (e: 'update:title', value: string): void
  (e: 'cycleStatus', key: ProgressState): void
  (e: 'toggleSort', key: SortByOption, defaultOrder: SortOrderOption): void
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
  <div class="filter-bar">
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
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
  justify-content: space-between;
  background-color: #1a1a1a;
  border: 1px solid #282828;
  padding: 12px 18px;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-left {
  justify-content: flex-start;
}

.filter-search {
  flex: 1 1 100%;
  display: flex;
  justify-content: flex-start;
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
  max-width: 100%;
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

.filter-right {
  justify-content: flex-end;
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

@media (max-width: 900px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-left {
    width: 100%;
    justify-content: flex-start;
  }

  .filter-right {
    width: 100%;
    justify-content: flex-start;
  }

  .filter-search {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import type { ProgressState, SortByOption, SortOrderOption } from '@/types'

const LOCAL_STORAGE_KEY = 'dramatoons_search_prefs'

export function useWebtoonSearch() {
    const route = useRoute()

    const activeTab = ref<'bibliotheque' | 'catalogue'>('bibliotheque')
    const rawTitle = Array.isArray(route.query.title) ? route.query.title[0] : route.query.title
    const title = ref<string>(rawTitle || '')

    const includedStatuses = ref<ProgressState[]>([])
    const excludedStatuses = ref<ProgressState[]>([])

    const sortBy = ref<SortByOption>('added')
    const sortOrder = ref<SortOrderOption>('desc')
    const isFilterVisible = ref<boolean>(true)

    const currentSortOptions = computed(() => {
        const addedLabel = activeTab.value === 'bibliotheque' ? 'Modification' : 'Dernier ajout'
        return [
            { key: 'added' as SortByOption, label: addedLabel, defaultOrder: 'desc' as SortOrderOption },
            { key: 'title' as SortByOption, label: 'Titre', defaultOrder: 'asc' as SortOrderOption },
            { key: 'user_rating' as SortByOption, label: 'Ma note', defaultOrder: 'desc' as SortOrderOption },
            { key: 'rating' as SortByOption, label: 'Note moyenne', defaultOrder: 'desc' as SortOrderOption }
        ]
    })

    const savePreferences = () => {
        const prefs = {
            includedStatuses: includedStatuses.value,
            excludedStatuses: excludedStatuses.value,
            sortBy: sortBy.value,
            sortOrder: sortOrder.value,
            isFilterVisible: isFilterVisible.value
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prefs))
    }

    const initPreferences = () => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
            if (saved) {
                const prefs = JSON.parse(saved)
                includedStatuses.value = Array.isArray(prefs.includedStatuses) ? prefs.includedStatuses : []
                excludedStatuses.value = Array.isArray(prefs.excludedStatuses) ? prefs.excludedStatuses : []
                sortBy.value = prefs.sortBy || 'added'
                sortOrder.value = prefs.sortOrder || 'desc'
                if (typeof prefs.isFilterVisible === 'boolean') {
                    isFilterVisible.value = prefs.isFilterVisible
                }
            }
        } catch (e) {
            console.error('Erreur lors de la lecture du cache local', e)
        }
    }

    initPreferences()

    const cycleStatusFilter = (key: ProgressState) => {
        const isIncluded = includedStatuses.value.includes(key)
        const isExcluded = excludedStatuses.value.includes(key)

        if (!isIncluded && !isExcluded) {
            includedStatuses.value.push(key)
        } else if (isIncluded) {
            includedStatuses.value = includedStatuses.value.filter(s => s !== key)
            excludedStatuses.value.push(key)
        } else {
            excludedStatuses.value = excludedStatuses.value.filter(s => s !== key)
        }
        savePreferences()
    }

    const toggleSort = (key: SortByOption, defaultOrder: SortOrderOption) => {
        if (sortBy.value === key) {
            sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
        } else {
            sortBy.value = key
            sortOrder.value = defaultOrder
        }
        savePreferences()
    }

    const toggleFilterVisibility = () => {
        isFilterVisible.value = !isFilterVisible.value
        savePreferences()
    }

    const buildQueryUrl = (): string => {
        const queryParams = new URLSearchParams()
        queryParams.append('mode', activeTab.value)
        if (title.value) queryParams.append('title', title.value)
        includedStatuses.value.forEach(s => queryParams.append('status[]', s))
        excludedStatuses.value.forEach(s => queryParams.append('exclude_status[]', s))
        queryParams.append('sortBy', sortBy.value)
        queryParams.append('sortOrder', sortOrder.value)

        return `/webtoons?${queryParams.toString()}`
    }

    return {
        activeTab,
        title,
        includedStatuses,
        excludedStatuses,
        sortBy,
        sortOrder,
        isFilterVisible,
        currentSortOptions,
        cycleStatusFilter,
        toggleSort,
        toggleFilterVisibility,
        buildQueryUrl,
        initPreferences
    }
}
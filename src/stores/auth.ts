import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export interface User {
  id: number
  login: string
  roles: string[]
  searchParameters: {
    status: string | null
    sortBy: string | null
    sortOrder: string | null
    itemsPerPage: number | null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const userId = ref<number | null>(localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null)
  const login = ref<string | null>(localStorage.getItem('login'))
  const roles = ref<string[]>(localStorage.getItem('roles') ? JSON.parse(localStorage.getItem('roles')!) : [])

  const preferences = ref({
    searchStatus: '',
    searchSortBy: 'added',
    searchSortOrder: 'desc',
    searchItemsPerPage: 20
  })

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => roles.value.includes('ROLE_ADMIN'))

  function setUserSession(newToken: string, newRefreshToken: string, user: User) {
    token.value = newToken
    refreshToken.value = newRefreshToken
    userId.value = user.id,
      login.value = user.login,
      roles.value = user.roles,

      preferences.value = {
        searchStatus: user.searchParameters.status || '',
        searchSortBy: user.searchParameters.sortBy || 'added',
        searchSortOrder: user.searchParameters.sortOrder || 'desc',
        searchItemsPerPage: user.searchParameters.itemsPerPage || 20
      }

    localStorage.setItem('token', newToken)
    localStorage.setItem('refreshToken', newRefreshToken)
    localStorage.setItem('userId', user.id.toString())
    localStorage.setItem('login', user.login)
    localStorage.setItem('roles', JSON.stringify(user.roles))
  }

  async function fetchUserProfile() {
    if (!userId.value) return
    try {
      const response = await api.get(`/users/${userId.value}`)
      const user = response.data
      preferences.value = {
        searchStatus: user.searchStatus || '',
        searchSortBy: user.searchSortBy || 'added',
        searchSortOrder: user.searchSortOrder || 'desc',
        searchItemsPerPage: user.searchItemsPerPage || 20
      }
    } catch (error) {
      console.error(error)
    }
  }

  async function savePreferences(newPreferences: Partial<typeof preferences.value>) {
    preferences.value = { ...preferences.value, ...newPreferences }
    if (!userId.value) return

    try {
      await api.patch(`/users/${userId.value}`, newPreferences, {
        headers: { 'Content-Type': 'application/merge-patch+json' }
      })
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences :', error)
    }
  }


  function updateToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function logout() {
    token.value = null
    refreshToken.value = null
    userId.value = null
    login.value = null
    roles.value = []

    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('login')
    localStorage.removeItem('roles')
  }

  const user = computed(() => {
    if (!userId.value || !login.value) return null
    return {
      id: userId.value,
      login: login.value,
      roles: roles.value
    }
  })

  return {
    user,
    token,
    refreshToken,
    userId,
    login,
    roles,
    preferences,
    isAuthenticated,
    isAdmin,
    fetchUserProfile,
    setUserSession,
    savePreferences,
    updateToken,
    logout
  }
})
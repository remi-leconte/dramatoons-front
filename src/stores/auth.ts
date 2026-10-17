import type { User } from '@/types'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

function getStoredNumber(key: string): number | null {
  const value = localStorage.getItem(key)
  if (!value || value === 'undefined' || value === 'null') return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

function getStoredJson<T>(key: string, fallback: T): T {
  const value = localStorage.getItem(key)
  if (!value || value === 'undefined' || value === 'null') return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const userId = ref<number | null>(getStoredNumber('userId'))
  const login = ref<string | null>(localStorage.getItem('login'))
  const roles = ref<string[]>(getStoredJson<string[]>('roles', []))

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => roles.value.includes('ROLE_ADMIN'))

  function setUserSession(newToken: string, newRefreshToken: string, user: User) {
    token.value = newToken
    refreshToken.value = newRefreshToken
    userId.value = user.id ?? null
    login.value = user.login
    roles.value = user.roles

    localStorage.setItem('token', newToken)
    localStorage.setItem('refreshToken', newRefreshToken)

    if (user.id !== undefined && user.id !== null) {
      localStorage.setItem('userId', user.id.toString())
    } else {
      localStorage.removeItem('userId')
    }

    localStorage.setItem('login', user.login)
    localStorage.setItem('roles', JSON.stringify(user.roles))
  }

  async function fetchUserProfile() {
    if (!userId.value) return
    try {
      await api.get<User>(`/users/${userId.value}`)
    } catch (error) {
      console.error('Erreur lors du chargement du profil :', error)
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

  const user = computed<User | null>({
    get() {
      if (!userId.value || !login.value) return null
      return {
        id: userId.value,
        login: login.value,
        email: '',
        roles: roles.value,
        verified: false,
        publish: false,
        lastLogin: null
      }
    },
    set(newUser) {
      if (!newUser) {
        logout()
      }
    }
  })

  return {
    user,
    token,
    refreshToken,
    userId,
    login,
    roles,
    isAuthenticated,
    isAdmin,
    fetchUserProfile,
    setUserSession,
    updateToken,
    logout
  }
})
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // Récupération des données stockées au démarrage
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const userId = ref<number | null>(localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null)
  const login = ref<string | null>(localStorage.getItem('login'))
  const roles = ref<string[]>(localStorage.getItem('roles') ? JSON.parse(localStorage.getItem('roles')!) : [])

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => roles.value.includes('ROLE_ADMIN'))

  // Action globale pour enregistrer la session après un login réussi
  function setUserSession(newToken: string, newRefreshToken: string, newUserId: number, newLogin: string, newRoles: string[]) {
    token.value = newToken
    refreshToken.value = newRefreshToken
    userId.value = newUserId
    login.value = newLogin
    roles.value = newRoles

    localStorage.setItem('token', newToken)
    localStorage.setItem('refreshToken', newRefreshToken)
    localStorage.setItem('userId', newUserId.toString())
    localStorage.setItem('login', newLogin)
    localStorage.setItem('roles', JSON.stringify(newRoles))
  }

  function updateToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  // Action pour déconnecter l'utilisateur (nettoyage complet)
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

  return {
    token,
    refreshToken,
    userId,
    login,
    roles,
    isAuthenticated,
    isAdmin,
    setUserSession,
    updateToken,
    logout
  }
})
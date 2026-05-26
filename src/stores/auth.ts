import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // On tente de récupérer le token stocké au démarrage de l'application
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<any | null>(null)

  // Getter pour savoir facilement si l'utilisateur est connecté
  const isAuthenticated = computed(() => !!token.value)

  // Action pour enregistrer le token après un login réussi
  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  // Action pour déconnecter l'utilisateur
  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  return {
    token,
    user,
    isAuthenticated,
    setToken,
    logout
  }
})
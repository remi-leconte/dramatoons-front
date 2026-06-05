import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import router from '../router'

const api = axios.create({
  baseURL: 'http://dramatoons.api.local:8081',
  headers: {
    'Content-Type': 'application/json',
  }
})

// L'intercepteur : il s'exécute AVANT chaque requête sortante
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    
    // Si un token existe dans le store Pinia, on l'ajoute dans les headers Bearer
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur pour gérer les erreurs globales (ex: token expiré)
api.interceptors.response.use(
  (response) => response,
  async (error) => {

    console.log('--- ERREUR INTERCEPTÉE ---', error.response)
    
    const authStore = useAuthStore()
    const originalRequest = error.config

    // 💡 On vérifie le statut 401 ET le message d'expiration renvoyé par ton API
    const isExpiredToken = error.response && 
                           error.response.status === 401 && 
                           error.response.data?.message === 'Expired JWT Token'
                           
    if (isExpiredToken && !originalRequest._retry) {
      originalRequest._retry = true // Marque la requête pour éviter une boucle infinie

      if (authStore.refreshToken) {
        try {
          // 💡 Appel direct au WS de rafraîchissement
          const response = await axios.post('http://dramatoons.api.local:8081/token/refresh', {
            refresh_token: authStore.refreshToken
          })

          const newToken = response.data.token

          // 💡 Met à jour Pinia et le localStorage
          authStore.updateToken(newToken)

          // 💡 Rejoue la requête initiale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)

        } catch (refreshError) {
          authStore.logout()
          router.push('/')

          return Promise.reject(refreshError)
        }
      }
    }

    // Déconnexion automatique si c'est une vraie 401 (mauvais token) ou si aucun refresh n'est possible
    if (error.response && error.response.status === 401) {
      authStore.logout()
    }
    
    return Promise.reject(error)
  }
)

export default api
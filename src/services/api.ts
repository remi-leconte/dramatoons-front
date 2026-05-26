import axios from 'axios'
import { useAuthStore } from '../stores/auth'

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
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore()
      authStore.logout() // Déconnexion automatique si le token est invalide/expiré
    }
    return Promise.reject(error)
  }
)

export default api
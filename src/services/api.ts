import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import router from '../router'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}`,
  headers: {
    'Accept': 'application/ld+json',
    'Content-Type': 'application/ld+json',
    // Injection de la Basic Auth pour le Staging si la variable existe
    ...(import.meta.env.VITE_STAGING_AUTH && {
      'X-Staging-Auth': `Basic ${btoa(import.meta.env.VITE_STAGING_AUTH)}`
    })
  }
})

export const COVER_BASE_URL = `${api.defaults.baseURL}/upload/cover/`;

let isRefreshingFailed = false

api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {

    //console.log('--- ERREUR INTERCEPTÉE ---', error.response)
    
    const authStore = useAuthStore()
    const originalRequest = error.config
    const isExpiredToken = error.response && 
                           error.response.status === 401 && 
                           error.response.data?.message === 'Expired JWT Token'
                           
    if (isExpiredToken && !originalRequest._retry && !isRefreshingFailed) {
      originalRequest._retry = true // Marque la requête pour éviter une boucle infinie

      if (authStore.refreshToken) {
        try {
          const response = await axios.post(`${api.defaults.baseURL}/token/refresh`, {
            refresh_token: authStore.refreshToken
          })
          const newToken = response.data.token

          authStore.updateToken(newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`

          return api(originalRequest)

        } catch (refreshError) {
          isRefreshingFailed = true
          authStore.logout()
          router.push('/')

          return Promise.reject(refreshError)
        }
      }
    }

    if (error.response && error.response.status === 401) {
      authStore.logout()
    }
    
    return Promise.reject(error)
  }
)

export default api
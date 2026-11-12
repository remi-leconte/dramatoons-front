import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import router from '../router'

const stagingHeaders = import.meta.env.VITE_STAGING_AUTH
  ? { 'X-Staging-Auth': `Basic ${btoa(import.meta.env.VITE_STAGING_AUTH)}` }
  : {}

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}`,
  headers: {
    'Accept': 'application/ld+json',
    ...stagingHeaders
  }
})

export const COVER_BASE_URL = `${api.defaults.baseURL}/upload/cover/`;

let refreshPromise: Promise<string> | null = null

// Le refresh token est à usage unique : les requêtes en 401 simultanées partagent un seul renouvellement
function refreshAccessToken(): Promise<string> {
  const authStore = useAuthStore()

  refreshPromise ??= axios
    .post<{ token: string; refresh_token: string }>(`${api.defaults.baseURL}/token/refresh`, {
      refresh_token: authStore.refreshToken
    }, { headers: stagingHeaders })
    .then((response) => {
      authStore.updateToken(response.data.token, response.data.refresh_token)
      return response.data.token
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()

    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }

    if (['post', 'put'].includes(config.method?.toLowerCase() ?? '') && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/ld+json'
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
    const authStore = useAuthStore()
    const originalRequest = error.config
    const isExpiredToken = error.response &&
      error.response.status === 401 &&
      error.response.data?.message === 'Expired JWT Token'

    if (isExpiredToken && !originalRequest._retry && authStore.refreshToken) {
      originalRequest._retry = true // Marque la requête pour éviter une boucle infinie

      try {
        const newToken = await refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${newToken}`

        return api(originalRequest)
      } catch (refreshError) {
        authStore.logout()
        router.push('/')

        return Promise.reject(refreshError)
      }
    }

    if (error.response && error.response.status === 401) {
      authStore.logout()
    }

    return Promise.reject(error)
  }
)

export default api
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  MIN_RELOAD_INTERVAL_MS,
  RELOAD_KEY,
  createPreloadErrorHandler,
  trackRequestedPath,
} from '@/services/reloadOnUpdate'

function preloadError(): Event {
  return new Event('vite:preloadError', { cancelable: true })
}

beforeEach(() => {
  sessionStorage.clear()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-18T10:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('createPreloadErrorHandler', () => {
  it('un fichier d’une ancienne version introuvable recharge l’application, sans laisser Vite lever l’erreur', () => {
    const navigate = vi.fn<() => void>()
    const event = preloadError()

    createPreloadErrorHandler(navigate)(event)

    expect(navigate).toHaveBeenCalledOnce()
    expect(event.defaultPrevented).toBe(true)
    expect(sessionStorage.getItem(RELOAD_KEY)).toBe(String(Date.now()))
  })

  it('plusieurs fichiers manquants pour une même page : un seul rechargement, et aucune erreur affichée', () => {
    const navigate = vi.fn<() => void>()
    const handler = createPreloadErrorHandler(navigate)
    const dependance = preloadError()
    const page = preloadError()

    handler(dependance)
    handler(page)

    expect(navigate).toHaveBeenCalledOnce()
    expect(dependance.defaultPrevented).toBe(true)
    expect(page.defaultPrevented).toBe(true)
  })

  it('un nouvel échec juste après un rechargement ne recharge pas en boucle : l’erreur est laissée à Vite', () => {
    createPreloadErrorHandler(vi.fn<() => void>())(preloadError())

    // Après le rechargement, la page repart avec un nouveau gestionnaire
    vi.advanceTimersByTime(MIN_RELOAD_INTERVAL_MS - 1)
    const navigate = vi.fn<() => void>()
    const event = preloadError()
    createPreloadErrorHandler(navigate)(event)

    expect(navigate).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('une nouvelle mise à jour plus tard recharge de nouveau', () => {
    createPreloadErrorHandler(vi.fn<() => void>())(preloadError())

    vi.advanceTimersByTime(MIN_RELOAD_INTERVAL_MS)
    const navigate = vi.fn<() => void>()
    createPreloadErrorHandler(navigate)(preloadError())

    expect(navigate).toHaveBeenCalledOnce()
  })

  it('sans sessionStorage (navigation privée stricte), pas de rechargement : une boucle serait indétectable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('stockage bloqué')
    })
    const navigate = vi.fn<() => void>()
    const event = preloadError()

    createPreloadErrorHandler(navigate)(event)

    expect(navigate).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })
})

describe('trackRequestedPath', () => {
  it('donne la page demandée même si son chargement échoue, pas celle encore affichée', async () => {
    vi.useRealTimers()
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<p>accueil</p>' } },
        // Fichier de l'ancienne version, absent du serveur après la mise à jour
        { path: '/privacy', component: () => Promise.reject(new Error('fichier introuvable')) },
      ],
    })
    // L'échec est voulu : sans gestionnaire, Vue Router l'affiche en avertissement
    router.onError(() => {})
    const requestedPath = trackRequestedPath(router, '/')
    await router.push('/')

    await expect(router.push('/privacy?onglet=1')).rejects.toThrow('fichier introuvable')

    expect(router.currentRoute.value.fullPath).toBe('/')
    expect(requestedPath()).toBe('/privacy?onglet=1')
  })

  it('avant toute navigation, donne l’adresse de départ', () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [] })

    expect(trackRequestedPath(router, '/admin/webtoons')()).toBe('/admin/webtoons')
  })
})

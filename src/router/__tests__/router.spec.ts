import { describe, expect, it, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'
import router from '@/router'

vi.mock('@/services/api', () => ({ default: {}, COVER_BASE_URL: '' }))

type Defilement = NonNullable<typeof router.options.scrollBehavior>
const defiler = router.options.scrollBehavior as Defilement

describe('router (pages et défilement)', () => {
  it('ouvre les mentions légales à tous, connectés ou non', () => {
    const route = router.resolve('/mentions-legales')

    expect(route.name).toBe('legal-notice')
    expect(route.meta.requiresAuth).toBeUndefined()
    expect(route.meta.guestOnly).toBeUndefined()
    expect(route.meta.roles).toBeUndefined()
  })

  it('ouvre toute page en haut, même avec Précédent, sauf un lien vers une section', () => {
    const vers = (adresse: string) => router.resolve(adresse) as unknown as RouteLocationNormalized
    const depuis = vers('/')

    expect(defiler(vers('/privacy'), depuis, null)).toEqual({ top: 0 })
    expect(defiler(vers('/'), vers('/privacy'), { left: 0, top: 900 })).toEqual({ top: 0 })
    expect(defiler(vers('/mentions-legales#retrait'), depuis, null)).toEqual({
      el: '#retrait',
      top: 20,
    })
  })
})

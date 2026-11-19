import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { createDefaultUser } from '@/types/user'
import { createDefaultWebtoon, type Webtoon } from '@/types/webtoon'
import {
  confirmLeavingUnpublished,
  losesAccessWithoutProgress,
  saveProgress,
  useWebtoonProgress,
} from '@/composables/dashboard/useWebtoonProgress'

type AppelApi = (...args: unknown[]) => Promise<unknown>

// Les tests ne contactent jamais l'API : chaque appel est simulé et vérifié
vi.mock('@/services/api', () => ({
  default: { post: vi.fn<AppelApi>(), patch: vi.fn<AppelApi>(), delete: vi.fn<AppelApi>() },
}))

const UTILISATEUR = 7
const AUTRE = 8

function webtoon(publie: boolean, createur: number): Webtoon {
  return {
    ...createDefaultWebtoon(),
    id: 5,
    publish: publie,
    creator: { ...createDefaultUser(), id: createur },
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.unstubAllGlobals()
  setActivePinia(createPinia())
  useAuthStore().userId = UTILISATEUR
})

describe('saveProgress', () => {
  it('un nouveau suivi est créé par POST, avec l’IRI du webtoon', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 42 } })
    const suivi = { state: 'reading' as const, rate: null, bookmark: 3 }

    await saveProgress(5, suivi)

    expect(api.post).toHaveBeenCalledWith(
      '/webtoon_users',
      { webtoon: '/webtoons/5', state: 'reading', rate: null, bookmark: 3 },
      expect.anything(),
    )
    expect(suivi).toMatchObject({ id: 42 })
  })

  it('un suivi existant est modifié par PATCH en merge-patch', async () => {
    await saveProgress(5, { id: 12, state: 'pause', rate: 4, bookmark: 8 })

    expect(api.patch).toHaveBeenCalledWith(
      '/webtoon_users/12',
      { state: 'pause', rate: 4, bookmark: 8 },
      { headers: { 'Content-Type': 'application/merge-patch+json' } },
    )
    expect(api.post).not.toHaveBeenCalled()
  })

  it('les champs vidés dans le formulaire sont envoyés à null, que l’API accepte', async () => {
    // v-model.number laisse '' dans un champ numérique vidé
    const vide = '' as unknown as number
    await saveProgress(5, { id: 12, state: '', rate: 0, bookmark: vide })

    expect(api.patch).toHaveBeenLastCalledWith(
      '/webtoon_users/12',
      { state: null, rate: 0, bookmark: null },
      expect.anything(),
    )
  })

  it('un suivi existant devenu vide est supprimé, et perd son id', async () => {
    const suivi = { id: 12, state: null, rate: null, bookmark: 0 }

    await saveProgress(5, suivi)

    expect(api.delete).toHaveBeenCalledWith('/webtoon_users/12', expect.anything())
    expect(api.patch).not.toHaveBeenCalled()
    expect(suivi.id).toBeUndefined()
  })

  it('un nouveau suivi vide n’envoie rien', async () => {
    await saveProgress(5, { state: null, rate: null, bookmark: null })

    expect(api.post).not.toHaveBeenCalled()
    expect(api.delete).not.toHaveBeenCalled()
  })

  it('un nouveau suivi sans webtoon enregistré est refusé', async () => {
    await expect(saveProgress(undefined, { state: 'reading' })).rejects.toThrow('Webtoon sans id')
    expect(api.post).not.toHaveBeenCalled()
  })
})

describe('losesAccessWithoutProgress', () => {
  it('sans suivi, on perd l’accès à un webtoon dépublié créé par un autre', () => {
    expect(losesAccessWithoutProgress(webtoon(false, AUTRE))).toBe(true)
  })

  it('on garde l’accès à un webtoon publié, ou à un webtoon dépublié qu’on a créé', () => {
    expect(losesAccessWithoutProgress(webtoon(true, AUTRE))).toBe(false)
    expect(losesAccessWithoutProgress(webtoon(false, UTILISATEUR))).toBe(false)
  })
})

describe('confirmLeavingUnpublished', () => {
  it('vider le suivi d’un webtoon dont on perdrait l’accès demande confirmation', () => {
    const confirmation = vi.fn<typeof window.confirm>().mockReturnValue(false)
    vi.stubGlobal('confirm', confirmation)

    expect(confirmLeavingUnpublished(webtoon(false, AUTRE), { id: 12, state: null })).toBe(false)
    expect(confirmation).toHaveBeenCalledOnce()
  })

  it('sans perte d’accès, ou pour un suivi pas encore enregistré, aucune confirmation', () => {
    const confirmation = vi.fn<typeof window.confirm>()
    vi.stubGlobal('confirm', confirmation)

    expect(confirmLeavingUnpublished(webtoon(true, AUTRE), { id: 12, state: null })).toBe(true)
    expect(confirmLeavingUnpublished(webtoon(false, AUTRE), { state: null })).toBe(true)
    expect(confirmLeavingUnpublished(webtoon(false, AUTRE), { id: 12, state: 'pause' })).toBe(true)
    expect(confirmation).not.toHaveBeenCalled()
  })
})

describe('useWebtoonProgress', () => {
  it('un changement d’état est enregistré ; le webtoon reste dans la bibliothèque', async () => {
    const w = webtoon(true, AUTRE)
    w.userProgress = { id: 12, state: 'reading', rate: null, bookmark: 3 }

    const retirer = await useWebtoonProgress().changeStatus(w, 'pause')

    expect(api.patch).toHaveBeenCalledWith(
      '/webtoon_users/12',
      { state: 'pause', rate: null, bookmark: 3 },
      expect.anything(),
    )
    expect(w.userProgress.state).toBe('pause')
    expect(retirer).toBe(false)
  })

  it('si l’API échoue, le suivi revient à son état précédent', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(api.patch).mockRejectedValue(new Error('réseau'))
    const w = webtoon(true, AUTRE)
    w.userProgress = { id: 12, state: 'reading', rate: null, bookmark: 3 }

    const retirer = await useWebtoonProgress().changeBookmark(w, 9)

    expect(w.userProgress.bookmark).toBe(3)
    expect(retirer).toBe(false)
  })

  it('si l’utilisateur refuse de quitter un webtoon dépublié, rien n’est envoyé et le suivi est rétabli', async () => {
    vi.stubGlobal('confirm', vi.fn<typeof window.confirm>().mockReturnValue(false))
    const w = webtoon(false, AUTRE)
    w.userProgress = { id: 12, state: 'reading', rate: null, bookmark: null }

    const retirer = await useWebtoonProgress().changeStatus(w, '')

    expect(api.delete).not.toHaveBeenCalled()
    expect(w.userProgress.state).toBe('reading')
    expect(retirer).toBe(false)
  })

  it('un webtoon dépublié d’un autre, quitté après confirmation, est supprimé du suivi et retiré de la bibliothèque', async () => {
    vi.stubGlobal('confirm', vi.fn<typeof window.confirm>().mockReturnValue(true))
    const w = webtoon(false, AUTRE)
    w.userProgress = { id: 12, state: 'reading', rate: null, bookmark: null }

    const retirer = await useWebtoonProgress().changeStatus(w, '')

    expect(api.delete).toHaveBeenCalledWith('/webtoon_users/12', expect.anything())
    expect(retirer).toBe(true)
  })
})

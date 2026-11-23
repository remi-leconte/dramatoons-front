import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { saveProgress } from '@/composables/dashboard/useWebtoonProgress'
import WebtoonModal from '@/components/dashboard/WebtoonModal.vue'
import WebtoonCoverUploader from '@/components/modal/WebtoonCoverUploader.vue'
import WebtoonUserProgressForm from '@/components/modal/WebtoonUserProgressForm.vue'
import type { Webtoon } from '@/types'

type AppelApi = (...args: unknown[]) => Promise<unknown>

// Les tests ne contactent jamais l'API
vi.mock('@/services/api', () => ({
  default: { get: vi.fn<AppelApi>(), post: vi.fn<AppelApi>(), patch: vi.fn<AppelApi>() },
  COVER_BASE_URL: 'https://api.test/upload/cover/',
}))
vi.mock('@/composables/dashboard/useWebtoonProgress', async (original) => ({
  ...(await original<typeof import('@/composables/dashboard/useWebtoonProgress')>()),
  saveProgress: vi.fn<AppelApi>(),
  confirmLeavingUnpublished: () => true,
}))

const CREATEUR = 7
const AUTRE = 99

const RIEN = {
  titre: false,
  ajout: false,
  modificationOuSuppression: false,
  couverture: false,
  serieTerminee: false,
}
const TOUT = {
  titre: true,
  ajout: true,
  modificationOuSuppression: true,
  couverture: true,
  serieTerminee: true,
}

function webtoon(champs: Partial<Webtoon>): Webtoon {
  return {
    id: 1,
    title: { title: 'Solo' },
    secondaryTitles: [{ id: 10, title: 'Solo alternatif' }],
    status: 'ongoing',
    publish: false,
    readersCount: 0,
    creator: { id: CREATEUR },
    userProgress: { id: 3, state: 'reading' },
    ...champs,
  } as Webtoon
}

function afficher(contenu: Webtoon | null, utilisateur = CREATEUR, roles = ['ROLE_USER']) {
  const auth = useAuthStore()
  auth.userId = utilisateur
  auth.roles = roles
  auth.token = 'jeton'
  return mount(WebtoonModal, { props: { webtoon: contenu } })
}

type Fenetre = ReturnType<typeof afficher>

function interrupteur(vue: Fenetre, libelle: string) {
  return vue
    .findAll('.toggle-row')
    .some((ligne) => ligne.text().includes(libelle) && ligne.find('label.switch').exists())
}

function modifiable(vue: Fenetre) {
  return {
    titre: vue.find('.btn-edit-title').exists() || vue.find('#webtoon-title').exists(),
    ajout: vue.find('.clickable-placeholder').exists(),
    modificationOuSuppression: vue.find('.btn-chip-action').exists(),
    couverture: vue.getComponent(WebtoonCoverUploader).props('isEditable'),
    serieTerminee: interrupteur(vue, 'Série terminée'),
  }
}

async function enregistrerLeSuivi(vue: Fenetre) {
  vue.getComponent(WebtoonUserProgressForm).vm.$emit('change')
  await vi.advanceTimersByTimeAsync(500)
  await flushPromises()
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetAllMocks()
  setActivePinia(createPinia())
  vi.mocked(api.get).mockResolvedValue({ data: webtoon({ publish: true }) })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('WebtoonModal (droits de modification du webtoon)', () => {
  it('le créateur d’un webtoon publié ne modifie ni ses titres, ni sa couverture, ni son statut', () => {
    const vue = afficher(webtoon({ publish: true }))

    expect(modifiable(vue)).toEqual(RIEN)
    expect(vue.text()).toContain('Solo alternatif')
  })

  it('le créateur d’un webtoon dépublié suivi par un autre utilisateur ne le modifie pas non plus', () => {
    expect(modifiable(afficher(webtoon({ readersCount: 2 })))).toEqual(RIEN)
  })

  it('le créateur d’un webtoon dépublié que personne d’autre ne suit peut tout modifier', () => {
    expect(modifiable(afficher(webtoon({ readersCount: 1 })))).toEqual(TOUT)
  })

  it('à la création d’un webtoon, tout est modifiable', () => {
    // Aucun titre facultatif n'existe encore : seul l'ajout est proposé
    expect(modifiable(afficher(null))).toEqual({ ...TOUT, modificationOuSuppression: false })
  })

  it('le suivi du créateur d’un webtoon publié est enregistré sans modifier le webtoon', async () => {
    const vue = afficher(webtoon({ publish: true }))

    await enregistrerLeSuivi(vue)

    expect(saveProgress).toHaveBeenCalledWith(1, expect.anything())
    expect(api.patch).not.toHaveBeenCalled()
    expect(vue.text()).not.toContain('Une erreur est survenue')
  })

  it('le créateur d’un webtoon qu’il peut modifier enregistre aussi le webtoon', async () => {
    const vue = afficher(webtoon({ readersCount: 1 }))

    await enregistrerLeSuivi(vue)

    expect(api.patch).toHaveBeenCalledWith(
      '/webtoons/1',
      expect.objectContaining({ title: { title: 'Solo' }, status: 'ongoing' }),
      expect.anything(),
    )
  })

  it('un lecteur qui n’est pas le créateur ne modifie rien, et son suivi est enregistré seul', async () => {
    const vue = afficher(webtoon({ publish: true }), AUTRE)

    expect(modifiable(vue)).toEqual(RIEN)
    expect(interrupteur(vue, 'Publier au catalogue')).toBe(false)

    await enregistrerLeSuivi(vue)
    expect(saveProgress).toHaveBeenCalledWith(1, expect.anything())
    expect(api.patch).not.toHaveBeenCalled()
  })

  it.each([
    ['qui n’en est pas le créateur', AUTRE],
    ['qui en est le créateur', CREATEUR],
  ])(
    'un modérateur %s ne modifie que la publication d’un webtoon publié',
    async (_cas, utilisateur) => {
      const vue = afficher(webtoon({ publish: true }), utilisateur, ['ROLE_MODO'])

      expect(modifiable(vue)).toEqual(RIEN)
      expect(interrupteur(vue, 'Publier au catalogue')).toBe(true)

      await enregistrerLeSuivi(vue)
      expect(api.patch).toHaveBeenCalledWith('/webtoons/1', { publish: true }, expect.anything())
    },
  )
})

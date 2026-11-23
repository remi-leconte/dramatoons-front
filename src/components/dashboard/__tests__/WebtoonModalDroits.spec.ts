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
  suppression: false,
}
const TOUT = {
  titre: true,
  ajout: true,
  modificationOuSuppression: true,
  couverture: true,
  serieTerminee: true,
  suppression: true,
}

// canEdit vient de l'API : la fenêtre ne recalcule pas ce droit
function webtoon(champs: Partial<Webtoon>): Webtoon {
  return {
    id: 1,
    title: { title: 'Solo' },
    secondaryTitles: [{ id: 10, title: 'Solo alternatif' }],
    status: 'ongoing',
    publish: false,
    readersCount: 0,
    canEdit: false,
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
    suppression: vue.getComponent(WebtoonUserProgressForm).props('canDelete'),
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
  it('un webtoon que l’API dit non modifiable ne propose de modifier ni ses titres, ni sa couverture, ni son statut, ni de le supprimer', () => {
    const vue = afficher(webtoon({ publish: true }))

    expect(modifiable(vue)).toEqual(RIEN)
    expect(vue.text()).toContain('Solo alternatif')
  })

  it('le nombre de lecteurs ne compte pas : un webtoon sans lecteur compté reste non modifiable si l’API le dit', () => {
    // Cas d'un autre utilisateur « Pas intéressé » : il suit le webtoon sans compter dans readersCount
    expect(modifiable(afficher(webtoon({ readersCount: 0, canEdit: false })))).toEqual(RIEN)
  })

  it('un webtoon que l’API dit modifiable propose de tout modifier', () => {
    expect(modifiable(afficher(webtoon({ canEdit: true })))).toEqual(TOUT)
  })

  it('noter le webtoon dans la fenêtre ne le rend pas modifiable', async () => {
    const vue = afficher(webtoon({ readersCount: 1, userProgress: undefined }))

    await vue.getComponent(WebtoonUserProgressForm).vm.$emit('update:progress', { rate: 8 })

    expect(modifiable(vue)).toEqual(RIEN)
  })

  it('à la création d’un webtoon, tout est modifiable', () => {
    // Aucun titre facultatif n'existe encore : seul l'ajout est proposé
    // Rien à supprimer non plus
    expect(modifiable(afficher(null))).toEqual({
      ...TOUT,
      modificationOuSuppression: false,
      suppression: false,
    })
  })

  it('le suivi d’un webtoon non modifiable est enregistré sans modifier le webtoon', async () => {
    const vue = afficher(webtoon({ publish: true }))

    await enregistrerLeSuivi(vue)

    expect(saveProgress).toHaveBeenCalledWith(1, expect.anything())
    expect(api.patch).not.toHaveBeenCalled()
    expect(vue.text()).not.toContain('Une erreur est survenue')
  })

  it('le suivi d’un webtoon modifiable enregistre aussi le webtoon', async () => {
    const vue = afficher(webtoon({ canEdit: true }))

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

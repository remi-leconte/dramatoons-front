import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { saveProgress } from '@/composables/dashboard/useWebtoonProgress'
import WebtoonCard from '@/components/dashboard/WebtoonCard.vue'
import WebtoonModal from '@/components/dashboard/WebtoonModal.vue'
import StatusSelect from '@/components/card/StatusSelect.vue'
import WebtoonUserProgressForm from '@/components/modal/WebtoonUserProgressForm.vue'
import type { Webtoon } from '@/types'

type AppelApi = (...args: unknown[]) => Promise<unknown>

// Les tests ne contactent jamais l'API
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn<AppelApi>(),
    post: vi.fn<AppelApi>(),
    patch: vi.fn<AppelApi>(),
    delete: vi.fn<AppelApi>(),
  },
  COVER_BASE_URL: 'https://api.test/upload/cover/',
}))
vi.mock('@/composables/dashboard/useWebtoonProgress', async (original) => ({
  ...(await original<typeof import('@/composables/dashboard/useWebtoonProgress')>()),
  saveProgress: vi.fn<AppelApi>(),
}))

const COUVERTURE = '/assets/couverture-exemple.svg'

function webtoon(): Webtoon {
  return {
    id: 1,
    title: { title: 'Le Sabre des neuf lunes' },
    secondaryTitles: [],
    status: 'ongoing',
    publish: true,
    canEdit: false,
    averageRating: 8.6,
    readersCount: 124,
    userProgress: { state: 'reading', bookmark: 48, rate: 9 },
  }
}

function aucunAppel() {
  expect(api.get).not.toHaveBeenCalled()
  expect(api.post).not.toHaveBeenCalled()
  expect(api.patch).not.toHaveBeenCalled()
  expect(api.delete).not.toHaveBeenCalled()
  expect(saveProgress).not.toHaveBeenCalled()
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetAllMocks()
  setActivePinia(createPinia())
})

afterEach(() => {
  vi.useRealTimers()
})

describe('WebtoonCard (mode démo de la page d’accueil)', () => {
  it('sans le mode démo, un visiteur ne voit ni état, ni chapitre, ni sa note', () => {
    const vue = mount(WebtoonCard, { props: { webtoon: webtoon() } })

    expect(vue.findComponent(StatusSelect).exists()).toBe(false)
    expect(vue.find('.quick-actions-container').exists()).toBe(false)
    expect(vue.find('.user-rating').exists()).toBe(false)
  })

  it('en mode démo, un visiteur manipule la carte comme un lecteur connecté', async () => {
    const vue = mount(WebtoonCard, { props: { webtoon: webtoon(), demo: true } })

    expect(vue.getComponent(StatusSelect).props('state')).toBe('reading')
    expect(vue.get('.chapter-badge').text()).toBe('Chap. 48')
    expect(vue.get('.user-rating').text()).toContain('9')

    await vue.get('button[title="+1 chapitre"]').trigger('click')
    expect(vue.get('.chapter-badge').text()).toBe('Chap. 49')
    vi.advanceTimersByTime(500)
    expect(vue.emitted('bookmark-change')).toEqual([[49]])
    aucunAppel()
  })

  it('affiche la couverture d’exemple plutôt qu’une couverture de l’API', () => {
    const vue = mount(WebtoonCard, {
      props: { webtoon: { ...webtoon(), image: 'abc.jpg' }, cover: COUVERTURE },
    })

    expect(vue.get('.poster-wrapper img').attributes('src')).toBe(COUVERTURE)
  })
})

describe('WebtoonModal (mode démo de la page d’accueil)', () => {
  it('sans le mode démo, un visiteur ne voit pas le formulaire de suivi', () => {
    const vue = mount(WebtoonModal, { props: { webtoon: webtoon() } })

    expect(vue.findComponent(WebtoonUserProgressForm).exists()).toBe(false)
  })

  it('en mode démo, le suivi se modifie et s’affiche sans rien envoyer à l’API', async () => {
    const vue = mount(WebtoonModal, { props: { webtoon: webtoon(), demo: true } })
    const formulaire = vue.getComponent(WebtoonUserProgressForm)

    formulaire.vm.$emit('update:progress', { state: 'completed', bookmark: 87, rate: 10 })
    formulaire.vm.$emit('change')
    await vi.advanceTimersByTimeAsync(500)
    await flushPromises()

    const enregistre = vue.emitted('saved')?.[0]?.[0] as Webtoon
    expect(enregistre.userProgress).toEqual({ state: 'completed', bookmark: 87, rate: 10 })
    expect(vue.text()).not.toContain('Sauvegarde')
    aucunAppel()
  })

  it('en mode démo, un changement est transmis aussitôt : fermer la fenêtre juste après ne le perd pas', async () => {
    const vue = mount(WebtoonModal, { props: { webtoon: webtoon(), demo: true } })
    const formulaire = vue.getComponent(WebtoonUserProgressForm)

    formulaire.vm.$emit('update:progress', { state: 'pause', bookmark: 48, rate: 9 })
    formulaire.vm.$emit('change')
    await flushPromises()

    const enregistre = vue.emitted('saved')?.[0]?.[0] as Webtoon
    expect(enregistre.userProgress?.state).toBe('pause')
    aucunAppel()
  })

  it('en mode démo, même un modérateur connecté n’a que les droits d’un lecteur', () => {
    const auth = useAuthStore()
    auth.userId = 7
    auth.roles = ['ROLE_MODO']
    auth.token = 'jeton'
    const vue = mount(WebtoonModal, { props: { webtoon: webtoon(), demo: true } })

    expect(vue.text()).not.toContain('Publier au catalogue')
    expect(vue.find('.btn-edit-title').exists()).toBe(false)
    expect(vue.getComponent(WebtoonUserProgressForm).props('canDelete')).toBe(false)
  })

  it('affiche la couverture d’exemple en bannière', () => {
    const vue = mount(WebtoonModal, {
      props: { webtoon: { ...webtoon(), image: 'abc.jpg' }, demo: true, cover: COUVERTURE },
    })

    expect(vue.get('.modal-banner img').attributes('src')).toBe(COUVERTURE)
  })
})

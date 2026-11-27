import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { saveProgress } from '@/composables/dashboard/useWebtoonProgress'
import LandingView from '@/views/LandingView.vue'
import WebtoonCard from '@/components/dashboard/WebtoonCard.vue'
import WebtoonModal from '@/components/dashboard/WebtoonModal.vue'
import StatusSelect from '@/components/card/StatusSelect.vue'
import WebtoonUserProgressForm from '@/components/modal/WebtoonUserProgressForm.vue'

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

const scrollTo = vi.fn<(x: number, y: number) => void>()

function afficher() {
  return mount(LandingView, { global: { stubs: { RouterLink: RouterLinkStub } } })
}

type Page = ReturnType<typeof afficher>

function surlignage(vue: Page, titre: string) {
  const extrait = vue.findAll('.extrait').find((element) => element.text().includes(titre))!
  const titreSurligne = extrait.find('.surligne')
  return titreSurligne.exists() ? (titreSurligne.attributes('style') ?? '') : null
}

function aucunAppel() {
  expect(api.get).not.toHaveBeenCalled()
  expect(api.post).not.toHaveBeenCalled()
  expect(api.patch).not.toHaveBeenCalled()
  expect(api.delete).not.toHaveBeenCalled()
  expect(saveProgress).not.toHaveBeenCalled()
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  vi.resetAllMocks()
  setActivePinia(createPinia())
  vi.stubGlobal('scrollTo', scrollTo)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
  document.body.className = ''
  document.body.removeAttribute('style')
})

describe("LandingView (page d'accueil d'un visiteur)", () => {
  it("propose de créer un compte et laisse la connexion à l'en-tête", () => {
    const liens = afficher()
      .findAllComponents(RouterLinkStub)
      .map((lien) => lien.props('to'))

    expect(liens).toContain('/register')
    expect(liens).not.toContain('/login')
  })

  it("dit que Dramatoons n'héberge aucun webtoon", () => {
    expect(afficher().text()).toContain("Dramatoons n'héberge aucun webtoon")
  })

  it("n'affiche que des webtoons et des couvertures fictifs, sans rien demander à l'API", () => {
    const vue = afficher()

    expect(vue.findAllComponents(WebtoonCard)).toHaveLength(5)
    for (const image of vue.findAll('img')) {
      expect(image.attributes('src')).not.toContain('https://api.test/')
    }
    expect(vue.text()).toContain("créés pour l'exemple")
    aucunAppel()
  })

  it('surligne les extraits de sites selon le suivi de chaque webtoon, comme l’extension', () => {
    const vue = afficher()

    expect(surlignage(vue, 'Le Sabre des neuf lunes')).toContain('var(--status-reading)')
    expect(surlignage(vue, 'Le Bal des cendres')).toContain('var(--status-paused)')
    expect(surlignage(vue, 'Porte nº 0')).toContain('var(--status-none)')
    expect(surlignage(vue, 'Le Club de minuit')).toContain('var(--status-completed)')
    expect(surlignage(vue, 'Le Café des comètes')).toContain('var(--status-disinterested)')
    expect(surlignage(vue, "L'Ombre du libraire")).toBeNull()
  })

  it('reporte sur le surlignage un état changé dans la bibliothèque, sans rien envoyer', async () => {
    vi.useFakeTimers()
    const vue = afficher()
    const carte = vue.findAllComponents(WebtoonCard)[0]!

    carte.getComponent(StatusSelect).vm.$emit('update:state', 'completed')
    await carte.get('button[title="+1 chapitre"]').trigger('click')
    await vi.advanceTimersByTimeAsync(500)

    expect(surlignage(vue, 'Le Sabre des neuf lunes')).toContain('var(--status-completed)')
    expect(vue.findAll('.extrait')[0]!.text()).toContain('📌 49')
    aucunAppel()
  })

  it('ouvre la fiche d’un webtoon, dont le suivi modifié se reporte partout, sans rien envoyer', async () => {
    vi.useFakeTimers()
    const vue = afficher()

    await vue.findAllComponents(WebtoonCard)[1]!.trigger('click')
    await flushPromises()
    const formulaire = vue.getComponent(WebtoonModal).getComponent(WebtoonUserProgressForm)
    formulaire.vm.$emit('update:progress', { state: null, bookmark: null, rate: null })
    formulaire.vm.$emit('change')
    await vi.advanceTimersByTimeAsync(500)

    expect(surlignage(vue, 'Le Bal des cendres')).toBeNull()
    aucunAppel()
  })

  it('fige le défilement derrière la fiche ouverte, et le rend à sa fermeture', async () => {
    Object.defineProperty(window, 'scrollY', { value: 900, configurable: true })
    const vue = afficher()

    await vue.findAllComponents(WebtoonCard)[0]!.trigger('click')
    await flushPromises()
    expect(document.body.classList.contains('modal-open')).toBe(true)
    expect(document.body.style.top).toBe('-900px')

    vue.getComponent(WebtoonModal).vm.$emit('close')
    await flushPromises()
    expect(vue.findComponent(WebtoonModal).exists()).toBe(false)
    expect(document.body.classList.contains('modal-open')).toBe(false)
    expect(scrollTo).toHaveBeenCalledWith(0, 900)
  })

  it('oublie les changements en quittant la page : on retrouve la bibliothèque d’origine', async () => {
    vi.useFakeTimers()
    const premiere = afficher()
    const carte = premiere.findAllComponents(WebtoonCard)[0]!
    carte.getComponent(StatusSelect).vm.$emit('update:state', 'completed')
    await carte.get('button[title="+1 chapitre"]').trigger('click')
    await vi.advanceTimersByTimeAsync(500)
    expect(surlignage(premiere, 'Le Sabre des neuf lunes')).toContain('var(--status-completed)')
    premiere.unmount()

    const seconde = afficher()
    expect(surlignage(seconde, 'Le Sabre des neuf lunes')).toContain('var(--status-reading)')
    expect(seconde.findAll('.extrait')[0]!.text()).toContain('📌 48')
  })

  it('rend le défilement si l’on quitte la page avec une fiche ouverte', async () => {
    const vue = afficher()
    await vue.findAllComponents(WebtoonCard)[0]!.trigger('click')
    await flushPromises()

    vue.unmount()
    expect(document.body.classList.contains('modal-open')).toBe(false)
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('répond aux questions fréquentes, avec leurs liens', () => {
    const vue = afficher()
    const question = (debut: string) =>
      vue.findAll('details').find((element) => element.get('summary').text().startsWith(debut))!
    const liensDe = (debut: string) =>
      vue
        .findAllComponents(RouterLinkStub)
        .filter((lien) => question(debut).element.contains(lien.element))
        .map((lien) => lien.props('to'))

    expect(vue.findAll('details')).toHaveLength(6)
    expect(liensDe('Sur quels navigateurs')).toEqual(['/install-tutorial'])

    const ayantDroit = question('Vous êtes ayant droit')
    expect(ayantDroit.text()).toContain('Sa couverture est retirée sur simple demande justifiée')
    expect(ayantDroit.text()).not.toMatch(/le webtoon, ou sa couverture/i)
    const liens = ayantDroit.findAll('a').map((lien) => lien.text())
    expect(liens).toEqual(['dramatoons@mailo.com', 'Détails dans les mentions légales'])
    expect(ayantDroit.get('a').attributes('href')).toBe('mailto:dramatoons@mailo.com')
    expect(liensDe('Vous êtes ayant droit')).toEqual(['/mentions-legales#retrait'])
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '@/App.vue'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn<() => void>() }) }))
vi.mock('@/services/api', () => ({ default: {}, COVER_BASE_URL: '' }))

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('App (pied de page)', () => {
  it('affiche la version du site, inscrite à la construction (dev hors image publiée)', () => {
    const vue = mount(App, {
      global: {
        stubs: { RouterLink: true, RouterView: true, HeaderSearch: true, WebtoonModal: true },
      },
    })

    expect(vue.get('.app-footer').text()).toContain(`Dramatoons.ovh · ${__APP_VERSION__}`)
    expect(__APP_VERSION__).toBe('dev')
  })

  it('mène aux mentions légales, à côté de la politique de confidentialité', () => {
    const vue = mount(App, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          RouterView: true,
          HeaderSearch: true,
          WebtoonModal: true,
        },
      },
    })
    const liens = vue
      .findAllComponents(RouterLinkStub)
      .filter((lien) => lien.element.closest('.footer-links'))
      .map((lien) => [lien.props('to'), lien.text()])

    expect(liens).toContainEqual(['/privacy', 'Politique de confidentialité'])
    expect(liens).toContainEqual(['/mentions-legales', 'Mentions légales'])
    const separateurs = vue.findAll('.footer-links .footer-separator')
    expect(separateurs).toHaveLength(2)
    expect(separateurs.every((point) => point.attributes('aria-hidden') === 'true')).toBe(true)
  })
})

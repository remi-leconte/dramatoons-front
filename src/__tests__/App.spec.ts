import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
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
})

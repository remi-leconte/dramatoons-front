import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import DashboardView from '@/views/DashboardView.vue'
import WebtoonCard from '@/components/dashboard/WebtoonCard.vue'
import WebtoonModal from '@/components/dashboard/WebtoonModal.vue'

type AppelApi = (...args: unknown[]) => Promise<unknown>

// Les tests ne contactent jamais l'API
vi.mock('@/services/api', () => ({
  default: { get: vi.fn<AppelApi>() },
  COVER_BASE_URL: 'https://api.test/upload/cover/',
}))
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: vi.fn<() => void>() }),
}))

const scrollTo = vi.fn<(x: number, y: number) => void>()

function defiler(position: number) {
  Object.defineProperty(window, 'scrollY', { value: position, configurable: true })
}

async function afficher() {
  const auth = useAuthStore()
  auth.token = 'jeton'
  auth.userId = 1
  const vue = mount(DashboardView, {
    global: { stubs: { RouterLink: true, WebtoonModal: true } },
  })
  await flushPromises()
  return vue
}

beforeEach(() => {
  vi.resetAllMocks()
  setActivePinia(createPinia())
  vi.stubGlobal('scrollTo', scrollTo)
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  vi.mocked(api.get).mockResolvedValue({
    data: { member: [{ id: 5, title: { title: 'Solo' }, status: 'ongoing', publish: true }] },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('DashboardView (position de défilement derrière la fenêtre d’un webtoon)', () => {
  it('fige la page à sa position à l’ouverture, et la rend à la fermeture', async () => {
    const vue = await afficher()
    defiler(1200)

    await vue.getComponent(WebtoonCard).trigger('click')
    expect(document.body.classList.contains('modal-open')).toBe(true)
    expect(document.body.style.top).toBe('-1200px')

    defiler(0)
    vue.getComponent(WebtoonModal).vm.$emit('close')
    await flushPromises()

    expect(document.body.classList.contains('modal-open')).toBe(false)
    expect(document.body.style.top).toBe('')
    expect(scrollTo).toHaveBeenCalledWith(0, 1200)
  })

  it('libère la page sans la faire défiler quand on la quitte avec la fenêtre ouverte', async () => {
    const vue = await afficher()
    defiler(700)
    await vue.getComponent(WebtoonCard).trigger('click')

    vue.unmount()

    expect(document.body.classList.contains('modal-open')).toBe(false)
    expect(document.body.style.top).toBe('')
    expect(scrollTo).not.toHaveBeenCalled()
  })
})

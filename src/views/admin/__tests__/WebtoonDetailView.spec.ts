import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import WebtoonDetailView from '@/views/admin/WebtoonDetailView.vue'
import WebtoonCoverUploader from '@/components/modal/WebtoonCoverUploader.vue'

type AppelApi = (...args: unknown[]) => Promise<unknown>

// Les tests ne contactent jamais l'API
vi.mock('@/services/api', () => ({
  default: { get: vi.fn<AppelApi>() },
  COVER_BASE_URL: 'https://api.test/upload/cover/',
}))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '1' } }),
  useRouter: () => ({ push: vi.fn<() => void>() }),
}))

const UPDATED = '2026-11-22T10:00:00+00:00'

async function afficher(image?: string) {
  vi.mocked(api.get).mockImplementation(async (url: unknown) =>
    String(url).startsWith('/webtoons/')
      ? {
          data: {
            id: 1,
            title: { title: 'Solo' },
            image,
            updated: UPDATED,
            status: 'ongoing',
            publish: true,
          },
        }
      : { data: { member: [] } },
  )
  const vue = mount(WebtoonDetailView, { global: { stubs: { RouterLink: true } } })
  await flushPromises()
  return vue.getComponent(WebtoonCoverUploader)
}

beforeEach(() => {
  vi.resetAllMocks()
  setActivePinia(createPinia())
})

describe("WebtoonDetailView (fiche d'un webtoon dans l'administration)", () => {
  it('ne demande aucune image pour un webtoon sans couverture', async () => {
    const couverture = await afficher(undefined)

    expect(couverture.props('imageUrl')).toBeNull()
    expect(couverture.find('img').exists()).toBe(false)
  })

  it("affiche la couverture d'un webtoon qui en a une", async () => {
    const couverture = await afficher('abc.jpg')

    expect(couverture.props('imageUrl')).toBe(
      `https://api.test/upload/cover/abc.jpg?t=${new Date(UPDATED).getTime()}`,
    )
  })
})

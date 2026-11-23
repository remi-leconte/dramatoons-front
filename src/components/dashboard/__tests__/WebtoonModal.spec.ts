import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WebtoonModal from '@/components/dashboard/WebtoonModal.vue'
import type { Webtoon } from '@/types'

type AppelApi = (...args: unknown[]) => Promise<unknown>

// Les tests ne contactent jamais l'API
vi.mock('@/services/api', () => ({
  default: { get: vi.fn<AppelApi>(), post: vi.fn<AppelApi>(), patch: vi.fn<AppelApi>() },
  COVER_BASE_URL: 'https://api.test/upload/cover/',
}))

const UPDATED = '2026-11-22T10:00:00+00:00'

function webtoon(image?: string | null): Webtoon {
  return {
    id: 1,
    title: { title: 'Solo' },
    image,
    updated: UPDATED,
    status: 'ongoing',
    publish: true,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('WebtoonModal (bannière de la fenêtre du webtoon)', () => {
  it("n'affiche pas de bannière pour un webtoon sans couverture", () => {
    const vue = mount(WebtoonModal, { props: { webtoon: webtoon(null) } })

    expect(vue.find('.modal-banner').exists()).toBe(false)
  })

  it('affiche la couverture en bannière, la retire si elle ne se charge pas, et la rend pour une nouvelle couverture', async () => {
    const vue = mount(WebtoonModal, { props: { webtoon: webtoon('abc.jpg') } })
    expect(vue.get('.modal-banner img').attributes('src')).toBe(
      `https://api.test/upload/cover/abc.jpg?t=${new Date(UPDATED).getTime()}`,
    )

    await vue.get('.modal-banner img').trigger('error')
    expect(vue.find('.modal-banner').exists()).toBe(false)

    await vue.setProps({ webtoon: webtoon('def.jpg') })
    expect(vue.get('.modal-banner img').attributes('src')).toContain('def.jpg')
  })
})

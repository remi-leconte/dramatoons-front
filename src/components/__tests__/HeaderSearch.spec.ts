import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import api from '@/services/api'
import HeaderSearch from '@/components/HeaderSearch.vue'

type AppelApi = (...args: unknown[]) => Promise<unknown>

// Les tests ne contactent jamais l'API : la recherche est simulée
vi.mock('@/services/api', () => ({
  default: { get: vi.fn<AppelApi>() },
  COVER_BASE_URL: 'https://api.test/upload/cover/',
}))

async function rechercher(webtoons: unknown[]) {
  vi.mocked(api.get).mockResolvedValue({ data: { member: webtoons } })
  const vue = mount(HeaderSearch)
  await vue.get('input').setValue('solo')
  await vi.advanceTimersByTimeAsync(300)
  await flushPromises()
  return vue
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('HeaderSearch (recherche du bandeau)', () => {
  it('affiche le visuel de remplacement, sans image, pour un webtoon sans couverture', async () => {
    const vue = await rechercher([{ id: 1, title: { title: 'Solo' } }])

    expect(vue.find('img.result-cover').exists()).toBe(false)
    expect(vue.find('.cover-placeholder').exists()).toBe(true)
  })

  it("affiche la couverture d'un webtoon qui en a une", async () => {
    const vue = await rechercher([{ id: 1, title: { title: 'Solo' }, image: 'abc.jpg' }])

    expect(vue.get('img.result-cover').attributes('src')).toBe(
      'https://api.test/upload/cover/abc.jpg',
    )
    expect(vue.find('.cover-placeholder').exists()).toBe(false)
  })

  it('remplace une couverture qui ne se charge pas par le visuel de remplacement', async () => {
    const vue = await rechercher([{ id: 1, title: { title: 'Solo' }, image: 'absente.jpg' }])

    await vue.get('img.result-cover').trigger('error')

    expect(vue.find('img.result-cover').exists()).toBe(false)
    expect(vue.find('.cover-placeholder').exists()).toBe(true)
  })

  it("essaie de nouveau la couverture d'un webtoon dont l'image a changé depuis une erreur", async () => {
    const vue = await rechercher([{ id: 1, title: { title: 'Solo' }, image: 'absente.jpg' }])
    await vue.get('img.result-cover').trigger('error')

    vi.mocked(api.get).mockResolvedValue({
      data: { member: [{ id: 1, title: { title: 'Solo' }, image: 'nouvelle.jpg' }] },
    })
    await vue.get('input').setValue('solo l')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(vue.get('img.result-cover').attributes('src')).toBe(
      'https://api.test/upload/cover/nouvelle.jpg',
    )
  })
})

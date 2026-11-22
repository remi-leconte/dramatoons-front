import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WebtoonCard from '@/components/dashboard/WebtoonCard.vue'

vi.mock('@/services/api', () => ({ default: {}, COVER_BASE_URL: 'https://api.test/upload/cover/' }))

const UPDATED = '2026-11-22T10:00:00+00:00'

function afficher(image?: string | null) {
  return mount(WebtoonCard, {
    props: {
      webtoon: {
        id: 1,
        title: { title: 'Solo' },
        image,
        updated: UPDATED,
        status: 'ongoing',
        publish: true,
      },
    },
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('WebtoonCard (carte de la bibliothèque et du catalogue)', () => {
  it('affiche le titre, sans image, pour un webtoon sans couverture', () => {
    const vue = afficher(null)

    expect(vue.find('.poster-wrapper img').exists()).toBe(false)
    expect(vue.get('.cover-placeholder').text()).toBe('Solo')
  })

  it('affiche la couverture avec la date de modification, puis le titre si elle ne se charge pas', async () => {
    const vue = afficher('abc.jpg')
    expect(vue.get('.poster-wrapper img').attributes('src')).toBe(
      `https://api.test/upload/cover/abc.jpg?t=${new Date(UPDATED).getTime()}`,
    )

    await vue.get('.poster-wrapper img').trigger('error')

    expect(vue.find('.poster-wrapper img').exists()).toBe(false)
    expect(vue.find('.cover-placeholder').exists()).toBe(true)
  })
})

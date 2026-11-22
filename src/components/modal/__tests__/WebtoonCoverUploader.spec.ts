import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WebtoonCoverUploader from '@/components/modal/WebtoonCoverUploader.vue'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("WebtoonCoverUploader (couverture de la fenêtre et de l'administration)", () => {
  it("affiche le titre, sans image, quand le webtoon n'a pas de couverture", () => {
    const vue = mount(WebtoonCoverUploader, { props: { imageUrl: null, title: 'Solo' } })

    expect(vue.find('img').exists()).toBe(false)
    expect(vue.get('.cover-placeholder').text()).toBe('Solo')
  })

  it("affiche la couverture, puis le titre si elle ne se charge pas, et de nouveau l'image pour une autre adresse", async () => {
    const vue = mount(WebtoonCoverUploader, {
      props: { imageUrl: 'https://api.test/a.jpg', title: 'Solo' },
    })
    expect(vue.get('img').attributes('src')).toBe('https://api.test/a.jpg')

    await vue.get('img').trigger('error')
    expect(vue.find('img').exists()).toBe(false)
    expect(vue.find('.cover-placeholder').exists()).toBe(true)

    await vue.setProps({ imageUrl: 'https://api.test/b.jpg' })
    expect(vue.get('img').attributes('src')).toBe('https://api.test/b.jpg')
  })

  it("affiche l'aperçu du fichier choisi à la place de la couverture", async () => {
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:apercu' })
    const vue = mount(WebtoonCoverUploader, { props: { imageUrl: null, isEditable: true } })
    const input = vue.get('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [new File(['x'], 'a.jpg', { type: 'image/jpeg' })],
    })

    await input.trigger('change')

    expect(vue.get('img').attributes('src')).toBe('blob:apercu')
  })
})

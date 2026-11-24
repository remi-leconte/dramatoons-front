import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import InstallExtensionTutorialView from '@/views/InstallExtensionTutorialView.vue'

function afficher() {
  return mount(InstallExtensionTutorialView, { global: { stubs: { RouterLink: true } } })
}

describe("InstallExtensionTutorialView (tutoriel d'installation de l'extension)", () => {
  it('fait télécharger la dernière release de la nouvelle extension', () => {
    const lien = afficher().get('[data-test="telechargement"]')

    expect(lien.attributes('href')).toBe(
      'https://github.com/remi-leconte/dramatoons-browser-extension/releases/latest',
    )
  })

  it("ne renvoie plus vers l'ancienne extension Chromium", () => {
    const liens = afficher()
      .findAll('a')
      .map((lien) => lien.attributes('href') ?? '')

    expect(liens.filter((href) => href.includes('dramatoons-extension-chromium'))).toEqual([])
  })

  it("ne propose que le store de Firefox, l'extension étant retirée de celui d'Edge", () => {
    const vue = afficher()
    const stores = vue.findAll('.store-section a').map((lien) => lien.attributes('href'))
    const liens = vue.findAll('a').map((lien) => lien.attributes('href') ?? '')

    expect(stores).toEqual(['https://addons.mozilla.org/fr/firefox/addon/dramatoons-highlighter/'])
    expect(liens.filter((href) => href.includes('microsoftedge'))).toEqual([])
  })

  it('ne cite ni Edge ni Brave, seulement Chrome et les autres navigateurs basés sur Chromium', () => {
    const texte = afficher().text()

    expect(texte).not.toMatch(/edge|brave/i)
    expect(texte).toContain('Chrome et les autres navigateurs basés sur Chromium')
  })
})

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
})

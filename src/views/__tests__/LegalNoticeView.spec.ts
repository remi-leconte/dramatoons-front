import { describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import LegalNoticeView from '@/views/LegalNoticeView.vue'

function afficher() {
  return mount(LegalNoticeView, { global: { stubs: { RouterLink: RouterLinkStub } } })
}

describe('LegalNoticeView (mentions légales)', () => {
  it("présente un éditeur particulier et anonyme, comme l'article 1-1 de la LCEN le permet", () => {
    const texte = afficher().text()

    expect(texte).toContain('édité à titre non professionnel par un particulier')
    expect(texte).toContain("l'article 1-1 de la loi n° 2004-575 du 21 juin 2004")
    expect(texte).toContain("son identité a été communiquée à l'hébergeur")
  })

  it("donne le nom et l'adresse de l'hébergeur", () => {
    expect(afficher().text()).toContain('OVH SAS, 2 rue Kellermann, 59100 Roubaix, France')
  })

  it('rappelle que les titres et couvertures, ajoutés par les lecteurs, restent aux ayants droit', () => {
    const texte = afficher().text()

    expect(texte).toContain("n'héberge aucune œuvre")
    expect(texte).toContain('ajoutés par les lecteurs')
    expect(texte).toContain('restent la propriété de leurs ayants droit')
  })

  it('retire une couverture sur demande justifiée d’un ayant droit, dans une section accessible par lien', () => {
    const retrait = afficher().get('#retrait')
    const texte = retrait.text()

    expect(texte).toContain('Demandes de retrait')
    expect(retrait.get('a[href="mailto:dramatoons@mailo.com"]').text()).toBe('dramatoons@mailo.com')
    expect(texte).toContain('Sa couverture est retirée sur simple demande justifiée')
    expect(texte).toContain('le titre du webtoon concerné')
    expect(texte).toContain(
      'votre qualité (auteur, éditeur, représentant…) et de quoi la justifier',
    )
  })

  it('ne retire pas un webtoon pour son seul titre, mais examine les autres demandes', () => {
    const texte = afficher().get('#retrait').text()

    expect(texte).toContain("Le titre d'une œuvre n'est cité que pour la désigner")
    expect(texte).toContain('examinée au cas par cas')
    expect(texte).toContain('signaler tout contenu illicite')
    expect(texte).not.toContain('webtoon entier')
  })

  it('renvoie à la politique de confidentialité pour les données personnelles', () => {
    const liens = afficher()
      .findAllComponents(RouterLinkStub)
      .map((lien) => lien.props('to'))

    expect(liens).toContain('/privacy')
  })
})

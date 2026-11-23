import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWebtoonSearch } from '@/composables/dashboard/useWebtoonSearch'

vi.mock('vue-router', () => ({ useRoute: () => ({ query: {} }) }))

function triEnvoye(onglet: 'bibliotheque' | 'catalogue', tri: 'added' | 'title') {
  const recherche = useWebtoonSearch()
  recherche.activeTab.value = onglet
  recherche.sortBy.value = tri
  return new URLSearchParams(recherche.buildQueryUrl().split('?')[1]).get('sortBy')
}

beforeEach(() => {
  localStorage.clear()
})

describe('useWebtoonSearch (tri envoyé à l’API)', () => {
  it('« Modification » de la bibliothèque trie par dernière modification du suivi', () => {
    expect(triEnvoye('bibliotheque', 'added')).toBe('user_updated')
  })

  it('« Dernier ajout » du catalogue trie par date de création du webtoon', () => {
    expect(triEnvoye('catalogue', 'added')).toBe('added')
  })

  it('les autres tris sont envoyés tels quels, dans les deux onglets', () => {
    expect(triEnvoye('bibliotheque', 'title')).toBe('title')
    expect(triEnvoye('catalogue', 'title')).toBe('title')
  })
})

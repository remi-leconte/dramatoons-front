import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import api from '@/services/api'
import WebtoonListView from '@/views/admin/WebtoonListView.vue'

type AppelApi = (...args: unknown[]) => Promise<unknown>

// Les tests ne contactent jamais l'API : chaque appel est simulé et vérifié
vi.mock('@/services/api', () => ({ default: { get: vi.fn<AppelApi>() } }))

// Paramètres de tri de la dernière requête du listing
function dernierTri(): { sortBy: string | null; sortOrder: string | null; order: string[] } {
  const url = String(vi.mocked(api.get).mock.lastCall?.[0])
  const params = new URLSearchParams(url.split('?')[1])
  return {
    sortBy: params.get('sortBy'),
    sortOrder: params.get('sortOrder'),
    order: [...params.keys()].filter((cle) => cle.startsWith('order[')),
  }
}

async function afficher() {
  const vue = mount(WebtoonListView, { global: { stubs: { RouterLink: true } } })
  await flushPromises()
  return vue
}

async function cliquerColonne(vue: Awaited<ReturnType<typeof afficher>>, libelle: string) {
  const colonne = vue.findAll('th.sortable').find((th) => th.text().startsWith(libelle))
  if (!colonne) throw new Error(`Colonne ${libelle} introuvable`)
  await colonne.trigger('click')
  await flushPromises()
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.get).mockResolvedValue({ data: { member: [], totalItems: 0 } })
})

describe('WebtoonListView (administration des webtoons)', () => {
  it('le premier affichage demande le tri par identifiant croissant, dans le format lu par l’API', async () => {
    await afficher()

    expect(String(vi.mocked(api.get).mock.lastCall?.[0])).toContain('mode=admin')
    expect(dernierTri()).toEqual({ sortBy: 'id', sortOrder: 'asc', order: [] })
  })

  it.each([
    ['Titre', 'title'],
    ['Statut', 'status'],
    ['Publié', 'publish'],
    ['Dernière modification', 'updated'],
  ])('un clic sur « %s » trie par %s, un second clic inverse l’ordre', async (libelle, colonne) => {
    const vue = await afficher()

    await cliquerColonne(vue, libelle)
    expect(dernierTri()).toEqual({ sortBy: colonne, sortOrder: 'asc', order: [] })

    await cliquerColonne(vue, libelle)
    expect(dernierTri()).toEqual({ sortBy: colonne, sortOrder: 'desc', order: [] })
  })

  it('un clic sur « ID », déjà trié par ordre croissant, inverse l’ordre', async () => {
    const vue = await afficher()

    await cliquerColonne(vue, 'ID')
    expect(dernierTri()).toEqual({ sortBy: 'id', sortOrder: 'desc', order: [] })
  })
})

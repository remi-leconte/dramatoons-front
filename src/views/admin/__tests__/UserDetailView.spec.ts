import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import UserDetailView from '@/views/admin/UserDetailView.vue'

type AppelApi = (...args: unknown[]) => Promise<unknown>

// Les tests ne contactent jamais l'API
vi.mock('@/services/api', () => ({
  default: { get: vi.fn<AppelApi>(), post: vi.fn<AppelApi>(), patch: vi.fn<AppelApi>() },
}))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '4' } }),
  useRouter: () => ({ push: vi.fn<() => void>() }),
}))

const alerte = vi.fn<(message: string) => void>()

async function afficher() {
  vi.mocked(api.get).mockImplementation(async (url: unknown) =>
    String(url).startsWith('/users/')
      ? { data: { id: 4, login: 'lecteur', email: 'ancien@dramatoons.test', roles: ['ROLE_USER'] } }
      : { data: { member: [] } },
  )
  vi.mocked(api.patch).mockResolvedValue({ data: {} })
  const vue = mount(UserDetailView, { global: { stubs: { RouterLink: true } } })
  await flushPromises()
  return vue
}

beforeEach(() => {
  vi.resetAllMocks()
  setActivePinia(createPinia())
  vi.stubGlobal('alert', alerte)
})

describe("UserDetailView (fiche d'un utilisateur dans l'administration)", () => {
  it("un changement d'email n'envoie que la modification : l'API envoie elle-même le seul lien de vérification", async () => {
    const vue = await afficher()

    await vue.get('input[type="email"]').setValue('nouveau@dramatoons.test')
    await vue.get('form').trigger('submit')
    await flushPromises()

    expect(api.patch).toHaveBeenCalledWith(
      '/users/4',
      expect.objectContaining({ email: 'nouveau@dramatoons.test' }),
      expect.anything(),
    )
    expect(api.post).not.toHaveBeenCalled()
    expect(alerte).toHaveBeenCalledWith(
      'Modifications enregistrées. Un e-mail de vérification a été envoyé à la nouvelle adresse.',
    )
  })

  it("sans changement d'email, aucun email de vérification n'est annoncé", async () => {
    const vue = await afficher()

    await vue.get('form').trigger('submit')
    await flushPromises()

    expect(api.post).not.toHaveBeenCalled()
    expect(alerte).toHaveBeenCalledWith('Modifications enregistrées.')
  })

  it("un enregistrement refusé par l'API n'annonce aucun email de vérification", async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const vue = await afficher()
    vi.mocked(api.patch).mockRejectedValue(new Error('500'))

    await vue.get('input[type="email"]').setValue('nouveau@dramatoons.test')
    await vue.get('form').trigger('submit')
    await flushPromises()

    expect(alerte).toHaveBeenCalledWith('Une erreur est survenue lors de la mise à jour.')
    expect(alerte).toHaveBeenCalledTimes(1)
    expect(api.post).not.toHaveBeenCalled()
  })

  it("un second enregistrement sans nouveau changement n'annonce pas de nouvel email", async () => {
    const vue = await afficher()
    await vue.get('input[type="email"]').setValue('nouveau@dramatoons.test')
    await vue.get('form').trigger('submit')
    await flushPromises()

    await vue.get('form').trigger('submit')
    await flushPromises()

    expect(alerte).toHaveBeenLastCalledWith('Modifications enregistrées.')
    expect(api.post).not.toHaveBeenCalled()
  })
})

import { describe, expect, it, vi } from 'vitest'
import { coverUrl } from '@/services/cover'

vi.mock('@/services/api', () => ({ COVER_BASE_URL: 'https://api.test/upload/cover/' }))

describe("coverUrl (adresse de la couverture d'un webtoon)", () => {
  it("renvoie null sans couverture, pour que le visuel de remplacement s'affiche sans requête", () => {
    expect(coverUrl(null)).toBeNull()
    expect(coverUrl(undefined, '2026-11-22T10:00:00+00:00')).toBeNull()
    expect(coverUrl('')).toBeNull()
  })

  it("construit l'adresse de la couverture, avec la date de modification contre le cache", () => {
    expect(coverUrl('abc.jpg')).toBe('https://api.test/upload/cover/abc.jpg')
    expect(coverUrl('abc.jpg', '2026-11-22T10:00:00+00:00')).toBe(
      `https://api.test/upload/cover/abc.jpg?t=${new Date('2026-11-22T10:00:00+00:00').getTime()}`,
    )
  })
})

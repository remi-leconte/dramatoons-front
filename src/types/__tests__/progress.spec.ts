import { describe, expect, it } from 'vitest'
import { createDefaultProgress, isEmptyProgress } from '@/types/progress'

describe('isEmptyProgress', () => {
  it('un suivi sans état, sans note et sans chapitre est vide', () => {
    expect(isEmptyProgress(createDefaultProgress())).toBe(true)
  })

  it('le chapitre 0 compte comme pas de chapitre', () => {
    expect(isEmptyProgress({ bookmark: 0 })).toBe(true)
  })

  it('un état vidé dans le formulaire compte comme pas d’état', () => {
    expect(isEmptyProgress({ state: '' })).toBe(true)
  })

  it('un état, une note ou un chapitre rend le suivi non vide', () => {
    expect(isEmptyProgress({ state: 'pause' })).toBe(false)
    expect(isEmptyProgress({ rate: 3 })).toBe(false)
    expect(isEmptyProgress({ bookmark: 12 })).toBe(false)
  })

  it('une note de 0 est une vraie note', () => {
    expect(isEmptyProgress({ rate: 0 })).toBe(false)
  })
})

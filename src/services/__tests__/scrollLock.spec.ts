import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lockScroll, unlockScroll } from '@/services/scrollLock'

const scrollTo = vi.fn<(x: number, y: number) => void>()

function defiler(position: number) {
  Object.defineProperty(window, 'scrollY', { value: position, configurable: true })
}

beforeEach(() => {
  vi.stubGlobal('scrollTo', scrollTo)
  scrollTo.mockReset()
})

afterEach(() => {
  unlockScroll(false)
  vi.unstubAllGlobals()
})

describe('lockScroll / unlockScroll (page figée derrière une fenêtre)', () => {
  it('fige la page à sa position de défilement, sans la remonter en haut', () => {
    defiler(1200)

    lockScroll()

    expect(document.body.classList.contains('modal-open')).toBe(true)
    expect(document.body.style.top).toBe('-1200px')
  })

  it('rend à la fermeture la position de défilement d’avant l’ouverture', () => {
    defiler(1200)
    lockScroll()
    defiler(0)

    unlockScroll()

    expect(document.body.classList.contains('modal-open')).toBe(false)
    expect(document.body.style.top).toBe('')
    expect(scrollTo).toHaveBeenCalledWith(0, 1200)
  })

  it('garde la première position si la fenêtre est rouverte sans avoir été fermée', () => {
    defiler(800)
    lockScroll()
    defiler(0)
    lockScroll()

    unlockScroll()

    expect(scrollTo).toHaveBeenCalledWith(0, 800)
  })

  it('ne défile pas en quittant la page, ni sans fenêtre ouverte', () => {
    defiler(500)
    lockScroll()
    unlockScroll(false)
    unlockScroll()

    expect(scrollTo).not.toHaveBeenCalled()
    expect(document.body.classList.contains('modal-open')).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import {
  construireRuban,
  courbesPassantPar,
  echantillonner,
  longueurAtteinte,
  PAS,
  placerEncoche,
  rotation,
} from '@/components/landing/ruban'

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(b.x - a.x, b.y - a.y)

describe('ruban (calculs du ruban marque-page de la page d’accueil)', () => {
  it('trace des courbes qui partent du premier point et passent par chaque point', () => {
    const points = [
      { x: 10, y: 0 },
      { x: 200, y: 300 },
      { x: 40, y: 700 },
    ]
    const { d, courbes } = courbesPassantPar(points)

    expect(d.startsWith('M 10 0')).toBe(true)
    expect(courbes).toHaveLength(2)
    expect(courbes[0]![3]).toEqual(points[1])
    expect(courbes[1]![3]).toEqual(points[2])
  })

  it('mesure le chemin et en donne un point tous les PAS pixels', () => {
    const { courbes } = courbesPassantPar([
      { x: 50, y: 0 },
      { x: 50, y: 400 },
    ])
    const { points, total } = echantillonner(courbes)

    expect(total).toBeCloseTo(400, 0)
    expect(points).toHaveLength(Math.floor(total / PAS) + 1)
    expect(points[0]).toEqual({ x: 50, y: 0 })
    for (let i = 1; i < points.length; i++) {
      expect(distance(points[i - 1]!, points[i]!)).toBeCloseTo(PAS, 1)
    }
  })

  it('part de profil, se tourne vers le lecteur, puis se retourne de loin en loin', () => {
    expect(rotation(0, 3000)).toBeCloseTo(Math.PI / 2)
    expect(rotation(300, 3000)).toBeCloseTo(0)
    expect(rotation(800, 3000)).toBeCloseTo(Math.PI)
    expect(rotation(1600, 3000)).toBeCloseTo(2 * Math.PI)
  })

  it('ne se retourne pas trop près de sa fin : un retournement garde 260 px de ruban après lui', () => {
    expect(rotation(860, 870)).toBeCloseTo(0)
    expect(rotation(890, 900)).toBeCloseTo(Math.PI)
  })

  it('montre son endroit, puis son envers une fois retourné, sans jamais disparaître dans les plis', () => {
    const { courbes } = courbesPassantPar([
      { x: 50, y: 0 },
      { x: 50, y: 1200 },
    ])
    const { points, total } = echantillonner(courbes)
    const { bandes, pas } = construireRuban(points, total, 18)

    expect(pas).toHaveLength(points.length)
    expect(pas[Math.round(400 / PAS)]!.endroit).toBe(true)
    expect(pas[Math.round(400 / PAS)]!.demi).toBeCloseTo(9)
    expect(pas[Math.round(900 / PAS)]!.endroit).toBe(false)
    expect(Math.min(...pas.map((etape) => etape.demi))).toBeGreaterThanOrEqual(0.7)
    expect(bandes.length).toBeGreaterThan(1)
    expect(bandes.length).toBeLessThan(pas.length)
  })

  it('oriente l’encoche dans le sens du ruban, et n’en met pas tant que le ruban n’a pas commencé', () => {
    const { courbes } = courbesPassantPar([
      { x: 50, y: 0 },
      { x: 50, y: 600 },
    ])
    const { points, total } = echantillonner(courbes)
    const { pas } = construireRuban(points, total, 18)

    expect(placerEncoche(pas, 8, 9)).toBeNull()
    const encoche = placerEncoche(pas, 400, 9)!
    expect(encoche.x).toBeCloseTo(50)
    expect(encoche.y).toBeCloseTo(400, 0)
    expect(encoche.angle).toBeCloseTo(90)
    expect(encoche.echelle).toBeCloseTo(1)
  })

  it('déroule le ruban jusqu’à la hauteur atteinte par la lecture', () => {
    const echantillons = [0, 100, 200, 300].map((y) => ({ y, l: y * 2 }))

    expect(longueurAtteinte(echantillons, -50)).toBe(0)
    expect(longueurAtteinte(echantillons, 150)).toBe(200)
    expect(longueurAtteinte(echantillons, 5000)).toBe(600)
  })
})

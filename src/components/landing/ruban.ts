// Calculs du ruban marque-page de la page d'accueil, sans affichage : forme, plis, couleurs et encoche

export interface Point {
  x: number
  y: number
}

/** Une étape du ruban, tous les PAS pixels : position, normale (vers sa gauche), demi-largeur visible */
export interface PasRuban {
  p: Point
  n: Point
  demi: number
  nuance: number
  endroit: boolean
}

export interface Encoche {
  x: number
  y: number
  angle: number
  echelle: number
}

export const PAS = 4
const NUANCES = 14

export const lisse = (debut: number, fin: number, v: number) => {
  const t = Math.min(Math.max((v - debut) / (fin - debut), 0), 1)
  return t * t * (3 - 2 * t)
}

const melange = (a: number[], b: number[], t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i]! - v) * t)).join(',')})`

// Endroit (rouge) et envers (plus sombre) du ruban, assombris quand il se présente par la tranche
const ENDROIT = { tranche: [110, 4, 9], face: [229, 9, 20] }
const ENVERS = { tranche: [70, 2, 6], face: [150, 6, 13] }

/** Rotation du ruban sur lui-même : de profil au départ, il se tourne vers nous, puis se retourne de loin en loin */
export function rotation(l: number, total: number) {
  let angle = (Math.PI / 2) * (1 - lisse(0, 280, l))
  for (let centre = 620; centre < total - 260; centre += 780) {
    angle += Math.PI * lisse(centre - 110, centre + 110, l)
  }
  return angle
}

/** Courbes qui passent par chaque point, en partant et en arrivant à la verticale */
export function courbesPassantPar(points: Point[]): { d: string; courbes: Point[][] } {
  const courbes: Point[][] = []
  let d = `M ${points[0]!.x} ${points[0]!.y}`
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!
    const b = points[i]!
    const dy = (b.y - a.y) * 0.55
    const c1 = { x: a.x, y: a.y + dy }
    const c2 = { x: b.x, y: b.y - dy }
    courbes.push([a, c1, c2, b])
    d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`
  }
  return { d, courbes }
}

/**
 * Points du chemin tous les PAS pixels, calculés ici plutôt que demandés au navigateur
 * (getPointAtLength est très lent dans Firefox : plusieurs secondes pour tout le ruban)
 */
export function echantillonner(courbes: Point[][]): { points: Point[]; total: number } {
  const dense: { p: Point; l: number }[] = []
  let l = 0
  for (const [a, c1, c2, b] of courbes as [Point, Point, Point, Point][]) {
    const etendue = Math.hypot(b.x - a.x, b.y - a.y) + Math.abs(c1.y - a.y) + Math.abs(b.y - c2.y)
    const n = Math.max(8, Math.ceil(etendue / 2))
    for (let i = dense.length ? 1 : 0; i <= n; i++) {
      const s = i / n
      const u = 1 - s
      const p = {
        x: u * u * u * a.x + 3 * u * u * s * c1.x + 3 * u * s * s * c2.x + s * s * s * b.x,
        y: u * u * u * a.y + 3 * u * u * s * c1.y + 3 * u * s * s * c2.y + s * s * s * b.y,
      }
      const precedent = dense[dense.length - 1]
      if (precedent) l += Math.hypot(p.x - precedent.p.x, p.y - precedent.p.y)
      dense.push({ p, l })
    }
  }
  const points: Point[] = []
  let j = 0
  for (let cible = 0; cible <= l; cible += PAS) {
    while (j < dense.length - 2 && dense[j + 1]!.l < cible) j++
    const a = dense[j]!
    const b = dense[j + 1] ?? a
    const t = b.l > a.l ? (cible - a.l) / (b.l - a.l) : 0
    points.push({ x: a.p.x + (b.p.x - a.p.x) * t, y: a.p.y + (b.p.y - a.p.y) * t })
  }
  return { points, total: l }
}

/** Le ruban découpé en bandes, chacune de la largeur et de la nuance que lui donne sa rotation */
export function construireRuban(
  points: Point[],
  total: number,
  epaisseur: number,
): { bandes: { points: string; couleur: string }[]; pas: PasRuban[] } {
  const pas: PasRuban[] = points.map((p, i) => {
    const avant = points[Math.max(i - 1, 0)]!
    const apres = points[Math.min(i + 1, points.length - 1)]!
    const dx = apres.x - avant.x
    const dy = apres.y - avant.y
    const norme = Math.hypot(dx, dy) || 1
    const cos = Math.cos(rotation(i * PAS, total))
    return {
      p,
      n: { x: -dy / norme, y: dx / norme },
      demi: Math.max(0.7, (epaisseur * Math.abs(cos)) / 2),
      nuance: Math.round(Math.abs(cos) * (NUANCES - 1)) / (NUANCES - 1),
      endroit: cos >= 0,
    }
  })
  const couleur = (nuance: number, endroit: boolean) => {
    const teintes = endroit ? ENDROIT : ENVERS
    return melange(teintes.tranche, teintes.face, nuance)
  }
  const bord = (e: PasRuban, sens: number) =>
    `${e.p.x + e.n.x * e.demi * sens},${e.p.y + e.n.y * e.demi * sens}`

  // Les étapes consécutives de même nuance forment une seule bande : moins de formes à dessiner
  const bandes: { points: string; couleur: string }[] = []
  let debut = 0
  for (let i = 1; i <= pas.length; i++) {
    const a = pas[debut]!
    const fin = i === pas.length || pas[i]!.nuance !== a.nuance || pas[i]!.endroit !== a.endroit
    if (!fin) continue
    const morceau = pas.slice(debut, Math.min(i + 1, pas.length))
    const gauche = morceau.map((e) => bord(e, 1))
    const droite = morceau.map((e) => bord(e, -1)).reverse()
    bandes.push({ points: [...gauche, ...droite].join(' '), couleur: couleur(a.nuance, a.endroit) })
    debut = i
  }
  return { bandes, pas }
}

/**
 * L'encoche en V au bout du ruban, découpée dans le ruban lui-même pour qu'il garde ses couleurs jusqu'au bout :
 * orientée comme lui, elle s'affine avec lui quand il se retourne
 */
export function placerEncoche(pas: PasRuban[], fin: number, demiLargeur: number): Encoche | null {
  const etape = pas[Math.min(Math.round(fin / PAS), pas.length - 1)]
  if (!etape || fin < 12) return null
  return {
    x: etape.p.x,
    y: etape.p.y,
    angle: (Math.atan2(-etape.n.x, etape.n.y) * 180) / Math.PI,
    echelle: Math.max(etape.demi / demiLargeur, 0.06),
  }
}

/** Longueur de ruban déroulée quand la lecture atteint la hauteur `cible` de la page */
export function longueurAtteinte(echantillons: { y: number; l: number }[], cible: number) {
  let dessine = 0
  for (const point of echantillons) {
    if (point.y > cible) break
    dessine = point.l
  }
  return dessine
}

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import {
  construireRuban,
  courbesPassantPar,
  echantillonner,
  longueurAtteinte,
  PAS,
  placerEncoche,
  type Encoche,
  type PasRuban,
  type Point,
} from './ruban'

// Ruban marque-page : il part de l'élément data-fil-depart de la page qui le contient, puis longe chaque élément
// marqué data-fil, à droite (« d ») ou à gauche (« g »), et se déroule avec la lecture
const svg = ref<SVGSVGElement | null>(null)
const chemin = ref('')
const largeur = ref(0)
const hauteur = ref(0)
const longueur = ref(0)
const decalage = ref(0)
const demiLargeur = ref(9)
const bandes = ref<{ points: string; couleur: string }[]>([])
const encoche = ref<Encoche | null>(null)

let echantillons: { y: number; l: number }[] = []
let etapes: PasRuban[] = []
let observateur: ResizeObserver | null = null
let signature = ''
let traceDemande = 0
let suiviDemande = 0
const mouvementReduit = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

function ancres(page: HTMLElement): Point[] | null {
  const depart = page.querySelector('[data-fil-depart]')
  if (!depart) return null
  const cadre = page.getBoundingClientRect()
  // Sous 760 px, les extraits de sites sont empilés : le ruban les longe à droite au lieu de passer derrière
  const etroit = cadre.width < 760
  const bord = demiLargeur.value + 2
  const marge = Math.min(40, cadre.width * 0.045)
  const mot = depart.getBoundingClientRect()
  const points: Point[] = [
    { x: mot.left - cadre.left + mot.width / 2, y: mot.bottom - cadre.top + 4 },
  ]
  let vague = 1
  for (const element of page.querySelectorAll<HTMLElement>('[data-fil]')) {
    const zone = element.getBoundingClientRect()
    if (etroit && element.closest('.extraits')) {
      // Dans la marge de droite, deux points par extrait, décalés l'un vers l'autre : de petites ondulations
      const axe = cadre.width - bord - 2
      for (const part of [0.25, 0.75]) {
        points.push({ x: axe + 3 * vague, y: zone.top - cadre.top + zone.height * part })
        vague = -vague
      }
      continue
    }
    const x =
      element.dataset.fil === 'd' ? zone.right - cadre.left + marge : zone.left - cadre.left - marge
    points.push({
      x: Math.min(Math.max(x, bord), cadre.width - bord),
      y: zone.top - cadre.top + zone.height / 2,
    })
  }
  return points
}

function tracer() {
  const page = svg.value?.parentElement
  if (!page) return
  const cadre = page.getBoundingClientRect()
  largeur.value = cadre.width
  // La boîte de la page, et non scrollHeight, qui compterait le SVG lui-même : sa hauteur ne pourrait plus diminuer
  hauteur.value = cadre.height
  const epaisseur = cadre.width < 760 ? 12 : 18
  demiLargeur.value = epaisseur / 2
  const points = ancres(page)
  if (!points) return

  // Rien n'a bougé (polices chargées, image arrivée ailleurs) : le ruban déjà construit reste valable
  const nouvelle = `${cadre.width}|${points.map((q) => `${Math.round(q.x)},${Math.round(q.y)}`).join(';')}`
  if (nouvelle !== signature) {
    signature = nouvelle
    const { d, courbes } = courbesPassantPar(points)
    const { points: suite, total } = echantillonner(courbes)
    const ruban = construireRuban(suite, total, epaisseur)
    chemin.value = d
    longueur.value = total
    bandes.value = ruban.bandes
    etapes = ruban.pas
    echantillons = suite.filter((_, i) => i % 2 === 0).map((q, i) => ({ y: q.y, l: i * PAS * 2 }))
  }
  suivre()
}

// Le ruban se déroule jusqu'aux trois quarts de l'écran : il avance avec la lecture
function suivre() {
  const page = svg.value?.parentElement
  if (!page) return
  const dessine = mouvementReduit
    ? longueur.value
    : longueurAtteinte(echantillons, window.innerHeight * 0.75 - page.getBoundingClientRect().top)
  // Le bout du ruban dépasse du point atteint de la longueur de sa queue d'aronde
  const fin = dessine < 12 ? dessine : Math.min(dessine + demiLargeur.value * 5, longueur.value)
  decalage.value = longueur.value - fin
  encoche.value = placerEncoche(etapes, fin, demiLargeur.value)
}

// Un seul calcul par image affichée, quel que soit le nombre d'événements (défilement, images qui arrivent)
function demanderTrace() {
  cancelAnimationFrame(traceDemande)
  traceDemande = requestAnimationFrame(tracer)
}

function demanderSuivi() {
  cancelAnimationFrame(suiviDemande)
  suiviDemande = requestAnimationFrame(suivre)
}

onMounted(() => {
  tracer()
  document.fonts?.ready.then(demanderTrace)
  observateur = new ResizeObserver(demanderTrace)
  const page = svg.value?.parentElement
  if (page) observateur.observe(page)
  window.addEventListener('scroll', demanderSuivi, { passive: true })
})

onUnmounted(() => {
  observateur?.disconnect()
  cancelAnimationFrame(traceDemande)
  cancelAnimationFrame(suiviDemande)
  window.removeEventListener('scroll', demanderSuivi)
})
</script>

<template>
  <svg
    ref="svg"
    class="fil"
    :width="largeur"
    :height="hauteur"
    :viewBox="`0 0 ${largeur} ${hauteur}`"
    aria-hidden="true"
  >
    <defs>
      <!-- Le déroulé : seule la partie du chemin déjà parcourue laisse voir le ruban -->
      <mask id="ruban-deroule" maskUnits="userSpaceOnUse">
        <path
          :d="chemin"
          :pathLength="longueur"
          class="masque"
          :style="{ strokeDasharray: longueur, strokeDashoffset: decalage }"
        />
        <polygon
          v-if="encoche"
          :transform="`translate(${encoche.x} ${encoche.y}) rotate(${encoche.angle}) scale(1 ${encoche.echelle})`"
          :points="`${-demiLargeur * 1.6},0 2,${demiLargeur * 1.3} 2,${-demiLargeur * 1.3}`"
          fill="#000"
        />
      </mask>
    </defs>
    <g mask="url(#ruban-deroule)" class="ruban">
      <polygon
        v-for="(bande, index) in bandes"
        :key="index"
        :points="bande.points"
        :fill="bande.couleur"
        :stroke="bande.couleur"
      />
    </g>
  </svg>
</template>

<style scoped>
.fil {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.masque {
  fill: none;
  stroke: #fff;
  stroke-width: 60;
}

.ruban {
  filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.55));
}

.ruban polygon {
  stroke-width: 0.6;
  stroke-linejoin: round;
}
</style>

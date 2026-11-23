// La classe modal-open fige le <body> (position: fixed), seul moyen d'empêcher le défilement derrière une fenêtre
// sur iOS ; figé, il remonterait en haut : on le décale de la position de défilement, rendue à la fermeture
let savedScrollY: number | null = null

export function lockScroll(): void {
  if (savedScrollY !== null) return
  savedScrollY = window.scrollY
  document.body.style.top = `-${savedScrollY}px`
  document.body.classList.add('modal-open')
}

/** @param restore faux quand on quitte la page : la suivante garde sa propre position */
export function unlockScroll(restore = true): void {
  if (savedScrollY === null) return
  const position = savedScrollY
  savedScrollY = null
  document.body.classList.remove('modal-open')
  document.body.style.top = ''
  if (restore) window.scrollTo(0, position)
}

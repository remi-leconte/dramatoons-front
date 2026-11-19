// Après une mise en production, un onglet resté ouvert fait tourner l'ancienne version : les pages
// chargées à la demande réclament des fichiers qui n'existent plus sur le serveur. Recharger
// l'application récupère la nouvelle version, sans demander à l'utilisateur de le faire lui-même.
import type { Router } from 'vue-router'

export const RELOAD_KEY = 'dramatoons_reload_after_update'

// Un nouvel échec juste après un rechargement ne vient pas d'une mise à jour (fichier vraiment
// absent, réseau coupé) : recharger encore tournerait en boucle.
export const MIN_RELOAD_INTERVAL_MS = 10_000

// Gestionnaire de l'événement `vite:preloadError`. `navigate` recharge l'application sur la page
// demandée : au moment de l'échec, l'adresse affichée est encore celle de la page précédente.
export function createPreloadErrorHandler(navigate: () => void): (event: Event) => void {
  // Vite émet l'événement une fois par fichier manquant (la page et ses dépendances) : un seul
  // rechargement suffit, et les erreurs suivantes ne doivent pas s'afficher pendant qu'il se fait
  let reloading = false

  return (event: Event) => {
    if (reloading) {
      event.preventDefault()
      return
    }
    try {
      const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
      if (Date.now() - last < MIN_RELOAD_INTERVAL_MS) return
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
    } catch {
      // Sans sessionStorage, impossible de détecter une boucle : on laisse l'erreur s'afficher
      return
    }
    reloading = true
    // Empêche Vite de lever l'erreur : la page est rechargée à la place
    event.preventDefault()
    navigate()
  }
}

// Page en cours de chargement : au moment de l'échec, la navigation n'est pas terminée et l'adresse
// affichée est encore l'ancienne. Recharger sur cette page amène l'utilisateur là où il allait.
export function trackRequestedPath(router: Router, initialPath: string): () => string {
  let requestedPath = initialPath
  router.beforeEach((to) => {
    requestedPath = to.fullPath
  })
  return () => requestedPath
}

import { COVER_BASE_URL } from './api'

/**
 * Adresse de la couverture d'un webtoon, ou null s'il n'en a pas : le composant affiche alors son visuel de
 * remplacement, sans requête. `updated` contourne le cache du navigateur après un nouvel envoi.
 */
export function coverUrl(image?: string | null, updated?: string): string | null {
  if (!image) return null
  return updated
    ? `${COVER_BASE_URL}${image}?t=${new Date(updated).getTime()}`
    : `${COVER_BASE_URL}${image}`
}

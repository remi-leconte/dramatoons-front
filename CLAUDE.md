# Dramatoons : front

Vue 3.5 (Composition API, `<script setup lang="ts">`), TypeScript, Vite, Pinia, Vue Router, axios. Pas de framework CSS : styles `scoped` et variables dans `src/assets/base.css`. Interface en français.

## Commandes
Les dépendances ne sont installées que dans le conteneur. Depuis `front/` :

```sh
docker compose up -d                          # dev sur http://localhost:5173
docker compose exec front npm run type-check
docker compose exec front npm run build       # type-check + build
docker compose exec front npm run lint        # applique --fix
docker compose exec front npm run format
docker compose exec front npm run ci          # vérifications de la CI, sans rien corriger (voir « CI »)
```

- `VITE_API_URL` est fixée au build en prod et staging. `VITE_STAGING_AUTH` ajoute l'en-tête `X-Staging-Auth`.
- Il n'y a pas de tests écrits (Vitest est configuré).

## Organisation
- **`src/services/api.ts`** : instance axios unique. Elle ajoute le JWT et refait la requête après un refresh si l'API répond `401 Expired JWT Token`. Elle exporte aussi `COVER_BASE_URL`.
- **`src/stores/auth.ts`** : session (`token`, `refreshToken`, `userId`, `login`, `roles`) stockée dans `localStorage`, plus `isAuthenticated`, `isAdmin` et `isModo` (modérateur ou administrateur).
- **`src/router/index.ts`** : routes, avec les `meta` `requiresAuth`, `guestOnly` et `roles`.
- **`src/types/`** : `Webtoon`, `WebtoonTitle`, `Progress` (= WebtoonUser), `User`, `HydraCollection`.
- **`src/composables/dashboard/`** :
  - `useWebtoonSearch` : onglet, filtres et tri, mémorisés dans `localStorage` (`dramatoons_search_prefs`) ;
  - `useWebtoonProgress` : changement de `state` ou de `bookmark`, et `saveProgress()` (aussi utilisée par `WebtoonModal`) : `POST` si le suivi n'existe pas, sinon `PATCH`, et `DELETE` s'il devient vide (`isEmptyProgress()` : ni note ni état, chapitre vide ou 0), car l'API refuse un suivi vide.
- **Composants** :
  - `components/dashboard/` : `DashboardHeader` (menu admin), `DashboardFilterBar`, `WebtoonCard` et `WebtoonModal`, qui crée, édite ou supprime un webtoon, gère titres, couverture et progression ;
  - `components/modal/` : formulaire de progression et upload de couverture (JPEG ≤ 1 Mo, contrôlé avant l'envoi) ;
  - `components/HeaderSearch.vue` : recherche du bandeau (`mode=search`) ;
  - `components/CanvasView.vue` : planche explicative de la page d'accueil.

## Routes
| Route | Vue |
| --- | --- |
| `/` | `DashboardView` si connecté (onglets `bibliotheque` et `catalogue`), sinon `LandingView` |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Réservées aux invités. `/login?status=registered\|verified\|modifiedLogin\|resetPassword` affiche un message |
| `/verify`, `/profile` | Validation de l'email ; profil (connexion requise) |
| `/admin/users[/:id]` | `ROLE_ADMIN` |
| `/admin/webtoons[/:id]` | `ROLE_MODO` ou `ROLE_ADMIN` (le lien vers la fiche d'un lecteur n'est affiché qu'à l'admin) |
| `/privacy`, `/install-tutorial` | Pages statiques |

## Conventions d'appel à l'API
- `PATCH` doit préciser `Content-Type: application/merge-patch+json` à chaque appel : l'intercepteur ne pose `application/ld+json` que sur `POST` et `PUT`.
- Les relations s'envoient sous forme d'IRI : `webtoon: '/webtoons/12'`.
- Les collections sont en JSON-LD. Le type `HydraCollection` accepte `member` et `hydra:member`, de même pour `totalItems` : garder les deux lectures.
- `GET /webtoons` exige le paramètre `mode`, sinon la réponse est vide.
- Les couvertures s'affichent via `COVER_BASE_URL`, avec `?t=<updated>` pour contourner le cache navigateur (6 mois côté nginx).

## CI
`.github/workflows/ci.yml` (GitHub Actions) tourne sur chaque PR vers `main` ou `release/*`, sur un runner Ubuntu de GitHub. Deux checks, obligatoires pour fusionner :
- **Vérifications** : Node 24, `npm ci`, puis `npm run ci`, qui enchaîne sans rien corriger :
  1. `type-check` (vue-tsc) ;
  2. `oxlint` puis `eslint`, tout avertissement compte comme une erreur ;
  3. `prettier --check` sur `src/` : le formatage de `.prettierrc.json` (corriger avec `npm run format`).
- **Image prod** : construit l'étape `prod` du `Dockerfile`, sans `VITE_API_URL` et sans la publier.

## Git
Workflow (branches, PR, tickets, releases) : skill `workflow-github`.

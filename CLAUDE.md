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
docker compose exec front npm test            # tests Vitest, un seul passage (voir « Tests »)
docker compose exec front npm run test:unit   # tests Vitest relancés à chaque modification (mode watch)
```

- `compose.override.yaml` (dev) se superpose automatiquement à `compose.yaml` et construit l'image `dev` ; en recette et en prod, c'est `compose.prod.yaml`, qui utilise l'image publiée (voir « Configuration » et « Publication et déploiement »).

## Configuration
L'adresse de l'API est lue au démarrage, pas au build : la même image sert la recette et la prod.
- **`public/config.js`**, versionné : définit `window.APP_CONFIG` (`apiUrl`, `stagingAuth`) avec les valeurs du dev. `index.html` le charge avant l'application, et `src/services/api.ts` le lit. Si `stagingAuth` n'est pas vide, chaque requête porte l'en-tête `X-Staging-Auth`.
- **En recette et en prod**, le conteneur nginx réécrit `config.js` à son démarrage (`docker/40-config-js.sh`, à partir de `docker/config.js.template`) avec ses variables d'environnement `API_URL` et `STAGING_AUTH`, et le sert sans cache. Sans `API_URL`, il ne démarre pas. Ces valeurs sont placées entre apostrophes dans `config.js` : elles ne doivent contenir ni `'` ni `\`.
- Chaque serveur a un `.env.local`, non versionné, passé à Compose par `docker compose --env-file .env.local --env-file .env.image …`. `.env.image`, écrit par chaque déploiement, contient seulement `IMAGE_TAG` (`sha-<commit>` de l'image qui tourne) ; sans lui, Compose refuse. `.env.local` contient :
  - `COMPOSE_FILE=compose.yaml:compose.prod.yaml` ;
  - `DEPLOY_ENV` (`staging` ou `prod`) : nom du projet Compose ;
  - `HTTP_PORT` : port local de nginx ;
  - `API_URL` (obligatoire) et `STAGING_AUTH` (recette seulement, `login:mot de passe`).
- Compose remplace les `$` des valeurs de `.env.local` : une valeur qui en contient se met entre apostrophes (`'…'`).
- Il n'y a pas de variable `VITE_*` : une nouvelle valeur de configuration s'ajoute dans `public/config.js`, `docker/config.js.template`, `docker/40-config-js.sh` et l'`environment` de `compose.prod.yaml`.

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

## Tests
Vitest (`vitest.config.ts` reprend la configuration de Vite, donc l'alias `@/`), dans un faux navigateur (`jsdom` : `window`, `localStorage`…).
- Un fichier `*.spec.ts` dans un dossier `__tests__/` à côté du code testé (ex. `src/types/__tests__/progress.spec.ts`). Seuls ces dossiers sont lus par `tsconfig.vitest.json` et les règles Vitest d'ESLint (oxlint, lui, applique son plugin `vitest` à tout le projet) ; `tsconfig.app.json` les exclut. Les descriptions (`describe`, `it`) sont en français.
- Les tests ne contactent jamais l'API : `vi.mock('@/services/api', …)` remplace l'instance axios par des fonctions simulées (`vi.fn<…>()`, typées comme l'exige oxlint), dont on vérifie les appels (`toHaveBeenCalledWith`). Les règles de droits et de visibilité restent testées côté API.
- Un store Pinia s'utilise après `setActivePinia(createPinia())` dans `beforeEach` ; `window.confirm` se remplace par `vi.stubGlobal('confirm', …)`.
- Tests existants : logique des suivis (`isEmptyProgress`, `saveProgress`, `losesAccessWithoutProgress`, `confirmLeavingUnpublished`, `useWebtoonProgress`).

## CI
`.github/workflows/ci.yml` (GitHub Actions) tourne sur chaque PR vers `main` ou `release/*`, sur un runner Ubuntu de GitHub. Trois checks, obligatoires pour fusionner :
- **Vérifications** : Node 24, `npm ci`, puis `npm run ci`, qui enchaîne sans rien corriger :
  1. `type-check` (vue-tsc) ;
  2. `oxlint` puis `eslint`, tout avertissement compte comme une erreur ;
  3. `prettier --check` sur `src/` : le formatage de `.prettierrc.json` (corriger avec `npm run format`).
- **Tests** : Node 24, `npm ci`, puis `npm test`.
- **Image prod** : construit l'étape `prod` du `Dockerfile`, sans la publier.

## Publication et déploiement
`.github/workflows/publish.yml` construit l'étape `prod` du Dockerfile (`linux/amd64`) et la publie, publique, sur `ghcr.io/remi-leconte/dramatoons-front`.
- Déclenché par un `push` sur `release/*` (donc la fusion d'une PR) et par un tag `v*`, jamais par une PR : seul ce qui est déjà passé par la CI est publié.
- Étiquettes : `release-vX.Y.Z` (dernière fusion dans la release) et `sha-<commit>` sur `release/vX.Y.Z` ; `vX.Y.Z` sur un tag. Pas de `latest`.
- Job « Publication image », distinct du check « Image prod » de la CI. Les publications d'une même branche passent l'une après l'autre, sans annulation ; seule exception de GitHub : sur trois fusions très rapprochées, celle du milieu, encore en attente, est remplacée et son `sha-<commit>` n'est pas publié.
- Droits : le `GITHUB_TOKEN` du workflow, limité à `contents: read` et `packages: write` ; aucun secret.

Sur `release/*`, le job « Déploiement recette » suit la publication :
- Il tourne dans l'environnement GitHub `staging`, dont les secrets (`SSH_HOST`, `SSH_KNOWN_HOSTS`, `SSH_PRIVATE_KEY`) ne sont donnés qu'aux branches `release/*`.
- Il se connecte au serveur avec une clé dédiée, limitée côté serveur à un script de déploiement (hors dépôt), et ne lui transmet que `front` et le commit. Le script télécharge `compose.yaml` et `compose.prod.yaml` de ce commit, récupère l'image `sha-<commit>`, redémarre le conteneur, vérifie que le site répond, puis supprime les anciennes images.
- Le serveur ne construit rien et n'a plus besoin du code : seul `.env.local` y reste.
- Revenir à une version précédente : dans GitHub, ouvrir le run « Publication » d'un commit précédent de la release et relancer **seulement** son job « Déploiement recette » (« Re-run this job ») : GitHub ne relance pas la publication dont il dépend, et l'image déjà publiée, celle qui a été recettée, est redéployée. « Re-run all jobs » reconstruirait l'image, qui pourrait différer, et déplacerait `release-vX.Y.Z` sur ce commit : à éviter.
- Les journaux de GitHub Actions sont publics : le script n'y écrit ni configuration ni journaux des conteneurs.
- Recette de `main` et production, pas encore automatisées. Le tag `vX.Y.Z` publie l'image `vX.Y.Z`, sans déploiement. Le serveur ne construit plus d'image : l'ancienne méthode (code à jour sur le serveur, puis `up -d --build`) ne fonctionne plus à partir de la v2.4.0.
  - Recette de `main` : le script de déploiement accepte aussi un tag (`front vX.Y.Z` au lieu du commit), lancé à la main sur le serveur.
  - Production : dans son dossier sur le serveur, récupérer `compose.yaml` et `compose.prod.yaml` du tag `vX.Y.Z`, écrire `IMAGE_TAG=vX.Y.Z` dans `.env.image`, puis `docker compose --env-file .env.local --env-file .env.image pull` et `… up -d`.

## Git
Workflow (branches, PR, tickets, releases) : skill `workflow-github`.

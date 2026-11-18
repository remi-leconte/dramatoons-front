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
- **Cache** (`docker/nginx.conf`) : `index.html` et les routes de l'application sont revalidés à chaque visite (`no-cache`), car `index.html` désigne les fichiers de la version en cours ; les fichiers de `assets/`, dont le nom contient une empreinte qui change à chaque version, sont gardés un an. Un fichier de `assets/` absent (ancienne version) renvoie 404, sans repli sur `index.html`.
- **En recette et en prod**, le conteneur nginx réécrit `config.js` à son démarrage (`docker/40-config-js.sh`, à partir de `docker/config.js.template`) avec ses variables d'environnement `API_URL` et `STAGING_AUTH`, et le sert sans cache. Sans `API_URL`, il ne démarre pas. Ces valeurs sont placées entre apostrophes dans `config.js` : elles ne doivent contenir ni `'` ni `\`.
- Chaque serveur a un `.env.local`, non versionné, passé à Compose par `docker compose --env-file .env.local --env-file .env.image …`. `.env.image` contient seulement l'`IMAGE_TAG` de l'image qui tourne (`sha-<commit>` en recette d'une release, `vX.Y.Z` pour la recette de `main` et la prod), écrit par le script de déploiement ; sans lui, Compose refuse. `.env.local` contient :
  - `COMPOSE_FILE=compose.yaml:compose.prod.yaml` ;
  - `DEPLOY_ENV` (`staging` ou `prod`) : nom du projet Compose ;
  - `HTTP_PORT` : port local de nginx ;
  - `API_URL` (obligatoire) et `STAGING_AUTH` (recette seulement, `login:mot de passe`).
- Compose remplace les `$` des valeurs de `.env.local` : une valeur qui en contient se met entre apostrophes (`'…'`).
- Il n'y a pas de variable `VITE_*` : une nouvelle valeur de configuration s'ajoute dans `public/config.js`, `docker/config.js.template`, `docker/40-config-js.sh` et l'`environment` de `compose.prod.yaml`.

## Organisation
- **`src/services/api.ts`** : instance axios unique. Elle ajoute le JWT et refait la requête après un refresh si l'API répond `401 Expired JWT Token`. Elle exporte aussi `COVER_BASE_URL`.
- **`src/services/reloadOnUpdate.ts`** : après une mise en production, un onglet resté ouvert réclame des fichiers de l'ancienne version qui n'existent plus. Sur l'événement `vite:preloadError`, l'application se recharge une fois sur la page demandée (suivie par `trackRequestedPath`, car l'adresse affichée est encore l'ancienne au moment de l'échec). Garde-fou : pas de nouveau rechargement dans les 10 secondes (`sessionStorage`), ni sans `sessionStorage`.
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
- `GET /webtoons` exige le paramètre `mode`, sinon la réponse est vide. Son tri se demande par `sortBy` et `sortOrder`, pas par `order[…]` (ignoré : le listing passe par un fournisseur sur mesure de l'API) ; `GET /users`, lui, utilise `order[…]`.
- Les couvertures s'affichent via `COVER_BASE_URL`, avec `?t=<updated>` pour contourner le cache navigateur (6 mois côté nginx).

## Tests
Vitest (`vitest.config.ts` reprend la configuration de Vite, donc l'alias `@/`), dans un faux navigateur (`jsdom` : `window`, `localStorage`…).
- Un fichier `*.spec.ts` dans un dossier `__tests__/` à côté du code testé (ex. `src/types/__tests__/progress.spec.ts`). Seuls ces dossiers sont lus par `tsconfig.vitest.json` et les règles Vitest d'ESLint (oxlint, lui, applique son plugin `vitest` à tout le projet) ; `tsconfig.app.json` les exclut. Les descriptions (`describe`, `it`) sont en français.
- Les tests ne contactent jamais l'API : `vi.mock('@/services/api', …)` remplace l'instance axios par des fonctions simulées (`vi.fn<…>()`, typées comme l'exige oxlint), dont on vérifie les appels (`toHaveBeenCalledWith`). Les règles de droits et de visibilité restent testées côté API.
- Un store Pinia s'utilise après `setActivePinia(createPinia())` dans `beforeEach` ; `window.confirm` se remplace par `vi.stubGlobal('confirm', …)`.
- Tests existants : logique des suivis (`isEmptyProgress`, `saveProgress`, `losesAccessWithoutProgress`, `confirmLeavingUnpublished`, `useWebtoonProgress`) ; rechargement après une mise à jour (`createPreloadErrorHandler`, `trackRequestedPath`) ; tri de l'administration des webtoons (`WebtoonListView`, monté avec `@vue/test-utils`).

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
- Déclenché par un `push` sur `release/*` (donc la fusion d'une PR), jamais par une PR : seul ce qui est déjà passé par la CI est publié.
- Étiquettes : `release-vX.Y.Z` (dernière fusion dans la release) et `sha-<commit>`. Pas de `latest`. L'étiquette `vX.Y.Z` est ajoutée à la livraison, sans reconstruire l'image (voir « Livraison »).
- Job « Publication image », distinct du check « Image prod » de la CI. Les publications d'une même branche passent l'une après l'autre, sans annulation ; seule exception de GitHub : sur trois fusions très rapprochées, celle du milieu, encore en attente, est remplacée et son `sha-<commit>` n'est pas publié.
- Droits : aucun par défaut (`permissions: {}`). Le job « Publication image » n'a que le `GITHUB_TOKEN`, limité à `contents: read` et `packages: write`, et aucun secret ; les secrets SSH ne servent qu'au job « Déploiement recette » (ci-dessous).

Sur `release/*`, le job « Déploiement recette » suit la publication :
- Il tourne dans l'environnement GitHub `staging`, dont les secrets (`SSH_HOST`, `SSH_KNOWN_HOSTS`, `SSH_PRIVATE_KEY`) ne sont donnés qu'aux branches `release/*` et à `main` (livraison).
- Il se connecte au serveur avec une clé dédiée, limitée côté serveur à un script de déploiement (hors dépôt), et ne lui transmet que `front` et le commit. Le script télécharge `compose.yaml` et `compose.prod.yaml` de ce commit, récupère l'image `sha-<commit>`, redémarre le conteneur, vérifie que le site répond, puis supprime les anciennes images.
- La recette déployée ainsi ne construit rien : son dossier ne contient que `.env.local`, `.env.image` et les fichiers compose téléchargés, sans le code.
- Revenir à une version précédente :
  - dans GitHub, ouvrir le run « Publication » d'un commit précédent de la release et relancer **seulement** son job « Déploiement recette » (« Re-run this job ») : GitHub ne relance pas la publication dont il dépend, et l'image déjà publiée, celle qui a été recettée, est redéployée. « Re-run all jobs » reconstruirait l'image, qui pourrait différer, et déplacerait `release-vX.Y.Z` sur ce commit : à éviter ;
  - GitHub ne permet de relancer un job que dans les 30 jours qui suivent son run ; au-delà, lancer à la main sur le serveur le script de déploiement avec le commit voulu ;
  - seuls les commits fusionnés depuis l'arrivée du déploiement automatique (#149 et remi-leconte/dramatoons-api#111) se redéploient ainsi : avant, `compose.prod.yaml` construisait l'image à partir du code, absent du dossier de la recette. Pour revenir à un commit plus ancien, relancer l'ancienne recette, qui se construit dans un autre dossier du serveur contenant le code (procédure hors dépôt). Ce dossier y reste jusqu'au retrait de git du serveur, dernière étape de la mise en place du déploiement.
- Les journaux de GitHub Actions sont publics : le script n'y écrit ni configuration ni journaux des conteneurs.

## Livraison
`.github/workflows/livraison.yml` livre une release à sa fusion dans `main` (`push` sur `main`) :
1. **Release fusionnée** : retrouve la PR fusionnée et sa branche `release/vX.Y.Z`. Une autre fusion dans `main` (hotfix…) ne livre rien. Le workflow échoue sans rien livrer si le contenu de `main` diffère de celui du dernier commit de la release (hotfix non repris dans la release, conflit résolu à la fusion) ou si le tag `vX.Y.Z` existe déjà.
2. **Version** : ajoute l'étiquette `vX.Y.Z` à l'image `sha-<dernier commit de la release>`, celle qui a été recettée, sans la reconstruire, puis pose le tag `vX.Y.Z` sur `main`. Un tag posé avec le `GITHUB_TOKEN` ne déclenche aucun workflow : la suite se fait donc dans celui-ci.
3. **Déploiement recette** : déploie `vX.Y.Z` en recette (environnement `staging`, qui autorise `release/*` et `main`), pour une dernière vérification.
4. **Déploiement production** : attend l'approbation de l'utilisateur, puis déploie `vX.Y.Z`. L'environnement GitHub `production` exige cette approbation, sans contournement par un administrateur, et ne donne ses secrets qu'à `main`. Sa clé SSH est distincte de celle de la recette : le serveur la limite au déploiement de la production, qui n'accepte qu'une version `vX.Y.Z`.

- Approuver la production de l'API (remi-leconte/dramatoons-api) avant celle du front : le nouveau front peut appeler des points d'entrée que seule la nouvelle API connaît.
- Revenir à la version précédente en production : dans le run « Livraison » de cette version, relancer **seulement** le job « Déploiement production » (« Re-run this job », dans les 30 jours, avec une nouvelle approbation), ou lancer à la main sur le serveur le script de déploiement avec `vX.Y.Z`.

## Git
Workflow (branches, PR, tickets, releases) : skill `workflow-github`.

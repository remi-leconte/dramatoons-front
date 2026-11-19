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
- Chaque serveur a un `.env.local`, non versionné, passé à Compose par `docker compose --env-file .env.local --env-file .env.image …`. `.env.image` contient seulement l'`IMAGE_TAG` de l'image qui tourne (`sha-<commit>` en recette, `vX.Y.Z` en prod), écrit par le script de déploiement ; sans lui, Compose refuse. `.env.local` contient :
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
`.github/workflows/ci.yml` (GitHub Actions) tourne sur chaque PR vers `main` ou `release/*`, sur un runner Ubuntu de GitHub. Trois checks, obligatoires pour fusionner (vers `release/*`, s'y ajoute la relecture IA, ci-dessous) :
- **Vérifications** : Node 24, `npm ci`, puis `npm run ci`, qui enchaîne sans rien corriger :
  1. `type-check` (vue-tsc) ;
  2. `oxlint` puis `eslint`, tout avertissement compte comme une erreur ;
  3. `prettier --check` sur `src/` : le formatage de `.prettierrc.json` (corriger avec `npm run format`).
- **Tests** : Node 24, `npm ci`, puis `npm test`.
- **Image prod** : construit l'étape `prod` du `Dockerfile`, sans la publier.

### Relecture IA
`.github/workflows/relecture.yml` relit chaque PR vers `release/*` (ouverture, nouveau push, sortie de brouillon) avec Claude Code (`anthropics/claude-code-action`), et produit le check « Relecture IA » :
- Seulement pour les PR de `remi-leconte` dont la branche vient du dépôt : le jeton de l'abonnement Claude (secret `CLAUDE_CODE_OAUTH_TOKEN`) n'est jamais utilisé pour une PR extérieure. Pour toute autre PR, le check est rouge (« pas de relecture IA ») plutôt que sauté, car un check sauté compte comme réussi : une telle PR se relit à la main. Un brouillon n'est pas relu : son check est rouge (« pas encore relu ») jusqu'au passage en prêt, qui lance la relecture ; sauté, il serait vert. Un nouveau push annule la relecture en cours.
- Une PR de synchronisation (`main` → `release/*`, après un hotfix ou une livraison) a le check vert sans relecture IA : son contenu a déjà été relu et livré.
- Le job rassemble d'abord, sans IA, le contexte dans `_relecture/` : la PR, son ticket, le ticket principal et ses sous-tickets, et les PR ouvertes des autres dépôts pour ces tickets. Les PR d'un même ticket sont ainsi relues ensemble, pour la cohérence entre l'API et le front. Elles sont ouvertes en brouillon, puis passées prêtes ensemble (`gh pr ready`) : chaque relecture trouve ainsi toutes les autres.
- Une branche hors convention, ou dont le ticket est introuvable, n'arrête pas le job : la relecture la signale comme remarque. Une autre erreur de lecture d'un ticket (GitHub indisponible) fait échouer le job sans verdict.
- Claude lit ensuite les consignes de `relecture/consignes.md` du dépôt `dramatoons-workspace` (cloné dans `_workspace/`), avec les règles métier et le workflow. Ses seuls outils disponibles sont Read, Glob et Grep (`--tools`) : ni Bash, ni écriture, ni sous-agent, ni accès à GitHub. La configuration Claude du dépôt relu (`CLAUDE.md`, `.claude/`, `.mcp.json`) n'est pas chargée (`--setting-sources user`) : une PR ne peut ni changer les consignes du relecteur ni lui faire lancer une commande par un hook ou un serveur MCP ; il lit le `CLAUDE.md` comme une donnée. Il rend un verdict JSON.
- Le check « Relecture IA » est obligatoire pour fusionner dans `release/*` (ruleset des releases), en plus des trois checks de la CI. Les PR `release/*` → `main` ne sont pas relues, leur contenu l'ayant été ticket par ticket : le ruleset de `main` ne doit pas l'exiger, sans quoi elles resteraient bloquées faute de run.
- Check rouge à la moindre remarque, vert sinon. Le verdict et les remarques sont publiés en commentaire de la PR par un second job, seul à avoir le droit d'écrire sur la PR. Le texte lui est passé par une sortie de job, ce qui permet de relancer le run sans conflit.
- La relecture ne fusionne rien, et la fusion automatique de GitHub n'est pas utilisée : un ticket qui touche l'API et le front a une PR dans chaque dépôt, que GitHub fusionnerait chacune de son côté. Claude fusionne toutes les PR du ticket ensemble, une fois toutes vertes, ou aucune (skill `workflow-github`).
- Chaque relecture consomme le quota de l'abonnement. Si le quota est atteint, le check échoue : relancer le job plus tard (« Re-run failed jobs »).
- Après une correction poussée sur une seule PR d'un ticket, relancer aussi la relecture des autres PR du ticket, qui ont vu l'ancienne version.

## Publication et déploiement
`.github/workflows/publish.yml` construit l'étape `prod` du Dockerfile (`linux/amd64`) et la publie, publique, sur `ghcr.io/remi-leconte/dramatoons-front`.
- Déclenché par un `push` sur `release/*` (donc la fusion d'une PR), jamais par une PR : seul ce qui est déjà passé par la CI est publié.
- Étiquettes : `release-vX.Y.Z` (dernière fusion dans la release) et `sha-<commit>`. Pas de `latest`. L'étiquette `vX.Y.Z` est ajoutée à la livraison, sans reconstruire l'image (voir « Livraison »).
- Job « Publication image », distinct du check « Image prod » de la CI. Les publications d'une même branche passent l'une après l'autre, sans annulation ; seule exception de GitHub : sur trois fusions très rapprochées, celle du milieu, encore en attente, est remplacée et son `sha-<commit>` n'est pas publié.
- Droits : aucun par défaut (`permissions: {}`). Le job « Publication image » n'a que le `GITHUB_TOKEN`, limité à `contents: read` et `packages: write`, et aucun secret ; dans ce workflow, les secrets SSH ne servent qu'au job « Déploiement recette » (ci-dessous).

Sur `release/*`, le job « Déploiement recette » suit la publication :
- Il tourne dans l'environnement GitHub `staging`, dont les secrets (`SSH_HOST`, `SSH_KNOWN_HOSTS`, `SSH_PRIVATE_KEY`) ne sont donnés qu'aux branches `release/*`.
- Il se connecte au serveur avec une clé dédiée, limitée côté serveur à un script de déploiement (hors dépôt), et ne lui transmet que `front` et le commit. Le script télécharge `compose.yaml` et `compose.prod.yaml` de ce commit, récupère l'image `sha-<commit>`, redémarre le conteneur, vérifie que le site répond, puis supprime les anciennes images.
- La recette déployée ainsi ne construit rien : son dossier ne contient que `.env.local`, `.env.image` et les fichiers compose téléchargés, sans le code.
- Revenir à une version précédente :
  - dans GitHub, ouvrir le run « Publication » d'un commit précédent de la release et relancer **seulement** son job « Déploiement recette » (« Re-run this job ») : GitHub ne relance pas la publication dont il dépend, et l'image déjà publiée, celle qui a été recettée, est redéployée. « Re-run all jobs » reconstruirait l'image, qui pourrait différer, et déplacerait `release-vX.Y.Z` sur ce commit : à éviter ;
  - GitHub ne permet de relancer un job que dans les 30 jours qui suivent son run ; au-delà, lancer à la main sur le serveur le script de déploiement avec le commit voulu ;
  - seuls les commits fusionnés depuis l'arrivée du déploiement automatique (#149 et remi-leconte/dramatoons-api#111) se redéploient ainsi : avant, `compose.prod.yaml` construisait l'image à partir du code, absent du dossier de la recette. Pour revenir à un commit plus ancien, relancer l'ancienne recette, qui se construit dans un autre dossier du serveur contenant le code (procédure hors dépôt). Ce dossier y reste jusqu'au retrait de git du serveur, dernière étape de la mise en place du déploiement.
- Les journaux de GitHub Actions sont publics : le script n'y écrit ni configuration ni journaux des conteneurs.

## Livraison
`.github/workflows/livraison.yml` livre une release à sa fusion dans `main` (`push` sur `main`) :
1. **Release fusionnée** : retrouve la PR fusionnée et sa branche `release/vX.Y.Z`. Un hotfix passe lui aussi par sa propre release (`release/vX.Y.Z` de la version corrigée, skill `workflow-github`) et se livre de la même façon ; une fusion qui ne vient pas d'une release n'a pas d'image recettée et ne livre rien. Le workflow échoue sans rien livrer si le contenu de `main` diffère de celui du dernier commit de la release (hotfix non repris dans la release, conflit résolu à la fusion) ou si le tag `vX.Y.Z` existe déjà.
2. **Version** : ajoute l'étiquette `vX.Y.Z` à l'image `sha-<dernier commit de la release>`, celle qui a été recettée, sans la reconstruire, puis pose le tag `vX.Y.Z` sur `main`. Un tag posé avec le `GITHUB_TOKEN` ne déclenche aucun workflow : la suite se fait donc dans celui-ci.
3. **Déploiement production** : attend l'approbation de l'utilisateur, puis déploie `vX.Y.Z`. La recette n'est pas redéployée : elle tourne déjà sur l'image recettée, la même que `vX.Y.Z`. L'environnement GitHub `production` exige cette approbation, sans contournement par un administrateur, et ne donne ses secrets qu'à `main`. Sa clé SSH est distincte de celle de la recette : le serveur la limite au déploiement de la production, qui n'accepte qu'une version `vX.Y.Z`.

- Droits : aucun par défaut (`permissions: {}`). « Release fusionnée » a `contents: read` et `pull-requests: read` ; « Version », `contents: write` (tag) et `packages: write` (étiquette de l'image) ; « Déploiement production » n'a aucun droit, seulement les secrets SSH de son environnement.
- Les livraisons passent l'une après l'autre (groupe de concurrence `livraison`) : tant que son déploiement en production attend l'approbation, un run bloque la livraison suivante, et une nouvelle fusion dans `main` remplacerait celle qui attend. Si la version ne doit finalement pas partir en production, **rejeter** le job « Déploiement production » (« Reject »), puis corriger par un hotfix.
- Approuver la production de l'API (remi-leconte/dramatoons-api) avant celle du front : le nouveau front peut appeler des points d'entrée que seule la nouvelle API connaît.
- Revenir à la version précédente en production :
  - dans le run « Livraison » de la version précédente, relancer **seulement** le job « Déploiement production » (« Re-run this job », dans les 30 jours, avec une nouvelle approbation), ou lancer à la main sur le serveur le script de déploiement avec le `vX.Y.Z` de cette version ;
  - seules les versions livrées par ce workflow (à partir de la v2.4.0) se redéploient ainsi : les plus anciennes n'ont ni `compose.prod.yaml` qui utilise une image publiée, ni run « Livraison ». Pour revenir avant la v2.4.0, relancer l'ancienne production, qui se construit dans un autre dossier du serveur contenant le code (procédure hors dépôt). Ce dossier y reste jusqu'au retrait de git du serveur.

## Git
Workflow (branches, PR, tickets, releases) : skill `workflow-github`.

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
- Seule exception, la **version du site** (pied de page) est inscrite à la construction et non lue au démarrage : elle fait partie de l'image, livrée telle quelle en production. `publish.yml` la déduit de la branche (`release/vX.Y.Z` donne `vX.Y.Z`) et la passe en `--build-arg APP_VERSION` ; le `Dockerfile` la transmet à `npm run build`, et `vite.config.ts` l'inscrit dans `__APP_VERSION__`. Sans elle (dev, check « Image prod » de la CI), le site affiche `dev`.

## Organisation
- **`src/services/api.ts`** : instance axios unique. Elle ajoute le JWT et refait la requête après un refresh si l'API répond `401 Expired JWT Token`. Elle exporte aussi `COVER_BASE_URL`.
- **`src/services/scrollLock.ts`** : `lockScroll()` et `unlockScroll()`, appelés par `DashboardView` à l'ouverture et à la fermeture de la fenêtre d'un webtoon. La classe `modal-open` fige le `<body>` (`position: fixed`, seul moyen de bloquer le défilement derrière la fenêtre sur iOS) ; décalé de la position de défilement, il ne remonte pas en haut, et cette position est rendue à la fermeture.
- **`src/services/cover.ts`** : `coverUrl(image, updated)`, l'adresse de la couverture d'un webtoon, ou `null` s'il n'en a pas.
- **`src/services/reloadOnUpdate.ts`** : après une mise en production, un onglet resté ouvert réclame des fichiers de l'ancienne version qui n'existent plus. Sur l'événement `vite:preloadError`, l'application se recharge une fois sur la page demandée (suivie par `trackRequestedPath`, car l'adresse affichée est encore l'ancienne au moment de l'échec). Garde-fou : pas de nouveau rechargement dans les 10 secondes (`sessionStorage`), ni sans `sessionStorage`.
- **`src/stores/auth.ts`** : session (`token`, `refreshToken`, `userId`, `login`, `roles`) stockée dans `localStorage`, plus `isAuthenticated`, `isAdmin` et `isModo` (modérateur ou administrateur).
- **`src/router/index.ts`** : routes, avec les `meta` `requiresAuth`, `guestOnly` et `roles`.
- **`src/types/`** : `Webtoon`, `WebtoonTitle`, `Progress` (= WebtoonUser), `User`, `HydraCollection`.
- **`src/composables/dashboard/`** :
  - `useWebtoonSearch` : onglet, filtres et tri, mémorisés dans `localStorage` (`dramatoons_search_prefs`). Le premier tri garde la clé `added` dans les deux onglets : « Dernier ajout » du catalogue envoie `added`, « Modification » de la bibliothèque envoie `user_updated` (dernière modification du suivi). La liste affichée n'est pas retriée après une modification de suivi : le tri s'applique au prochain chargement de la liste ;
  - `useWebtoonProgress` : changement de `state` ou de `bookmark`, et `saveProgress()` (aussi utilisée par `WebtoonModal`) : `POST` si le suivi n'existe pas, sinon `PATCH`, et `DELETE` s'il devient vide (`isEmptyProgress()` : ni note ni état, chapitre vide ou 0), car l'API refuse un suivi vide.
- **Composants** :
  - `components/dashboard/` : `DashboardHeader` (menu admin), `DashboardFilterBar`, `WebtoonCard` et `WebtoonModal`, qui crée, édite ou supprime un webtoon, gère titres, couverture et progression. Ce que la fenêtre propose de modifier (titres, couverture, statut, suppression) dépend du champ `canEdit` que l'API renvoie avec chaque webtoon : elle ne recalcule pas ce droit, qui dépend de suivis qu'elle ne voit pas ;
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
- Les couvertures s'affichent via `coverUrl()` (`src/services/cover.ts`), qui ajoute `?t=<updated>` pour contourner le cache navigateur (6 mois côté nginx). Un webtoon sans couverture a `image` à `null`, ou absente selon la réponse de l'API (elle omet les champs `null`, sauf dans `/webtoon_users`) : `coverUrl()` renvoie alors `null`, et chaque endroit affiche son visuel de remplacement (titre sur la carte et dans la fenêtre, icône dans la recherche, pas de bannière), sans requête ; il l'affiche aussi si l'image ne se charge pas (`@error`).

## Tests
Vitest (`vitest.config.ts` reprend la configuration de Vite, donc l'alias `@/`), dans un faux navigateur (`jsdom` : `window`, `localStorage`…).
- Un fichier `*.spec.ts` dans un dossier `__tests__/` à côté du code testé (ex. `src/types/__tests__/progress.spec.ts`). Seuls ces dossiers sont lus par `tsconfig.vitest.json` et les règles Vitest d'ESLint (oxlint, lui, applique son plugin `vitest` à tout le projet) ; `tsconfig.app.json` les exclut. Les descriptions (`describe`, `it`) sont en français.
- Les tests ne contactent jamais l'API : `vi.mock('@/services/api', …)` remplace l'instance axios par des fonctions simulées (`vi.fn<…>()`, typées comme l'exige oxlint), dont on vérifie les appels (`toHaveBeenCalledWith`). Les règles de droits et de visibilité restent testées côté API.
- Un store Pinia s'utilise après `setActivePinia(createPinia())` dans `beforeEach` ; `window.confirm` se remplace par `vi.stubGlobal('confirm', …)`.
- Tests existants : logique des suivis (`isEmptyProgress`, `saveProgress`, `losesAccessWithoutProgress`, `confirmLeavingUnpublished`, `useWebtoonProgress`) ; rechargement après une mise à jour (`createPreloadErrorHandler`, `trackRequestedPath`) ; tri de l'administration des webtoons (`WebtoonListView`, monté avec `@vue/test-utils`) ; lien de téléchargement du tutoriel d'installation de l'extension (`InstallExtensionTutorialView`), vers la dernière release de `dramatoons-browser-extension` ; adresse des couvertures (`coverUrl`) et visuel de remplacement d'un webtoon sans couverture ou dont l'image ne se charge pas (`HeaderSearch`, `WebtoonCard`, `WebtoonModal`, `WebtoonCoverUploader`, `WebtoonDetailView`) ; version du site dans le pied de page (`App`, et son inscription par `vite.config.ts` : `viteConfig`) ; tri envoyé à l'API (`useWebtoonSearch` : « Modification » de la bibliothèque envoie `user_updated`, « Dernier ajout » du catalogue `added`) ; un seul email de vérification quand un administrateur change l'email d'un compte, et aucun annoncé si l'enregistrement échoue (`UserDetailView`) ; position de défilement gardée derrière la fenêtre (`scrollLock`, et son utilisation par `DashboardView`) ; droits de modification de la fenêtre d'un webtoon (`WebtoonModalDroits`) : titres, couverture, statut et `PATCH` du webtoon seulement à la création ou si l'API renvoie `canEdit` vrai.

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
- Seulement pour les PR de `remi-leconte` dont la branche vient du dépôt : le jeton de l'abonnement Claude (secret `CLAUDE_CODE_OAUTH_TOKEN`) n'est jamais utilisé pour une PR extérieure. Pour toute autre PR, le check est rouge (« pas de relecture IA ») plutôt que sauté, car un check sauté compte comme réussi. Une PR extérieure n'est donc jamais fusionnée telle quelle : si son contenu est retenu, il est repris sur une branche de ticket du dépôt et suit le cycle normal. Un brouillon n'est pas relu : son check est rouge (« pas encore relu ») jusqu'au passage en prêt, qui lance la relecture ; sauté, il serait vert. Un nouveau push annule la relecture en cours.
- Une PR de synchronisation (`main` → `release/*`, après un hotfix ou une livraison) a le check vert sans relecture IA : son contenu a déjà été relu et livré.
- Une PR qui versionne `_relecture/` ou `_workspace/`, dossiers écrits par le job, fait échouer le check sans verdict, avec un message explicite : ces fichiers passeraient pour le contexte de la relecture.
- Le job rassemble d'abord, sans IA, le contexte dans `_relecture/` : la PR, son ticket, le ticket principal et ses sous-tickets, et les PR ouvertes des autres dépôts pour ces tickets, vers la même release pour l'API et le front (ils ont toujours la même version), vers `main` pour l'extension (qui n'a pas de release), seulement celles de `remi-leconte` dont la branche vient du dépôt (plusieurs PR pour un même ticket sont signalées). Les PR d'un même ticket sont ainsi relues ensemble, pour la cohérence entre l'API, le front et l'extension. Elles sont ouvertes en brouillon, puis passées prêtes ensemble (`gh pr ready`) : chaque relecture trouve ainsi toutes les autres.
- Une branche hors convention, ou un ticket introuvable (le sien, le ticket principal ou un sous-ticket), n'arrête pas le job : la relecture la signale comme remarque. Une autre erreur de lecture d'un ticket (GitHub indisponible) fait échouer le job sans verdict.
- Claude lit ensuite les consignes de `relecture/consignes.md` du dépôt `dramatoons-workspace` (cloné dans `_workspace/`), avec les règles métier et le workflow. Ses seuls outils disponibles sont Read, Glob et Grep (`--tools`) : ni Bash, ni écriture, ni sous-agent, ni accès à GitHub. Ils ne lisent que le dossier de travail : sans `--allowedTools`, toute lecture ailleurs sur le runner demande une permission que personne ne peut accorder, donc refusée. La configuration Claude du dépôt relu (`CLAUDE.md`, `.claude/`, `.mcp.json`) n'est pas chargée (`--setting-sources user`) : elle ne peut ni changer les consignes du relecteur ni lui faire lancer une commande par un hook ou un serveur MCP. L'action remet en outre dans l'arbre le `CLAUDE.md` de la branche cible : celui de la PR est copié avant dans `_relecture/CLAUDE.pr.md`, que le relecteur lit comme une donnée. Il rend un verdict JSON.
- Limite : sur une PR, GitHub exécute le `relecture.yml` de la PR elle-même. Une PR qui modifie ce fichier change donc sa propre relecture ; les consignes demandent de relire ce fichier en premier et de bloquer tout affaiblissement. C'est aussi pourquoi une PR extérieure n'est jamais fusionnée telle quelle, et pourquoi ses workflows attendent une approbation avant de tourner : réglage du dépôt Settings → Actions → General, « Require approval for all external contributors » (par défaut, GitHub ne l'exige que pour un premier contributeur).
- Les actions du job de relecture (`actions/checkout` et l'action Claude) sont épinglées sur un commit, et non sur une étiquette comme `v1` : elles tournent dans le job qui reçoit le jeton de l'abonnement, et une étiquette déplacée leur donnerait un autre code. Les mettre à jour volontairement.
- On ne change jamais la cible d'une PR relue (par exemple vers une autre release) : son check resterait celui de l'ancienne cible. On la ferme et on en ouvre une nouvelle. La relecture n'écoute pas les modifications de PR (`edited`), dont chacune lancerait un run, et un job sauté remplacerait un verdict rouge par un check réussi.
- Le check « Relecture IA » est obligatoire pour fusionner dans `release/*` (ruleset des releases), en plus des trois checks de la CI. Les PR `release/*` → `main` ne sont pas relues, leur contenu l'ayant été ticket par ticket : le ruleset de `main` ne doit pas l'exiger, sans quoi elles resteraient bloquées faute de run.
- Check rouge à la moindre remarque, vert sinon. Le verdict et les remarques sont publiés en commentaire de la PR par un second job, seul à avoir le droit d'écrire sur la PR. Le texte lui est passé par une sortie de job, ce qui permet de relancer le run sans conflit.
- La relecture ne fusionne rien, et la fusion automatique de GitHub n'est pas utilisée : un ticket qui touche l'API et le front a une PR dans chaque dépôt, que GitHub fusionnerait chacune de son côté. Claude fusionne toutes les PR du ticket ensemble, une fois toutes vertes, ou aucune (skill `workflow-github`).
- Chaque relecture consomme le quota de l'abonnement. Si le quota est atteint, le check échoue : relancer le job plus tard (« Re-run failed jobs »).
- Après une correction poussée sur une seule PR d'un ticket, relancer aussi la relecture des autres PR du ticket, qui ont vu l'ancienne version.

## Publication et déploiement
`.github/workflows/publish.yml` construit l'étape `prod` du Dockerfile (`linux/amd64`) et la publie, publique, sur `ghcr.io/remi-leconte/dramatoons-front`.
- Déclenché par un `push` sur `release/*` (donc la fusion d'une PR), jamais par une PR : seul ce qui est déjà passé par la CI est publié.
- Étiquettes : `release-vX.Y.Z` (dernière fusion dans la release) et `sha-<commit>`. L'image porte aussi la version de sa release, affichée dans le pied de page (voir « Configuration »). Pas de `latest`. L'étiquette `vX.Y.Z` est ajoutée à la livraison, sans reconstruire l'image (voir « Livraison »).
- Job « Publication image », distinct du check « Image prod » de la CI. Les publications d'une même branche passent l'une après l'autre, sans annulation ; seule exception de GitHub : sur trois fusions très rapprochées, celle du milieu, encore en attente, est remplacée et son `sha-<commit>` n'est pas publié.
- Droits : aucun par défaut (`permissions: {}`). Le job « Publication image » n'a que le `GITHUB_TOKEN`, limité à `contents: read` et `packages: write`, et aucun secret ; dans ce workflow, les secrets (SSH, `PROJECT_TOKEN`) ne servent qu'au job « Déploiement recette » (ci-dessous), dont le `GITHUB_TOKEN` n'a que `contents: read` et `pull-requests: read`, pour retrouver la PR fusionnée (comme « Release fusionnée » dans la livraison).

Sur `release/*`, le job « Déploiement recette » suit la publication :
- Il tourne dans l'environnement GitHub `staging`, dont les secrets (`SSH_HOST`, `SSH_KNOWN_HOSTS`, `SSH_PRIVATE_KEY`, `PROJECT_TOKEN`) ne sont donnés qu'aux branches `release/*`.
- Il lance sur le serveur, en SSH, le script de déploiement (hors dépôt), auquel il ne transmet que `front` et le commit. Le script télécharge `compose.yaml` et `compose.prod.yaml` de ce commit, récupère l'image `sha-<commit>`, redémarre le conteneur, vérifie que le site répond, puis supprime les anciennes images.
- La recette déployée ainsi ne construit rien : son dossier ne contient que `.env.local`, `.env.image` et les fichiers compose téléchargés, sans le code.
- Revenir à une version précédente :
  - dans GitHub, ouvrir le run « Publication » d'un commit précédent de la release et relancer **seulement** son job « Déploiement recette » (« Re-run this job ») : GitHub ne relance pas la publication dont il dépend, et l'image déjà publiée, celle qui a été recettée, est redéployée. « Re-run all jobs » reconstruirait l'image, qui pourrait différer, et déplacerait `release-vX.Y.Z` sur ce commit : à éviter ;
  - GitHub ne permet de relancer un job que dans les 30 jours qui suivent son run ; au-delà, lancer à la main sur le serveur le script de déploiement avec le commit voulu ;
- Les journaux de GitHub Actions sont publics : le script n'y écrit ni configuration ni journaux des conteneurs.
- Après un déploiement réussi, le job passe en `In QA` le ticket de la PR fusionnée, lu dans le nom de sa branche (voir « Statuts des tickets »). Une fusion qui ne vient pas d'une branche de ticket (synchronisation `main` → release) ne change aucun statut.

## Livraison
`.github/workflows/livraison.yml` livre une release à sa fusion dans `main` (`push` sur `main`) :
1. **Release fusionnée** : retrouve la PR fusionnée et sa branche `release/vX.Y.Z`. Un hotfix passe lui aussi par sa propre release (`release/vX.Y.Z` de la version corrigée, skill `workflow-github`) et se livre de la même façon ; une fusion qui ne vient pas d'une release n'a pas d'image recettée et ne livre rien. Le workflow échoue sans rien livrer si le contenu de `main` diffère de celui du dernier commit de la release (hotfix non repris dans la release, conflit résolu à la fusion) ou si le tag `vX.Y.Z` existe déjà.
2. **Version** : ajoute l'étiquette `vX.Y.Z` à l'image `sha-<dernier commit de la release>`, celle qui a été recettée, sans la reconstruire, puis pose le tag `vX.Y.Z` sur `main`. Un tag posé avec le `GITHUB_TOKEN` ne déclenche aucun workflow : la suite se fait donc dans celui-ci.
3. **Déploiement production** : attend l'approbation de l'utilisateur, puis déploie `vX.Y.Z`. La recette n'est pas redéployée : elle tourne déjà sur l'image recettée, la même que `vX.Y.Z`. L'environnement GitHub `production` exige cette approbation, sans contournement par un administrateur, et ne donne ses secrets qu'à `main`. Après le déploiement réussi, le job passe en `Done` les tickets du dépôt de cette version qui sont en `Ready to Deploy` (voir « Statuts des tickets »).

- Droits : aucun par défaut (`permissions: {}`). « Release fusionnée » a `contents: read` et `pull-requests: read` ; « Version », `contents: write` (tag) et `packages: write` (étiquette de l'image) ; « Déploiement production » n'a aucun droit, seulement les secrets de son environnement (SSH, `PROJECT_TOKEN`).
- Les livraisons passent l'une après l'autre (groupe de concurrence `livraison`) : tant que son déploiement en production attend l'approbation, un run bloque la livraison suivante, et une nouvelle fusion dans `main` remplacerait celle qui attend. Si la version ne doit finalement pas partir en production, **rejeter** le job « Déploiement production » (« Reject »), puis corriger par un hotfix.
- Approuver la production de l'API (remi-leconte/dramatoons-api) avant celle du front : le nouveau front peut appeler des points d'entrée que seule la nouvelle API connaît.
- Revenir à la version précédente en production :
  - dans le run « Livraison » de la version précédente, relancer **seulement** le job « Déploiement production » (« Re-run this job », dans les 30 jours, avec une nouvelle approbation), ou lancer à la main sur le serveur le script de déploiement avec le `vX.Y.Z` de cette version ;

## Statuts des tickets
Les jobs « Déploiement recette » et « Déploiement production » finissent par une étape « Statuts des tickets », qui change le champ Status du projet GitHub Dramatoons avec `gh project` :
- recette : le ticket de la PR fusionnée passe en `In QA`, s'il est en `In Review`. Une relance du job (retour arrière, voir « Publication et déploiement », ou après un déploiement échoué) ne change aucun statut : le commit redéployé n'est pas forcément la dernière version du ticket, qui ne doit ni reculer ni avancer à tort ;
- production : les tickets du dépôt dont le champ Release vaut la version livrée, et qui sont en `Ready to Deploy`, passent en `Done`. Chaque ticket, sous-ticket compris, a donc sa propre Release (skill `workflow-github`). Relancer le job d'une version précédente ne change rien : ses tickets sont déjà en `Done`. Les tickets de l'API passent ainsi à l'approbation de sa production, ceux du front à la sienne.

Le `GITHUB_TOKEN` ne peut pas écrire dans un projet d'utilisateur : l'étape utilise le secret d'environnement `PROJECT_TOKEN`, seulement pour lire et modifier le projet (la PR fusionnée est lue avec le `GITHUB_TOKEN`). L'étape trouve le projet par `--owner "@me"` : le projet appartient au compte du jeton. Un jeton d'un autre compte fait le plus souvent échouer l'étape (erreur), et parfois ne donne qu'un avertissement : une erreur ou un avertissement inattendu fait donc aussi vérifier le compte du jeton. Il expire : sa création (type et droits minimaux) et son renouvellement sont décrits dans une procédure hors dépôt, comme celles des serveurs. Il n'existe que dans les environnements `staging` et `production` : seuls les jobs de déploiement le reçoivent, jamais une PR. À son expiration, le renouveler dans les deux environnements de l'API et du front.

L'étape ne peut pas faire échouer le job (`continue-on-error`) : relancer un déploiement, en production surtout (nouvelle approbation), pour un statut serait pire que de le corriger à la main. Le run signale une étape en échec (jeton expiré, ou d'un autre compte, voir plus haut) par une erreur, sans que le job échoue, une étape qui n'a trouvé aucun ticket à changer (ticket qui n'est plus en `In Review`, aucun ticket en `Ready to Deploy`) par un avertissement, et une relance du job par une notice. Ces cas se corrigent à la main (skill `workflow-github`), comme ceux que l'étape ne couvre pas, sans rien signaler :
- ticket principal en avance sur son sous-ticket ;
- ticket dont le run « Publication » a été annulé par la concurrence (trois fusions rapprochées, voir « Publication et déploiement ») : son code est déployé par le run suivant, mais l'étape de celui-ci ne passe en `In QA` que le ticket de sa propre fusion.

L'étape contient les identifiants du projet, du champ Status et de ses options, qui survivent à un renommage, mais aussi les noms des états `In Review` et `Ready to Deploy` et du champ Release, qui servent de filtres : renommer ou recréer l'un d'eux impose de mettre l'étape à jour, sinon elle ne trouve plus aucun ticket.

## Git
Workflow (branches, PR, tickets, releases) : skill `workflow-github`.

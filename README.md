# Dramatoons : front

[![Livraison](https://github.com/remi-leconte/dramatoons-front/actions/workflows/livraison.yml/badge.svg?branch=main)](https://github.com/remi-leconte/dramatoons-front/actions/workflows/livraison.yml)
[![Dernière release](https://img.shields.io/github/v/release/remi-leconte/dramatoons-front?label=release)](https://github.com/remi-leconte/dramatoons-front/releases/latest)
[![Licence : tous droits réservés](https://img.shields.io/badge/licence-tous%20droits%20r%C3%A9serv%C3%A9s-lightgrey)](LICENSE)

Site web de [Dramatoons](https://dramatoons.ovh), un site de suivi de lecture de webtoons (bandes dessinées en ligne) : chaque lecteur tient sa bibliothèque, note les webtoons et retrouve le dernier chapitre lu.

> **Dramatoons n'héberge aucun webtoon.** Il ne conserve que la progression de chaque lecteur (dernier chapitre lu, note, état) : aucun chapitre, aucune planche, et aucun lien vers des plateformes de diffusion non autorisées. Les webtoons se lisent ailleurs, sur les plateformes choisies par le lecteur.

## Fonctionnalités

- **Bibliothèque** : les webtoons suivis par le lecteur, avec leur dernier chapitre lu, leur note et leur état (en cours, en pause, pas intéressé, terminé), filtrables et triables.
- **Catalogue et recherche** : les webtoons publiés, à ajouter à sa bibliothèque ; recherche par titre depuis le bandeau.
- **Fiche d'un webtoon** : création et modification (titres alternatifs, statut, couverture) et suivi de lecture, dans une même fenêtre.
- **Compte** : inscription avec validation de l'email, connexion, mot de passe oublié, profil.
- **Administration** : gestion et publication des webtoons pour les modérateurs, gestion des comptes pour les administrateurs.
- **Extension de navigateur** : tutoriel d'installation de l'extension Dramatoons Highlighter.

Les droits et la visibilité des webtoons sont contrôlés par l'[API](https://github.com/remi-leconte/dramatoons-api) : le front ne fait qu'adapter l'affichage au rôle de l'utilisateur.

## Technologies et architecture

Vue 3 (Composition API, `<script setup>`), TypeScript, Vite, Pinia, Vue Router et axios, sans framework CSS. En production, le site est servi par nginx dans Docker.

- **Appels à l'API** : une instance axios unique ajoute le jeton de connexion et le renouvelle automatiquement quand il expire.
- **État** : la session est gérée par un store Pinia ; les préférences de recherche (onglet, filtres, tri) sont mémorisées dans le navigateur.
- **Une image pour tous les environnements** : l'adresse de l'API est lue au démarrage du conteneur, pas à la construction, si bien que l'image recettée est celle qui part en production.
- **Mises à jour** : un onglet resté ouvert pendant une mise en production, qui ne trouve plus les fichiers de l'ancienne version, se recharge de lui-même sur la nouvelle.

Le détail (organisation du code, routes, conventions d'appel à l'API) est dans le [`CLAUDE.md`](CLAUDE.md) du dépôt.

## Démarrer en local

Prérequis :
- Docker avec Docker Compose, et le réseau Docker externe `global_proxy_network` ;
- l'[API](https://github.com/remi-leconte/dramatoons-api) lancée en local : le front l'appelle sur http://localhost:8081 (`public/config.js`). Son jeu de données de développement fournit des comptes de test.

```sh
git clone https://github.com/remi-leconte/dramatoons-front.git
cd dramatoons-front
docker network create global_proxy_network   # une seule fois, s'il n'existe pas déjà
docker compose up -d
```

Le site répond alors sur http://localhost:5173, et se met à jour à chaque modification du code.

## Qualité

- **Tests** : Vitest, sur la logique des suivis de lecture, le rechargement après une mise à jour et l'administration des webtoons. Ils ne contactent jamais l'API : les règles de droits et de visibilité sont testées dans l'API.
- **Vérifications** : contrôle des types (vue-tsc), oxlint et ESLint sans aucun avertissement toléré, formatage Prettier.
- **Intégration continue** (GitHub Actions) : vérifications, tests et construction de l'image de production sur chaque pull request. Une relecture par IA relit en plus chaque pull request vers une release, en priorité sur la sécurité et les règles métier ; la moindre remarque la bloque.

```sh
docker compose exec front npm run ci   # vérifications
docker compose exec front npm test     # tests
```

## Livraison

Chaque fusion dans une branche de release publie l'image Docker et met à jour la recette. À la fusion de la release dans `main`, l'image recettée est livrée telle quelle, sans reconstruction : elle reçoit son numéro de version, et la mise en production attend l'approbation du développeur. Le détail est dans les sections « Publication et déploiement » et « Livraison » du [`CLAUDE.md`](CLAUDE.md).

## Projet Dramatoons

| Dépôt | Rôle |
| --- | --- |
| [dramatoons-api](https://github.com/remi-leconte/dramatoons-api) | API REST (Symfony, API Platform) |
| [dramatoons-front](https://github.com/remi-leconte/dramatoons-front) | Site web (ce dépôt) |
| [dramatoons-extension-chromium](https://github.com/remi-leconte/dramatoons-extension-chromium) | Extension pour les navigateurs Chromium |
| [dramatoons-extension-firefox](https://github.com/remi-leconte/dramatoons-extension-firefox) | Extension Firefox |
| [dramatoons-workspace](https://github.com/remi-leconte/dramatoons-workspace) | Espace de travail commun : méthode de travail avec Claude Code, règles métier, workflow |

## Licence

© 2026 Dramatoons.ovh, tous droits réservés : le code est publié pour être consulté, pas pour être réutilisé (voir [`LICENSE`](LICENSE)).

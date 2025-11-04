# Webpack + MarionetteJS + Babel/ES6

This is a modern JS skeleton with MarionetteJS for [Webpack](https://webpack.github.io/).

## Getting started

* Install:
    * Inside this folder run: `npm install`
* Run:
    * `npm start` — starts project
    * `npm run build` - builds you project
* Learn:
    * `public/` dir is fully auto-generated and served by HTTP server.  Write your code in `app/` dir.
    * Place static files you want to be copied from `app/assets/` and `app/styles/` to `public/`.

## Problèmes à régler

* La coche préférence ne fonctionne pas pour les utilisateurs
* J'ai réglé le problème des calculs à virgule avec nerdamer. Toutefois, si le concepteur de l'exo écrit par ex 0,5, nerdamer va peut être butter sur la virgule et il va mettre 1/2. Il faudrait donc trouver moyen de dire à nerdamer de ne pas faire cela, ou bien trouver un autre moteur de rendu tex. copilot m'a proposé une fonction pour conserver les décimaux.
* pour un bloc jsxgraph il faudrait pouvoir mettre des paramètres `<courbe:formule et détails>` et du coup il faudrait modifier le setParam de ce bloc afin que l'on puisse cumuler des courbes.
* pour un bloc de mises en correspondances d'items, les enfant pourraient être comme dans un bloc radio du genre 0=>a:b et ensuite ce n'est qu'un problème de rendu. 

## à faire

* les cas de réponse attendue dans le cas input
  * possibilité d'ajouter plusieurs expected dans un cas un dans une liste
  * cas ensemble
  * développé
  * approx...
* cas d'interface
  * jsxgraph : dans ce cas le setparam pourrait devoir être adapté
  * tableau
  * association avec couleurs
  * boutons de clavier
  * zonee d'édit intelligente
  * sauvegarde sur aperçu
* chargement d'une classe à la algoPython ?
* interface devoir pour prof
  * clonage de devoir
* admin : interface de nettoyage
* élève

Important : désormais, on crée une asso exercice-devoir pour une répétition de l'exo dans le devoir. Si on veut que l'élève le fasse 5x alors il faut entrer 5 assoc.

La note de l'élève pour cette assoc est la meilleure réalisation.

Pour une assoc, on reprend toujours le dernier essai enregistré tant qu'il n'est pas terminé.

## Arborescence des pages

+ home
  +-- login
  +-- forgotten:key
+-- users
  +-- user:id
  +-- user:id/edit
  +-- user:id/password
  +-- user/new
  +-- user/classe:id/signin
+-- devoirs
  +-- devoir:id
  +-- devoir:id/dashboard
  +-- devoir:id/edit
  +-- devoir:id/addexo
  +-- devoirs/nouveau
  +-- devoir:id/exo:id
+-- classes
  +-- classes/prof:id
  +-- classe:id
  +-- classe:id/edit
  +-- classe/new
  +-- classes/signin
+-- exercices (sujets)
  +-- sujet-exercice:id
  +-- sujet-exercuce:id/edit
+-- notes
  +-- devoir:id/notes
  +-- devoir:id/notes/user:id
  +-- devoirExo:id/:id/:id/:id/run
  +-- mynotes
  +-- mynotes:id
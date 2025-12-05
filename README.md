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
* pour un bloc de mises en correspondances d'items, les enfant pourraient être comme dans un bloc radio du genre 0=>a:b et ensuite ce n'est qu'un problème de rendu. 


  * la note de ces mêmes exercices ne se met à jour dynamiquement (met c'est bon si F5)

## à faire

* une fonction permettant l'évaluation d'une fonction
* une fonction s'appuyant sur le solve de nerdamer, qui extrait le tableau et enlève les éventuels résultats complexes
* ce serait bien de cibler l'erreur sur une ligne si possible
* il semble que "publié" se coche plus ou moins tout seul (sans doute à la créa ?) même quand on touche un autre exo ! Le pb est que "0" est parsé true ! En effet Boolean("0") renvoie true.
* prévoir une petite calculatrice

* les cas de réponse attendue dans le cas input
  * cas ensemble
  * développé
* cas d'interface
  * zonee d'édit intelligente
  * sauvegarde sur aperçu
* chargement d'une classe à la algoPython ?
* admin : interface de nettoyage
* mélanger les couleurs





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
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
* Je ne sais que faire pour l'évaluation de l'égalité : l'utilisateur pourrait écrit des coeffs décimaux. mais ils ne le seraient pas forcément dans la solution. Donc si on compare 1.5 et 3/2 ça ne passe pas. Comment éviter le probème ? Une solution serait d'implémenter une simplification avec mes fonctions. Cela permettrait de régler les cas les plus simples. Mais pour les cas avec x ? Il faut prendre des décisions !
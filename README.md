# Webpack + MarionetteJS + Babel/ES6

This is a modern JS skeleton with MarionetteJS for [Webpack](https://webpack.github.io/).

## Getting started

* Install:
    * Inside this folder run: `npm install`
* Run:
    * `npm start` : starts project
    * `npm run build` : builds you project
* changement de numéro
    * `npm version patch`, changement du numéro final. ex : 3.1.1 -> 3.1.2
    * `npm version minor`, changement du numéro central. ex : 3.1.1 -> 3.2.0
* Learn:
    * `public/` dir is fully auto-generated and served by HTTP server.  Write your code in `app/` dir.
    * Place static files you want to be copied from `app/assets/` and `app/styles/` to `public/`.

## Problèmes à régler

* Vérifier les exos à graphique voir si les attributs sont ok. Idem pour radio.
* il faudrait assumer la levée d'une erreur dans les getMyNumber et autres.

## à faire

* prévoir un champ de saisie attendant une collection, adjointe soit à un check qui vérifie chaque item 2 à 2, soit dans le désordre, ou éventuellement fixe un critère, un critère de taille éventuellement
* pouvoir faire un repeat for
* pouvoir mettre autre chose que 0,1,2... dans les options
* lire la longueur d'un tableau
* les fractions comme -7/2 sont écrites souvent -7 en haut et 2 en bas. serait mieux - devant puis 7/2. Voir si je peux améliorer cela.

* prévoir une petite calculatrice
* cas d'interface
  * zone d'édit intelligente
  * sauvegarde sur aperçu
* admin : interface de nettoyage

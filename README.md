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

- j'ai l'idée pour un bloc graph de faire des sous-blocs qui seraient des éléments utiles. Par exemple <functiongraph:f> qui contiendrait des blocs comme <expression>, <color>... le <functiongraph> contiendrait lui même des params <xmin:value/> etc.





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


## Code pour réaliser un exercice

### Commentaires

Une ligne vide est ignorée. Tout ce qui suit `#` est considéré comme commentaire

### Options

Utiliser un bloc option de la forme :

```
<option:nom>
key1 => label1
key2 => label2
</option>
```

  * `nom` est le nom de l'option et sera accessible ensuite avec `@nom`
  * `key1` est une clé et doit être numérique. C'est elle qui sera stockée en BDD quand  l'utilisateur voudra indiquer l'option choisie.
  * `label1` est l'étiquette correspondante. Elle sera affichée dans le menu de chois des options.

*Remarque : On refuse les noms d'options commençant par `_`.*

**Important :** La première valeur de l'option est toujours la valeur par défaut.

### Contrôle de flux

Dans le bloc d'initialisation ou le bloc de code de l'exercice, le concepteur a le droit à quelques structures de contrôle de flux.

#### conditions, and et or

On peut énoncer des conditions de la forme `a == b` ou `a != b`. On peut les associer avec des opérateurs `and` et `or`.

#### if

```
<if @a == @b>
...
<elif @a != 12>
...
<else>
...
<endif>
```

Les `if` peuvent être imbriqués.

#### needed

Indique une contrainte. Si elle n'est pas respectée pendant l'initialisation, celle-ci redémarre automatiquement pour un nouvel essai.

L'idée est d'initialiser aléatoirement et de « relancer les dés » jusqu'à obtenir des valeurs convenables.

```
<needed @xA != @xB or @yA != @yB >
```

Noter que, bien que `needed` soit un bloc singleton, il ne faut pas le fermer par `/>`.

### Initialisation

#### Nouveau ou sauvegarde

L'exécution d'un exercice peut se faire dans deux contextes :

  * il s'agit d'une nouvelle exécution, il faut donc initialiser les paramètres utiles.
  * Il s'agit de l'exécution d'un exercice préalablement initialisé et dont les paramètres ont été stocké en BDD.

L'initialisation ne s'exécute que dans le premier cas.

#### Affection

  * On annonce les variables en les faisant précéder par `@`.
  * L'affectation d'une variable se fait avec un signe `=`
  * Les variables dont le nom commence par `_`, par exemple `@_x`, ne seront pas sauvegardées et seront donc perdues au moment de l'exécution de l'exercice. Elles peuvent servir de variable intermédiaire pour faciliter la rédaction de l'init.

Exemple :

```
@_x = 3
@y = 3+2*@_x^2
```

*Remarque : On interdit les noms de variables commençant par `__`*.

#### Évaluation d'une pile

Si l'expression à évaluaer est entourée de `<P: >`, alors elle est comprise comme une pile. L'expression est alors splitée selon les espaces. Au début chaque bloc est un donc un élément texte.

Les éléments de la pile subissent un prétraitement :

  * Si un bloc est reconnu de la forme `@name` ou `@name.sub` alors il est remplacé par la valeur correspondante. Cela pourrait donc être un objet.
  * Si une chaîne contient des éléments de la forme `@name` ou `@name.sub` alors ils sont substitués mais alors sous forme textuelle et avec des parenthèses ! Par exemple si on a `3*@b+2` et que `@b` contient `x+4` alors on ontiendra `3*(x+4)`

On suite on passe à l'exécution de la pile :

  * Tout bloc non chaîne de caractère est considéré comme opérande est placé dans la pile des opérandes.
  
  * Tout bloc de la forme `"module.fonction"` est considéré comme une fonction.
    * Cette fonction sera cherchée parmi les modules disponibles. Il faudra donc qu'elle existe bien.
    * Cette fonction a une certaine arité. Elle prendra donc les opérandes dans la pile des opérandes. Il faut qu'il y en ait asse.
    * Attention à l'ordre : l'opérande le plus haut sur la pile sera celui donné en dernier à la fonction.
    * Le résultat de l'exécution est placé sur la pile des opérandes.

#### Évaluation d'expression

Quand on procède une évaluation et que l'epression n'est pas entourée par [ ], on en déduit qu'il s'agit d'une expression mathématique, en format textuel, qui sera interprétée par nerdamer.

Les blocs de forme `@name` ou `@name.value` présents dans l'expression sont substitués par leur valeur.

**Attention :** Cette substitution est textuelle. Suppose donc que le contenu de la variable pourra être l'objet d'une analyse ensuite.

**Exemple :** On pourra écrire `@b = @a * 3 + 4` et alors si `@a` contient `x+2` alors on aura `@b = (x+2) * 3 + 4`. Cette évaluation force les parenthèses.

#### Cas d'un tableau

On peut procéder à une affectation de tableau.

`@a <:3>= 5` va ainsi créer un tableau `[5, 5, 5]`.

On dispose de la variable `@__i` qui représente l'index. Ainsi :

`@a <:3>= 5 + @__i` va affecter `[5, 6, 7]`

On peut également faire des calculs sur un tableau :

`@b <:3>= @a[]^2` va affecter `[25, 36, 49]`.

Attention, l'utilisation dans l'expression de `@a[]` lèvera une erreur...
  * si on a pas précisé `<:3>` ou une autre taille avant le `=` pour indiquer que l'on fait un calcul sur tableau,
  * si la taille indiquée excede la taille de `@a`.

On peut aussi travailler avec une taille non connue à l'exécution. Ceci par exemple est autorisé :

```
@n = <P:3 10 Alea.entier>
@a <:@n>= @__i^2
```

Ce qui créera une tableau de taille aléatoire.

On peut naturellement utiliser ces affectatios dans le cas d'une pile.

```
@n = <P:3 10 Alea.entier>
@a <:@n>= <P:0 100 Alea.entier>
```

Ce qui crée un tableau d'entiers aléatoires de taille aléatoire.

Le répéteur peut être un tableau. Par exemple :

```
@a <:5>= __i + 10
@b <:@a>= __v^2 + __i + 1
```

Ainsi le tableau `b` est obtenu en parcourant les items de `@a`. On peut utiliser ces items dans le calcul grâce à la variable `__v` et les indices également avec la variables `__v`. Ici, `@a = [10, 11, 12, 13, 14]` et donc on prend chaque item, on l'élève au carré, on lui ajoute son indice et on ajoute `1` ce qui donne `@b = [101, 123, 147, 173, 201]`.


On peut également définir un tableau par ajouts successifs :

```
@a[] = 3
@a[] = 12
```

Crée un tableau contenant les valeurs `3` et `12`.




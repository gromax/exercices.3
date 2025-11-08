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

Quand un exercice commence, puisque l'idée est de produire aléatoirement des exercices, il faut initialiser les paramètres. Dans certains cas, l'exercice que l'on exécute est un exercice précédemment créé et sauvegardé en BDD. Il faut donc que que dans ce cas là, on conserve bien les valeurs sauvegardées afin de rejouer l'exercice à l'identique.

En revanche, quand l'exercice est nouveau, il convient de sélectionner de nouveaux paramètres.

#### Première affection et autres affectations

Pour tenir compte du cas où on exécute un exercice déjà initialisé et sauvegardé, il faut être capable de ne calculer les paramètres d'initialisation que s'ils n'existent pas déjà.

On dispose donc de deux types d'affectations :

```
@x = 15
```

C'est l'affectation ordinaire. Elle n'agit pas si `x` a été reconnu comme ayant été préalablement enregistrés.

```
@x := 15
```

Les deux points permettent de forcer l'affectation **même si** `x` est un paramètre préalablement enregistré.

Il est interdit de modifier les variables du bloc options.

On peut créer des variables de forme `@_name`. Elles seront disponibles dans le bloc code mais ne seront pas sauvegardées en BDD (doivent donc pouvoir être recalculées à partir des données BDD)

#### Évaluation d'une pile

Si l'expression a évaluaer est entourée de `[ ]`, alors elle est comprise comme une pile. L'expression est alors splitée selon les espaces. Au début chaque bloc est un donc un élément texte.

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
    
  


#### Évaluation

Runtime, les blocs de forme `@name` ou `@name.value` présents dans l'expression sont substitués par leur valeur. **Attention :** Cette substitution est textuelle. Suppose donc que le contenu de la variable pourra être l'objet d'une analyse ensuite.

On peut donc avoir initialisé un attribut `@name` qui est un objet et accéder à ces propriétés. Par exemple on pourrait créer un point `@A` et accéder à ses coordonnées `@A.x` et `@A.y`.

Comme une variable `@a` peut contenir une expression, par exemple `'3x+2'`, cette substitution se fait avec parenthèses. Par exemple : `@b = @a * 3` donnera `@b = (3x+2)*3'`.

Après la substitution, la partie de droite du `=` est soumise à évaluation avec `MyMath.evaluate`.

#### Cas d'une pile






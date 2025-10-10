import Bloc from "./bloc";


class InputBloc extends Bloc {
    static LABELS = ['input', 'champ']
    constructor(label, paramsString, closed) {
        super(label, paramsString, closed);
        this._category = 'input';
    }
}

/*
Il faut définir tous les attributs envisageables d'un input...
le name de la variable concernée => passerait par le paramString
le tag pour le message de réponse => passerait par <tag:...>
le type de valeur attendue (nombre, expression, développé...) => passerait par <type:...>
la valeur attendue <good:...>, suppose une évaluation du paramètre
le type de champ (input, radio...) => passerait par le type de tag


les options radio :
devraient être de forme value=>label, un par ligne
les valeurs seraient toujours mélangées
*/
import { Model, Collection } from 'backbone'
import Bloc from "./bloc"
import Colors from "../colors"
import { ChoicesView } from "../blocsviews/choice"

class ChoiceManager {
    /**
     * constructeur
     * @param {object} params paramètres du bloc parent
     * @param {Colors} colors couleurs à utiliser
     * @param {object} options options de choix
     * @param {boolean} isform indique si c'est un formulaire
     */
    constructor(params, colors, options, isform) {
        this._params = params || {}
        this._colors = colors
        this._valuemax = 0
        this._options = options
        this._isform = isform || false
        this._makeCollection()
    }

    _shuffle() {
        this._collection = new Collection(this._collection.shuffle())
    }

    get valuemax() {
        return this._valuemax
    }

    get squaresOnly() {
        return (typeof this._params.onlysquares == 'undefined') || Boolean(this._params.onlysquares)
    }

    _makeCollection() {
        this._collection = new Collection()
        const squareOnly = this.squaresOnly
        if (typeof this._options === 'undefined') {
            this._options = {}
        }
        for (const [key, value] of Object.entries(this._options)) {
            const index = parseInt(key)
            const showIndex = this._isform ? 0 : index
            this._valuemax = Math.max(this._valuemax, index)
            const m = new Model({
                caption: value,
                index: showIndex,
                goodIndex:index,
                color: this._colors.getColor(showIndex),
                picto: squareOnly ? 'square' : this._colors.getPicto(showIndex),
                goodcolor: this._colors.getColor(index),
                goodpicto: squareOnly ? 'square' : this._colors.getPicto(index),
            });
            this._collection.add(m)
            this._notShuffledCollection = this._collection
            if ((typeof this._params.shuffle === 'undefined') || Boolean(this._params.shuffle)) {
                this._shuffle()
            }
        }
    }

    /**
     * met à jour les modèles avec les réponses de l'utilisateur
     * @param {string} userValue 
     * @return {number} le nombre de bonnes réponses
     */
    verification(userValue) {
        let count = 0
        for (let i = 0; i < this._notShuffledCollection.length; i++) {
            const model = this._notShuffledCollection.at(i)
            const v = parseInt(userValue.charAt(i)) || 0
            model.set('index', v)
            if (v === model.get('goodIndex')) {
                model.set('good', true)
                count += 1
            } else {
                model.set('good', false)
            }

        }
        return count
    }

    get collection() {
        return this._collection
    }

    get notShuffledCollection() {
        return this._notShuffledCollection
    }
}


class ChoiceBloc extends Bloc {
    static LABELS = ['choices', 'choix']
    constructor(label, paramsString) {
        super(label, paramsString, false)
    }

    /**
     * Définir les couleurs à utiliser
     * @param {Colors} colors
     */
    setColors(colors) {
        this._colors = colors
    }

    _customView(answers) {
        const manager = new ChoiceManager(this._params, this._colors, this._options, false)
        return new ChoicesView({
            collection: manager.collection,
            button: false
        })
    }
}

export { ChoiceBloc, ChoiceManager }

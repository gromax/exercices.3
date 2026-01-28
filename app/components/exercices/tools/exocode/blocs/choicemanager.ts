import { Model, Collection } from 'backbone'
import Colors from "../colors"

class ChoiceManager {
    private _params:Record<string, any>
    private _colors:Colors
    private _options?:Record<string, string>
    private _isform:boolean
    private _collection:Collection<Model>
    private _notShuffledCollection:Collection<Model>
    private _valuemax:number

    /**
     * constructeur
     * @param {object} params paramètres du bloc parent
     * @param {Colors} colors couleurs à utiliser
     * @param {object} options options de choix
     * @param {boolean} isform indique si c'est un formulaire
     */
    constructor(
        params:Record<string, any>,
        colors:Colors,
        options:Record<string, string>,
        isform:boolean
    ) {
        this._params = params || {}
        this._colors = colors
        this._valuemax = 0
        this._options = options
        this._isform = isform || false
        this._makeCollection()
    }

    private _shuffle():void {
        this._collection = new Collection(this._collection.shuffle())
    }

    get valuemax():number {
        return this._valuemax
    }

    get squaresOnly():boolean {
        return (typeof this._params.onlysquares == 'undefined') || Boolean(this._params.onlysquares)
    }

    private _makeCollection():void {
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
        }
        this._notShuffledCollection = this._collection
        if ((typeof this._params.shuffle === 'undefined') || Boolean(this._params.shuffle)) {
            this._shuffle()
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
            model.set('color', this._colors.getColor(v))
            model.set('picto', this.squaresOnly ? 'square' : this._colors.getPicto(v))
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


export default ChoiceManager

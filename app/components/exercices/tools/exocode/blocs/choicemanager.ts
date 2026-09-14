import _ from 'underscore'
import { Model, Collection } from 'backbone'
import { TParams } from "@types"
import Colors from "../colors"
import Option from "../option"
import { getBooleanOption } from "../misc"

class ChoiceManager {
    private _params:TParams
    private _colors:Colors
    private _options?:Array<Option>
    private _tags: Record<number, string>
    private _isform:boolean
    private _collection:Collection<Model>
    private _notShuffledCollection:Collection<Model>
    private _valuemax:number

    /**
     * constructeur
     * @param {TParams} params paramètres du bloc parent
     * @param {Colors} colors couleurs à utiliser
     * @param {Array<Option>} options options de choix
     * @param {boolean} isform indique si c'est un formulaire
     */
    constructor(
        params:TParams,
        colors:Colors,
        options:Array<Option>,
        isform:boolean
    ) {
        this._params = params || {}
        this._colors = colors
        const strParamMax = String(this._params["max"]) || "0"
        this._valuemax = parseInt(strParamMax) ||  0
        if (isNaN(this._valuemax)) {
            this._valuemax = 0
        }
        const optionKeyMax = _.max(options.map(option => parseInt(option.key))) || 0
        this._valuemax = Math.max(this._valuemax, optionKeyMax)
        this._options = options.filter(option => option.label != 'tag')
        this._tags = options
            .filter(option => option.label == 'tag')
            .reduce(
                (acc, option) => {
                    acc[parseInt(option.key)] = option.value
                    return acc
                },
                {} as Record<number, string>
            )
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
        return getBooleanOption(this._params, 'onlysquares', true)
    }

    get tags(): Record<number, string> {
        return {...this._tags}
    }

    get colors():Colors {
        return this._colors
    }

    private _makeCollection():void {
        this._collection = new Collection()
        const squareOnly = this.squaresOnly
        if (typeof this._options === 'undefined') {
            this._options = []
        }

        const useTags = (Object.keys(this._tags).length > 0)
        for (const option of this._options) {
            const index = parseInt(option.key)
            const showIndex = this._isform ? 0 : index
            const picto = this._isform && useTags
                ? 'question'
                : squareOnly ? 'square' : this._colors.getPicto(showIndex)
            const goodpicto = this._isform && useTags && this._tags[index]
                ? this._tags[index]
                : squareOnly ? 'square' : this._colors.getPicto(index)

            const m = new Model({
                caption: option.value,
                index: showIndex,
                goodIndex:index,
                color: this._colors.getColor(showIndex),
                picto: picto,
                goodcolor: this._colors.getColor(index),
                goodpicto: goodpicto,
                tag: this._tags[showIndex] || '',
                goodTag: this._tags[index] || '',
                useTags: useTags,
            });
            this._collection.add(m)
        }
        this._notShuffledCollection = this._collection
        if (getBooleanOption(this._params, 'shuffle', false)) {
            this._shuffle()
        }
    }

    /**
     * met à jour les modèles avec les réponses de l'utilisateur
     * @param {string} userValue 
     * @return {number} le nombre de bonnes réponses
     */
    verification(userValue:string):number {
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

    get collection():Collection {
        return this._collection
    }

    get notShuffledCollection():Collection {
        return this._notShuffledCollection
    }
}


export default ChoiceManager

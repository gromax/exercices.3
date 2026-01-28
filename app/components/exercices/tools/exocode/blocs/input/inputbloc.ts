import Bloc from "../bloc"
import { View } from "backbone.marionette"

type AnyView = View<any>|Array<View<any>>

abstract class InputBloc extends Bloc {
    protected _resultView?:AnyView
    protected _score?:number
    protected _name:string

    constructor(tag:string, paramsString:string) {
        super(tag, paramsString, false)
        if (!paramsString) {
            throw new Error(`<${tag}> doit avoir un nom (ex: <${tag}:le_nom>)`)
        }
        this._name = paramsString
    }

    nombrePts():number {
        return 1
    }

    protected abstract _calcResult(userData:Record<string, string>):[AnyView, number]

    /**
     * renvoie la vue résultat. La calcule au besoin
     * @param {Record<string, string>} userData 
     * @returns {AnyView} la vue résultat
     */
    resultView(userData:Record<string, string>):AnyView {
        if (typeof this._resultView === 'undefined') {
            const [view, score] = this._calcResult(userData)
            this._resultView = view
            this._score = score
        }
        return this._resultView
    }

    /**
     * Renvoie le score final
     * le calcule au besoin
     * @param {Record<string, string>} userData
     * @returns {number} le score final
     */
    resultScore(userData:Record<string, string>):number {
        // pas encore répondu
        if (typeof userData[this.header] === 'undefined') {
            return 0
        }
        if (typeof this._score === 'undefined') {
            const [view, score] = this._calcResult(userData)
            this._resultView = view
            this._score = score
        }
        return this._score
    }

    abstract validation(userValue?:string):string|boolean
}

export default InputBloc
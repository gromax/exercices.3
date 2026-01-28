import Bloc from "../bloc"
import { View } from "backbone.marionette"


abstract class InputBloc extends Bloc {
    protected _resultView?:View
    protected _score?:number
    constructor(tag:string, paramsString:string) {
        super(tag, paramsString, false)
        if (!paramsString) {
            throw new Error(`<${tag}> doit avoir un nom (ex: <${tag}:le_nom>)`)
        }
    }

    nombrePts():number {
        return 1
    }

    protected abstract _calcResult(userData:Record<string, string>):void

    /**
     * renvoie la vue résultat. La calcule au besoin
     * @param {*} userData 
     * @returns {View} la vue résultat
     */
    resultView(userData:Record<string, string>):View {
        if (typeof this._resultView === 'undefined') {
            if (typeof this._calcResult !== 'function') {
                throw new Error(`La méthode _calcResult doit être définie dans la sous-classe de InputBloc`)
            }
            this._calcResult(userData)
        }
        return this._resultView
    }

    /**
     * Renvoie le score final
     * le calcule au besoin
     * @param {*} userData 
     * @returns {number} le score final
     */
    resultScore(userData:Record<string, string>):number {
        // pas encore répondu
        if (typeof userData[this.header] === 'undefined') {
            return 0
        }
        if (typeof this._score === 'undefined') {
            if (typeof this._calcResult !== 'function') {
                throw new Error(`La méthode _calcResult doit être définie dans la sous-classe de InputBloc`)
            }
            this._calcResult(userData)
        }
        return this._score
    }
}

export default InputBloc
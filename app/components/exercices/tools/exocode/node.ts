import _, { all } from "underscore"
import { TParams } from "@types"

type TRunResult = "halt" | "nothing" | Node | Array<Node>

abstract class Node {
    protected _tag: string
    protected _runned:boolean

    constructor(tag:string) {
        this._tag = tag
        this._runned = false
    }

    get tag():string {
        return this._tag
    }

    /**
     * supposons qu'un attribut A puisse être indéfini, valeur ou tableau
     * cette fonction fait passer de l'un à l'autre
     *   écrit A si indéfini
     *   ajoute à la suite si tableau en supprimant les doublons
     *   crée le tableau si nécessaire
     */
    protected assignNew<T>(current:undefined|T|Array<T>, newValue:T, allowDbl:boolean=false):T|Array<T> {
        if (typeof current === "undefined") {
            return newValue
        }
        if (Array.isArray(current)) {
            const ncurrent = [...current]
            ncurrent.push(newValue)
            if (allowDbl) {
                return ncurrent
            } else {
                return _.uniq(ncurrent)
            }
        }
        if (current === newValue && !allowDbl) {
            return current
        }
        return [current, newValue]

    }

    abstract run(params:TParams):TRunResult
}

export { Node, TRunResult }
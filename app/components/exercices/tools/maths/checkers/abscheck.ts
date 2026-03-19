/*
Classe pour gérer une validation de saisie utilisateur
*/

import { InputType } from "@components/types"

abstract class AbsChecker {
    protected _expr: string
    protected _formatValid?:boolean
    protected _message:string

    constructor(expr:string, format:string = "") {
        this._expr = expr.trim()
        this._message = ""
    }

    static testFormat(format:string):boolean {
        throw new Error("AbsChecker.testFormat ne devrait pas être appelé")
    }

    protected abstract _testFormat():boolean

    get formatIsValid():boolean {
        if (typeof this._formatValid == "undefined") {
            this._formatValid = this._testFormat()
        }
        return this._formatValid
    }

    abstract valueIsGood(expected:InputType):boolean

    get message():string {
        return this._message
    }

}

export { AbsChecker }
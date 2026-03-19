import { AbsChecker } from "./abscheck"
import { InputType } from "@components/types"
import MyMath from '@mathstools/mymath'


class RoundCheck extends AbsChecker {
    protected _digits:number

    constructor(expr:string, format:string = "") {
        super(format, expr)
        const parts = format.split(":")
        const strDigits = parts.length>1
            ? parts[1].trim()
            : format.trim()
        this._digits = Number(strDigits)
        if (Number.isNaN(this._digits)) {
            throw new Error(`${format} n'a pas la forme round:### attendue`)
        }
    }

    static testFormat(format: string): boolean {
        return /^round:[0-9]+$/.test(format)
    }

    protected _testFormat():boolean {
        const test = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?(?:\s*%)?$/.test(this._expr)
        if (!test) {
            this._message = "Vous devez fournir un nombre éventuellement approximé."
        }
        return test
    }

    valueIsGood(expectedValue:InputType): boolean {
        const userFloat = MyMath.parseUser(this._expr).toFloat()
        const expectedFloat = MyMath.make(expectedValue).toFloat()
        if (isNaN(userFloat) || isNaN(expectedFloat)) {
            return false
        }
        const factor = Math.pow(10, this._digits)
        return userFloat * factor === Math.round(expectedFloat * factor)
    }
}

export { RoundCheck }


import { AbsChecker } from "./abscheck"
import { InputType } from "@components/types"
import MyMath from '@mathstools/mymath'


class ErreurCheck extends AbsChecker {
    protected _tolerance:number

    constructor(expr:string, format:string = "") {
        super(expr, format)
        const parts = format.split(":")
        const strTolerance = parts.length>1
            ? parts[1].trim()
            : format.trim()
        this._tolerance = Number(strTolerance)
        if (Number.isNaN(this._tolerance)) {
            throw new Error(`${format} n'a pas la forme round:### attendue`)
        }
        if (this._tolerance == 0) {
            throw new Error(`${format}, la tolérance ne devrait pas être 0`)
        }
    }

    static testFormat(format: string): boolean {
        return /^erreur:[0-9]+$/.test(format)
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
        return Math.abs(userFloat - expectedFloat) <= this._tolerance
    }

    toFormat():string {
        const n = Math.ceil(Math.log10(1 / this._tolerance))
        return `${MyMath.toFormat(this._expr, `${n+1}f`)} ± ${String(this._tolerance).replace('.', ',')}`
    }

    name():string {
        return `<erreur:${this._tolerance}>`
    }
}

export { ErreurCheck }


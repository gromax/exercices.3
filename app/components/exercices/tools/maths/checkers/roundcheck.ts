import { AbsChecker } from "./abscheck"
import { InputType } from "@components/types"
import MyMath from '@mathstools/mymath'
import { Decimal } from "decimal.js"


class RoundCheck extends AbsChecker {
    protected _digits:number

    constructor(expr:string, format:string = "") {
        super(expr, format)
        if (format == "integer" || format == "entier") {
            this._digits = 0
            return
        }
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
        return (format == "integer") || (format == "entier") || /^round:[0-9]+$/.test(format)
    }

    protected _testFormat():boolean {
        const test = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?(?:\s*%)?$/.test(this._expr)
        if (!test) {
            this._message = "Vous devez fournir un nombre éventuellement approximé."
        }
        return test
    }

    /**
     * @param {InputType} excluded 
     * @returns {boolean} renvoie true si la valeur est exclue, false sinon.
     */
    valueIsExcluded(excluded: InputType): boolean {
        if (!this.formatIsValid) {
            return false
        }
        const userFloat = MyMath.parseUser(this._expr).toDecimal()
        const excludedFloat = MyMath.make(excluded).toDecimal()
        if (userFloat.isNaN() || excludedFloat.isNaN()) {
            return false
        }
        return userFloat.eq(excludedFloat)
    }

    valueIsGood(expectedValue:InputType): boolean {
        const userFloat:Decimal = MyMath.parseUser(this._expr).toDecimal()
        const expectedFloat:Decimal = MyMath.make(expectedValue).toDecimal()
        if (userFloat.isNaN() || expectedFloat.isNaN()) {
            return false
        }
        const factor = new Decimal(Math.pow(10, this._digits))
        return userFloat.mul(factor).eq(expectedFloat.mul(factor).round())
    }

    toFormat():string {
        return MyMath.toFormat(this._expr, `${this._digits}f`)
    }

    name():string {
        return `<round:${this._digits}>`
    }

    testExpectedFormat(expected: InputType): boolean {
        return !isNaN(MyMath.make(expected).toFloat())
    }
    
    static standardName():string {
        return "round"
    }
}

export { RoundCheck }


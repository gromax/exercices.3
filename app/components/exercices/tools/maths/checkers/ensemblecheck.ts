import { AbsChecker } from "./abscheck"
import { InputType } from "@components/types"
import MyMath from '@mathstools/mymath'

class EnsembleCheck extends AbsChecker {
    /**
     * Test un ensemble
     */
    protected _parsedUser?:MyMath

    /** @param {number} _digits Le nombre de chiffres après la virgule attendu, -1 pour exact */
    private _digits?:number

    static readonly REGEX = /^ensemble(?:\:(?<digits>[0-9]+)f)?$/

    static testFormat(format: string): boolean {
        return EnsembleCheck.REGEX.test(format)
    }

    constructor(expr:string, format:string = "") {
        super(expr, format)
        if (format == "ensemble") {
            this._digits = undefined
            return
        }
        const match = format.match(EnsembleCheck.REGEX)
        const strDigits = match?.groups?.digits ?? "0"
        this._digits = Number(strDigits)
        if (Number.isNaN(this._digits)) {
            throw new Error(`${format} n'a pas la forme ensemble:###f attendue`)
        }
    }


    parsedUser():MyMath {
        if (typeof this._parsedUser === "undefined") {
            this._parsedUser = MyMath.parseUserEnsemble(this._expr)
        }
        return this._parsedUser
    }

    protected _testFormat():boolean {
        const mm = this.parsedUser()
        if (mm.isInvalidSet()) {
            this._message = "Expression invalide."
            return false
        }
        // on souhaite également que l'expression soit développée
        if (!mm.isExpanded() || !mm.isSimplified()) {
            this._message = "Vous devez simplifier."
            return false
        }
        return true
    }

    valueIsGood(expectedValue:InputType): boolean {
        if (!this.formatIsValid) {
            return false
        }
        const parsedExpected = MyMath.make(expectedValue)
        return this.parsedUser().isEqualToEnsemble(parsedExpected, this._digits)
    }

    toFormat():string {
        const tex = (typeof this._digits === "undefined")
            ? this.parsedUser().toFormat('$')
            : this.parsedUser().toFormat(`{this._digits}f$`)
        return `$${tex}$`
    }

    name():string {
        if (typeof this._digits === "undefined") {
            return "<ensemble>"
        }
        return `<ensemble:${this._digits}f>`
    }

    testExpectedFormat(expected: InputType): boolean {
        const mm = MyMath.make(expected)
        if (mm.isInvalidSet()) {
            return false
        }
        return true
    }
    
    static standardName():string {
        return "ensemble"
    }
}

export { EnsembleCheck }
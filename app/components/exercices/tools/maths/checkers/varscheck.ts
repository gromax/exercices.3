import { AbsChecker } from "./abscheck"
import { InputType } from "@components/types"
import MyMath from '@mathstools/mymath'


class VarsCheck extends AbsChecker {
    protected _vars:string
    protected _parsed:MyMath
    protected _expand: boolean

    static readonly REGEX = /^vars?:([a-zA-Z, ]+)(:expand)?$/

    constructor(expr:string, format:string = "") {
        super(expr,format)
        const match = VarsCheck.REGEX.exec(format)
        if (!match) {
            throw new Error(`Format invalide: ${format}`)
        }
        this._vars = match[1]
        this._expand = match[2] !== undefined
    }

    static testFormat(format: string): boolean {
        return VarsCheck.REGEX.test(format)
    }

    protected parsed():MyMath {
        if (typeof this._parsed == "undefined") {
            this._parsed = MyMath.parseUser(this._expr)
        }
        return this._parsed
    }

    protected _sub(contained:Array<string>, container:Array<string>|string): Array<string> {
        return contained.filter(item => !container.includes(item))
    }

    protected _testFormat():boolean {
        const mm = this.parsed()
        if (mm.isNaN()) {
            this._message = "Expression invalide"
            return false
        }
        const not_included = this._sub(mm.variables, this._vars)
        if (not_included.length>0) {
            this._message = `L'expression ne doit pas dépendre de ${not_included.join(' ,')}.`
            return false
        }
        if (this._expand && !mm.isExpanded()) {
            this._message = "Vous devez développer et/ou simplifier."
            return false
        } else if (!this._expand && !mm.isSimplified()) {
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
        return MyMath.parseUser(this._expr).expand().compare(parsedExpected.expand(), "==") as boolean
    }

    toFormat(): string {
        return `$${this.parsed().latex()}$`
    }

    name(): string {
        return `<var:${this._vars}>`
    }

    testExpectedFormat(expected: InputType): boolean {
        const mm = MyMath.make(expected)
        const notIncluded = this._sub(mm.variables, this._vars)
        return ((notIncluded.length>0 || mm.isNaN()))
    }


}

export { VarsCheck }


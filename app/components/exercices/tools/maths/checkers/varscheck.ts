import { AbsChecker } from "./abscheck"
import { InputType } from "@components/types"
import MyMath from '@mathstools/mymath'


class VarsCheck extends AbsChecker {
    protected _vars:string
    protected _parsed:MyMath

    constructor(expr:string, format:string = "") {
        super(expr,format)
        const parts = format.split(":")
        this._vars = parts.length>1
            ? parts[1].trim()
            : format.trim()
    }

    static testFormat(format: string): boolean {
        return format.startsWith("var:")
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
        if (mm.invalid) {
            this._message = "Expression invalide"
            return false
        }
        const not_included = this._sub(mm.variables, this._vars)
        if (not_included.length>0) {
            this._message = `L'expression ne doit pas dépendre de ${not_included.join(' ,')}.`
            return false
        }
        if (!mm.isExpanded()) {
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
        return ((notIncluded.length>0 || mm.invalid))
    }


}

export { VarsCheck }


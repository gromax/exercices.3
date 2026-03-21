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

    protected _testFormat():boolean {
        const mm = this.parsed()
        if (mm.invalid) {
            this._message = "Expression invalide"
            return false
        }
        const variables = mm.variables
        for (const v of variables) {
            if (!this._vars.includes(v)) {
                this._message = `L'expression ne doit pas dépendre de la variable ${v}.`
                return false
            }
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
}

export { VarsCheck }


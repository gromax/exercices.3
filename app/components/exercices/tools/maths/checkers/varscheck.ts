import { AbsChecker } from "./abscheck"
import { InputType } from "@components/types"
import MyMath from '@mathstools/mymath'


class VarsCheck extends AbsChecker {
    protected _vars:string

    constructor(expr:string, format:string = "") {
        super(format, expr)
        const parts = format.split(":")
        this._vars = parts.length>1
            ? parts[1].trim()
            : format.trim()
    }

    static testFormat(format: string): boolean {
        return format.startsWith("var:")
    }

    protected _testFormat():boolean {
        const mm = MyMath.make(this._expr)
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
}

export { VarsCheck }


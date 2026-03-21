import { AbsChecker } from "./abscheck"
import { InputType } from "@components/types"
import MyMath from '@mathstools/mymath'


class InfiniteCheck extends AbsChecker {
    static testFormat(format: string): boolean {
        return format == "infini"
    }

    protected _testFormat():boolean {
        let test = /^[-+]\s*(?:∞|inf|infini|infinity)$/.test(this._expr)
            ? true
            : false
        if (!test) {
            this._message = "Vous devez fournir une valeur infinie (ex: +inf, -∞)."
        }
        return test
    }

    valueIsGood(expectedValue:InputType): boolean {
        const parsedExpected = MyMath.make(expectedValue)
        return this.formatIsValid && parsedExpected.isMinusInfinity() === (this._expr[0] === '-')
    }

    toFormat():string {
        if (!this.formatIsValid) {
            throw new Error(`Format <infini> invalide pour ${this._expr}`)
        }
        return this._expr[0] == "-"
            ? '$-\\infty$'
            : '$+\\infty$'
    }

    name():string {
        return "<infini>"
    }
}

export { InfiniteCheck }


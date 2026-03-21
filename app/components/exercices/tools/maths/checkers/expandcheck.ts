import { AbsChecker } from "./abscheck"
import { InputType } from "@components/types"
import MyMath from '@mathstools/mymath'

class ExpandCheck extends AbsChecker {
    protected _parsed?:MyMath

    static testFormat(format: string): boolean {
        return format == "expand"
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
            this._message = "Expression invalide."
            return false
        }
        if (!mm.isExpanded()) {
            this._message = "Vous devez développer et simplifier."
            return false
        }
        return true
    }

    valueIsGood(expectedValue:InputType): boolean {
        const parsedExpected = MyMath.make(expectedValue)
        return MyMath.parseUser(this._expr).compare(parsedExpected.expand(), "==") as boolean
    }

    toFormat():string {
        return `$${this.parsed().latex()}$`
    }

    name():string {
        return "<expand>"
    }
}

export { ExpandCheck }
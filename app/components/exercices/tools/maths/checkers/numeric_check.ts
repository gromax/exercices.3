import { AbsChecker } from "./abscheck"
import { InputType } from "@components/types"
import MyMath from '@mathstools/mymath'


class NumericCheck extends AbsChecker {
    protected _parsedUser?:MyMath

    static testFormat(format: string): boolean {
        return format == "numeric"
    }

    protected parsedUser():MyMath {
        if (typeof this._parsedUser == "undefined") {
            this._parsedUser = MyMath.parseUser(this._expr)
        }
        return this._parsedUser
    }

    protected _testFormat():boolean {
        const mm = this.parsedUser()
        if (mm.invalid) {
            this._message = "Expression invalide."
            return false
        }
        const variables = mm.variables
        if (variables.length > 0) {
            this._message = `Expression numérique attendue (pas de ${variables.join(', ')}).`
            return false
        }
        if (mm.toFormat('s').includes('∞')) {
            this._message = "Expression numérique attendue (pas d'infini)."
            return false
        }
        // on souhaite également que l'expression soit développée
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
        return this.parsedUser().pseudoEquality(parsedExpected)
    }

    toFormat():string {
        return `$${this.parsedUser().latex()}$`
    }

    name():string {
        return "<numeric>"
    }
}

export { NumericCheck }


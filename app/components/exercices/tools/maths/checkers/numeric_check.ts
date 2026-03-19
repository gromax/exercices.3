import { AbsChecker } from "./abscheck"
import { InputType } from "@components/types"
import MyMath from '@mathstools/mymath'


class NumericCheck extends AbsChecker {
    protected _parsedUser?:MyMath

    static testFormat(format: string): boolean {
        return format == "numeric"
    }

    protected _testFormat():boolean {
        try {
            const mm = MyMath.make(this._expr)
            this._parsedUser = mm
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
        } catch (e) {
            // parsing error => pas numérique
            this._message = "Expression invalide."
            return false
        }
    }

    valueIsGood(expectedValue:InputType): boolean {
        if (!this.formatIsValid) {
            return false
        }
        const parsedExpected = MyMath.make(expectedValue)
        return (this._parsedUser as MyMath).pseudoEquality(parsedExpected)
    }
}

export { NumericCheck }


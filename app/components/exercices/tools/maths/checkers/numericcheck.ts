import { AbsChecker } from "./abscheck"
import { InputType } from "@components/types"
import MyMath from '@mathstools/mymath'
import { isAlgebraic } from "../misc/complexcalculus"

class NumericCheck extends AbsChecker {
    protected _parsedUser?:MyMath

    static testFormat(format: string): boolean {
        return format == "numeric" || format == "algebraic"
    }

    parsedUser():MyMath {
        if (typeof this._parsedUser == "undefined") {
            this._parsedUser = MyMath.parseUser(this._expr)
        }
        return this._parsedUser
    }

    protected _testFormat():boolean {
        const mm = this.parsedUser()
        if (mm.isNaN()) {
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
        // on souhaite également que l'expression soit simplifiée
        if (!mm.isSimplified() || !mm.isExpanded()) {
            this._message = "Vous devez simplifier."
            return false
        }
        if (this._format === "algebraic" && !isAlgebraic(mm.getMyNumber())) {
            this._message = "Vous devez mettre sous forme algébrique a+ib."
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
        // on attend bien sûr une forme simplifiée
        return `$${this.parsedUser().toFormat('s$')}$`
    }

    name():string {
        return `<${this._format}>`
    }

    testExpectedFormat(expected: InputType): boolean {
        const mm = MyMath.make(expected)
        if (mm.isNaN()) {
            return false
        }
        return true
    }
    
    static standardName():string {
        return "numeric"
    }
}

export { NumericCheck }


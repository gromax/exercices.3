import { AbsChecker } from "./abscheck"
import { InputType } from "@components/types"


class EmptyCheck extends AbsChecker {
    protected _testFormat():boolean {
        const test = ['vide', '∅', 'empty'].includes(this._expr)
        if (!test) {
            this._message = "Vous devez répondre 'vide' ou '∅' pour indiquer l'ensemble vide."
        }
        return test
    }

    valueIsGood(expectedValue:InputType): boolean {
        return this.formatIsValid
    }
}

export { EmptyCheck }
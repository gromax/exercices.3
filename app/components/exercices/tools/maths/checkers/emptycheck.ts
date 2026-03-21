import { AbsChecker } from "./abscheck"
import { InputType } from "@components/types"


class EmptyCheck extends AbsChecker {
    static testFormat(format: string): boolean {
        return format == "empty"
    }

    private _test(expr:string):boolean {
        return ['vide', '∅', 'empty'].includes(expr)
    }

    protected _testFormat():boolean {
        const test = this._test(this._expr)
        if (!test) {
            this._message = "Vous devez répondre 'vide' ou '∅' pour indiquer l'ensemble vide."
        }
        return test
    }

    valueIsGood(expectedValue:InputType): boolean {
        return this._test(String(expectedValue)) && this.formatIsValid
    }

    toFormat():string {
        if (!this.formatIsValid) {
            throw new Error(`<empty> la chaine ${this._expr} ne respecte pas le format`)
        }
        return '$\\emptyset$'
    }

    name():string {
        return "<empty>"
    }
}

export { EmptyCheck }
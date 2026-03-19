import { AbsChecker } from "./abscheck"
import { VarsCheck } from "./varscheck"
import { InputType } from "@components/types"
import MyMath from '@mathstools/mymath'

class EquationCheck extends AbsChecker {
    protected _vars:string

    constructor(expr:string, format:string = "") {
        super(expr, format)
        if (!format.startsWith("equation:")) {
            throw new Error(`Utilisation ${format} à la place de "equation:###"`)
        }
        const parts = format.split(":")
        this._vars = parts.length>1
            ? parts[1].trim()
            : format.trim()
    }

    static testFormat(format: string): boolean {
        return format.startsWith("equation:")
    }

    protected _testFormat():boolean {
        if (this._expr == "") {
            this._message = "L'expression est vide"
            return false
        }
        if (!this._expr.includes("=")) {
            this._message = "Une équation devrait contenir ="
            return false
        }
        const membres = this._expr.split("=")
        if (membres.length != 2) {
            this._message = "Une équation ne devrait avoir qu'un ="
            return false
        }
        if (membres[0].trim() == "") {
            this._message = "Membre gauche vide"
            return false
        }
        if (membres[1].trim() == "") {
            this._message = "Membre droit vide"
            return false
        }
        const checkLeft = new VarsCheck(this._vars, membres[0])
        if (!checkLeft.formatIsValid) {
            this._message = checkLeft.message
            return false
        }
        const checkRight = new VarsCheck(this._vars, membres[1])
        if (!checkRight.formatIsValid) {
            this._message = checkRight.message
            return false
        }
        return true
    }

    valueIsGood(expectedValue:InputType): boolean {
        if (!this.formatIsValid) {
            return false
        }
        // On fait le parse des deux membres et on soustrait
        const userMembres = this._expr.split("=")
        const user = MyMath.make(`(${userMembres[0]})-(${userMembres[1]})`)
        if ((typeof expectedValue == "string") && expectedValue.includes("=")) {
            const expectedMembres = expectedValue.split("=")
            if (expectedMembres.length != 2) {
                throw new Error(`La valeur attendue ${expectedValue} a trop de =`)
            }
            expectedValue = `(${expectedMembres[0]}) - (${expectedMembres[1]})`
        }
        const good = MyMath.make(expectedValue)
        const v = user.variables
        v.sort()
        const v2 = good.variables
        v2.sort()
        if (v.length !== v2.length) {
            return false
        }
        for (let i=0;i<v.length;i++) {
            if (v[i]!=v2[i]) {
                return false
            }
        }
        // les variables sont les mêmes
        // si pas de variable, alors ok
        if (v.length == 0) {
            return true
        }
        // maintenant on va trouver le coefficient de la première variable.
        const v0 = v[0]
        const d1 = user.diff(v0)
        const d2 = good.diff(v0)
        // Pour que ce soit bon, d1 et d2 doivent être de simples scalaires
        if ((d1.variables.length>0) || (d2.variables.length>0)) {
            return false
        }
        // on a donc 2 constantes. On peut faire d2*user - d1*good
        // et tester si ça fait 0
        const reduct = MyMath.make(`(${d1})*(${good}) - (${d2})*(${user})`)
        return reduct.compare(0, "==") as boolean
    }
}

export { EquationCheck }
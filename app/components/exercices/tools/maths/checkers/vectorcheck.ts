import { AbsChecker } from "./abscheck"
import { NumericCheck } from "./numeric_check"
import { InputType } from "@components/types"
import MyMath from '@mathstools/mymath'

class VectorCheck extends AbsChecker {
    protected _size:number
    protected _colinear:boolean
    protected _notnul:boolean
    protected _parts?:Array<NumericCheck>

    constructor(expr:string, format:string = "") {
        super(expr, format)
        if (!format.startsWith("vecteur:")) {
            throw new Error(`Utilisation ${format} à la place de "vecteur:###"`)
        }
        const parts = format.split(":")
        // parts[1] contient la taille
        this._size = Number(parts[1])
        if (this._size <= 1) {
            throw new Error(`Pour le format <vecteur> la taille doit être au moins de 2`)
        }
        const sup = parts.slice(2)
        this._colinear = sup.includes('colinear')
        this._notnul = sup.includes('notnul')
    }

    static testFormat(format: string): boolean {
        return /^vecteur:[0-9]*(:[^:]*)*$/.test(format)
    }

    protected calc_parts(str_parts:Array<string>):Array<NumericCheck> {
        if (typeof this._parts == "undefined") {
            this._parts = str_parts.map(item => new NumericCheck(item, "numeric"))
        }
        return this._parts
    }

    protected _testFormat():boolean {
        if (this._expr == "") {
            this._message = "L'expression est vide"
            return false
        }
        const str_parts = this._expr.split(';')

        if (str_parts.length != this._size) {
            this._message = `Le vecteur doit avoir ${this._size} coordonnées séparées par ;`
            return false
        }
        const parts = this.calc_parts(str_parts)
        for (const part of parts) {
            if (!part.formatIsValid) {
                this._message = part.message
                return false
            }
        }
        return true
    }

    valueIsGood(expectedValue:InputType): boolean {
        if (!this.formatIsValid) {
            return false
        }
        const parts = this.calc_parts([])
        if (expectedValue instanceof MyMath) {
            expectedValue = expectedValue.expression
        } else {
            expectedValue = String(expectedValue)
        }
        const expected_parts = expectedValue.split(";")
        if (expected_parts.length != this._size) {
            throw new Error(`La solution ${expectedValue} n'a pas le bon nombre d'éléments`)
        }
        // vérification du cas notnull
        if (this._notnul && parts.every(item => item.valueIsGood(0))) {
            return false
        }

        // vérification simple dans le cas non colinéaire
        if (!this._colinear) {
            for (let i=0; i<parts.length; i++) {
                const part = parts[i]
                if (!part.valueIsGood(expected_parts[i])) {
                    return false
                }
            }
            return true
        }
        

        // on est dans un cas colinéaire
        // il faut vérifier tous les déterminants
        // On cherche un élément non nul
        const index = parts.findIndex(item => !item.valueIsGood(0))
        if (index == -1) {
            // toutes valeurs nulles et comme pas notnul alors c'est valide
            return true
        }
        const a1 = parts[index].expression
        const a2 = expected_parts[index]
        for (let j=0; j<parts.length; j++) {
            if (j==index) {
                continue
            }
            // Calcul du déterminant
            const determinant = `(${a1})*(${expected_parts[j]}) - (${a2})*(${parts[j].expression})`
            if (!MyMath.compare(determinant,  "0", "==")) {
                return false
            }
        }
        return true
    }

    toFormat():string {
        // ajout d'un = 0 par défaut
        return "$\\left("+this._expr.split(';').map(MyMath.latex).join("\\,; ")+"\\right)$"
    }

    name():string {
        let base = `<equation:${this._size}`
        if (this._colinear) {
            base += ":colinear"
        }
        if (this._notnul) {
            base += ":notnul"
        }
        return base
    }

    testExpectedFormat(expected: InputType): boolean {
        if (expected instanceof MyMath) {
            expected = expected.expression
        } else {
            expected = String(expected)
        }
        if (expected.split(";").length != this._size) {
            return false
        }
        return true
    }
}

export { VectorCheck }
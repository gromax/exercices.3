import { AbsChecker } from "./abscheck"
import { NumericCheck } from "./numeric_check"
import { InputType } from "@components/types"
import MyMath from '@mathstools/mymath'

class CriterionCheck extends AbsChecker {
    protected _size:number
    protected _criterion:string
    protected _mathCriterion:MyMath
    protected _vars:string
    protected _parts?:Array<NumericCheck>
    protected _comparator:string

    constructor(expr:string, format:string = "") {
        super(expr, format)
        if (!format.startsWith("criterion:")) {
            throw new Error(`Utilisation ${format} à la place de "criterion:###"`)
        }
        const parts = format.split(":")
        if (parts.length < 3) {
            throw new Error(`Le format doit être de la forme "criterion:vars:expression". Par ex: "criterion:xy:2x+3y^2"`)
        }
        // parts[1] contient la taille
        this._vars = parts[1]
        this._size = this._vars.length
        if (this._size < 1) {
            throw new Error(`Pour le format <criterion> la taille doit être au moins de 1`)
        }
        const all_criterion = parts[2]
        // la fin du critere pourrait être ==0, <0, <=0, >0, >=0
        // le ? permet de valider dès que ça match
        const regex = /^\s*(.*?)\s*(==|<=|>=|<|>)\s*0\s*$/
        const match = all_criterion.match(regex)
        if (!match) {
            throw new Error(`Le critère ${all_criterion} n'est pas dans un format valide. Il doit être de la forme "expression==0", "expression<0", etc.`)
        }
        this._criterion = match[1]
        this._mathCriterion = MyMath.make(this._criterion)
        this._comparator = match[2]
    }

    static testFormat(format: string): boolean {
        return /^criterion:[a-zA-Z]+:[^:]+$/.test(format)
    }

    protected calc_parts(str_parts:Array<string>):Array<NumericCheck> {
        if (typeof this._parts == "undefined") {
            this._parts = str_parts.map(item => new NumericCheck(item, "numeric"))
        }
        return this._parts
    }

    protected _testFormat():boolean {
        // Vérifie que la réponse a la bonne taille
        // et que chaque partie est numérique
        if (this._expr == "") {
            this._message = "L'expression est vide"
            return false
        }
        const str_parts = this._expr.split(';')

        if (str_parts.length != this._size) {
            this._message = `Le réponse doit avoir ${this._size} éléments séparés par ;`
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
        if (expectedValue instanceof MyMath) {
            expectedValue = expectedValue.expression
        } else {
            expectedValue = String(expectedValue)
        }
        const expected_parts = expectedValue.split(";")
        if (expected_parts.length != this._size) {
            throw new Error(`La solution ${expectedValue} n'a pas le bon nombre d'éléments`)
        }

        const parts = this.calc_parts(this._expr.split(';'))

        // Il faut maintenant évaluer le critère
        const vars:Record<string,string> = {}
        for (let i=0; i<this._size; i++) {
            vars[this._vars[i]] = parts[i].expression
            vars[this._vars[i]+"0"] = expected_parts[i]
        }
        const criterionValue = this._mathCriterion.subs(vars)
        if (this._comparator == "==") {
            return criterionValue.pseudoEquality(0)
        }
        return criterionValue.compare(0, this._comparator) as boolean
    }

    toFormat():string {
        // ajout d'un = 0 par défaut
        return "$\\left("+this._expr.split(';').map(MyMath.latex).join("\\,; ")+"\\right)$"
    }

    name():string {
        return `<criterion:${this._vars}:${this._criterion}>`
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

export { CriterionCheck }
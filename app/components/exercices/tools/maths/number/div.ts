import _ from "underscore"
import { Base } from "./base"
import { Scalar } from "./scalar"
import { Mult } from "./mult"
import { Power } from "./power"
import { AddMinus } from "./add"
import Decimal from "decimal.js"
import { Signature } from "./signature"
import { NestedString } from '@types'
class Div extends Base {
    private _left:Base /** @type {Base} */
    private _right:Base /** @type {Base} */
    private _string: string | null = null /** @type {string|null} représentation texte */
    private _stringEN: string | null = null /** @type {string|null} représentation texte */

    /**
     * accesseurs
     */
    get left():Base {
        return this._left;
    }

    get right():Base {
        return this._right;
    }

    get scalarFactor():Scalar {
        return Scalar.div(this._left.scalarFactor, this._right.scalarFactor)
    }

    get withoutScalarFactor():Base {
        const newLeft = this._left.withoutScalarFactor
        const newRight = this._right.withoutScalarFactor
        return Div.div(newLeft, newRight)
    }

    get priority():number {
        return 2;
    }

    static div(left:Base, right:Base):Div {
        if (!(left instanceof Base) || !(right instanceof Base)) {
            throw new Error('Les deux opérandes doivent être des instances de Base')
        }
        return new Div(left, right)
    }

    /**
     * constructeur
     * @param {Base} left 
     * @param {Base} right
     */
    constructor(left:Base, right:Base) {
        super()
        if (!(left instanceof Base)) {
            throw new Error("left invalide")
        }
        if (!(right instanceof Base)) {
            throw new Error("right invalide")
        }
        this._left = left
        this._right = right
    }

    /**
     * renvoie la liste des variables dont dépend le noeud
     * @returns {Array<string|NestedString>}
     */
    subVariables(): NestedString {
        return [...this._left.subVariables(), ...this._right.subVariables()]
    }

    substituteVariable(varName:string, value:Base|string|Decimal|number):Base {
        const newLeft = this._left.substituteVariable(varName, value)
        const newRight = this._right.substituteVariable(varName, value)
        if (newLeft === this._left && newRight === this._right) {
            // pas de changement
            return this
        }
        return new Div(newLeft, newRight)
    }

    substituteVariables(substitutions:Record<string, Base|string|Decimal|number>):Base {
        const leftSub = this._left.substituteVariables(substitutions)
        const rightSub = this._right.substituteVariables(substitutions)
        if (leftSub === this._left && rightSub === this._right) {
            // pas de changement
            return this
        }
        return new Div(leftSub, rightSub);
    }

    toFixed(n:number):Base {
        const newLeft = this._left.toFixed(n)
        const newRight = this._right.toFixed(n)
        return new Div(newLeft, newRight)
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString():string {
        if (this._string != null) {
            return this._string
        }
        const left = this._left.priority <= this.priority
            ? `(${String(this._left)})`
            : String(this._left)
        const right = this._right.priority <= this.priority
            ? `(${String(this._right)})`
            : String(this._right)
        this._string = `${left} / ${right}`
        return this._string
    }

    toStringEn():string {
        if (this._stringEN == null) {
            this._stringEN = `(${this._left.toStringEn()}) / (${this._right.toStringEn()})`
        }
        return this._stringEN
    }

    /**
     * test si le noeud est développé
     * @returns {boolean} revoie faux si le numérateur ou le dénominateur ne sont pas développés
     */
    isExpanded():boolean {
        if (!this._left.isExpanded() || !this._right.isExpanded()) {
            return false
        }
        if (this.isInteger()) {
            return false
        }
        return true
    }

    /**
     * test si le noeud est simplifié
     * @returns {boolean} revoie faux si le numérateur ou le dénominateur ne sont pas simplifiés
     */
    isSimplified():boolean {
        if (!this._left.isSimplified() || !this._right.isSimplified()) {
            return false
        }
        if (this.isInteger()) {
            return false
        }
        return true
    }

    isInteger():boolean {
        const n = this._left.toDecimal(undefined)
        const d = this._right.toDecimal(undefined)
        if (n.isNaN() || d.isNaN()) {
            return false
        }
        return n.isInteger() && d.isInteger() && n.modulo(d).isZero()
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex():string {
        let texLeft = this._left.toTex()
        let texRight = this._right.toTex()
        return `\\frac{${texLeft}}{${texRight}}`
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values:Record<string, Decimal|string|number>|undefined):Decimal {
        let left = this._left.toDecimal(values);
        let right = this._right.toDecimal(values);
        return left.dividedBy(right);
    }

    signature():Signature {
        return this._left.signature().div(this._right.signature())
    }

    opposite():Base {
        if (typeof (this._left as any).opposite === 'function') {
            return new Div((this._left as any).opposite(), this._right)
        }
        if (typeof (this._right as any).opposite === 'function') {
            return new Div(this._left, (this._right as any).opposite())
        }
        return Mult.mult(Scalar.MINUS_ONE, this)
    }

    toDict():object {
        return {
            type: "Div",
            left: this._left.toDict(),
            right: this._right.toDict()
        }
    }

    /**
     * renvoie la dérivée
     * @param {string} varName 
     * @returns {Base}
     */
    derivate(varName:string):Base {
        // implémentation spécifique pour Div
        if (!this.variables.includes(varName)) {
            return Scalar.ZERO
        }
        const up = this._left.derivate(varName)
        const vp = this._right.derivate(varName)
        const up_v = Mult.mult(up, this._right)
        const vp_u = Mult.mult(vp, this._left)
        const numerator = AddMinus.minus(up_v, vp_u)
        const denominator = new Power(this._right, Scalar.TWO)

        return new Div(
            numerator,
            denominator
        )
    }
}

export { Div }
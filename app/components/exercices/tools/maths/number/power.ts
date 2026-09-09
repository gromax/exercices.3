import _ from "underscore"
import { Base } from "./base"
import { Scalar } from "./scalar"
import { Signature } from "./signature"
import { Mult } from "./mult"
import Decimal from "decimal.js"
import { NestedString } from '@types'

/* Classe représentant une puissance (base^exposant)
   avec un exposant constant
*/

class Power extends Base {
    /** @type {Base} */
    private _base:Base

    /** @type {Scalar|Constant} */
    private _exposant:Scalar

    /** @type {Scalar|Constant} */
    private _decExposant:Decimal

    /** @type {string|null} */
    private _string:string|null = null

    /** @type {string|null} */
    private _stringEN:string|null = null

    /** @type {string|null} */
    private _stringTex:string|null = null

    static isPower(base: Base, exposant: Scalar): boolean {
        if (!(base instanceof Base) || !(exposant instanceof Scalar)) {
            return false
        }
        if (!exposant.isInteger()){
            return false
        }
        return true
    }

    static make(base:Base, exposant:Scalar):Base {
        if (exposant instanceof Scalar) {
            if (exposant.isZero()) {
                return Scalar.ONE
            } else if (exposant.isOne()) {
                return base
            }
        }
        return new Power(base, exposant)
    }

    /**
     * constructeur
     * @param {Base} base 
     * @param {Scalar} exposant 
     */
    constructor(base:Base, exposant:Scalar) {
        super()
        if (!Power.isPower(base, exposant)) {
            throw new Error(`La puissance ${base}^${exposant} est invalide`);
        }
        this._base = base;
        this._exposant = exposant;
        this._decExposant = exposant.toDecimal(undefined);
    }

    /**
     * renvoie la liste des variables dont dépend le noeud
     * @returns {NestedString}
     */
    subVariables(): NestedString {
        return [this._base.subVariables()]
    }

    private _toStringHelper(lang:string):string {
        let baseStr = lang === 'en'
            ? this._base.toStringEn()
            : lang == 'tex'
                ? this._base.toTex()
                : String(this._base)
        let exposantStr = lang === 'en'
            ? this._exposant.toStringEn()
            : lang == 'tex'
                ? this._exposant.toTex()
                : String(this._exposant)
        if (this._base.priority <= this.priority) {
            if (lang === 'tex') {
                baseStr = `\\left(${baseStr}\\right)`
            } else {
                baseStr = `(${baseStr})`
            }
        }
        if ((this._exposant.priority <= this.priority) || (this._exposant.startsWithMinus)) {
            if (lang === 'tex') {
                exposantStr = `\\left(${exposantStr}\\right)`
            } else {
                exposantStr = `(${exposantStr})`
            }
        }
        if (lang === 'tex') {
            return `${baseStr}^{${exposantStr}}`
        } else {
            return `${baseStr}^${exposantStr}`
        }
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString():string {
        if (this._string === null) {
            this._string = this._toStringHelper('fr')
        }
        return this._string
    }

    toStringEn():string {
        if (this._stringEN === null) {
            this._stringEN = this._toStringHelper('en')
        }
        return this._stringEN
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex():string {
        if (this._stringTex === null) {
            this._stringTex = this._toStringHelper('tex')
        }
        return this._stringTex
    }

    get priority():number {
        return 3;
    }

    get base():Base {
        return this._base;
    }

    get exposant():Scalar {
        return this._exposant;
    }

    get scalarFactor():Scalar {
        return Scalar.ONE
    }

    /**
     * @returns {boolean} revoie vrai si la puissance est développée
     */
    isExpanded():boolean {
        if (!this._base.isExpanded()) {
            return false
        }
        if (this._decExposant.gte(0) && this._base.canBeDistributed) {
            return false
        }
        return true
    }

    /**
     * test si le noeud est simplifié
     * @returns {boolean} revoie faux si la base ou l'exposant ne sont pas simplifiés
     */
    isSimplified():boolean {
        if (!this._base.isSimplified()) {
            return false
        }
        const d = this._decExposant
        if (d.isNaN()) {
            return true
        }
        if (d.isZero() || d.minus("1").isZero()) {
            return false
        }
        if (d.isInteger() && (this._base instanceof Scalar)) {
            return false
        }
        return true
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values:Record<string, Decimal|string|number>):Decimal {
        let base = this._base.toDecimal(values);
        return base.pow(this._decExposant);
    }

    signature():Signature {
        return this._base.signature().power(this._decExposant.toNumber())
    }

    substituteVariable(varName:string, value:Base|string|Decimal|number):Base {
        const newBase = this._base.substituteVariable(varName, value)
        if (newBase === this._base) {
            // pas de changement
            return this
        }
        return new Power(newBase, this._exposant)
    }

    substituteVariables(values:Record<string, Base|string|Decimal|number>):Base {
        const newBase = this._base.substituteVariables(values)
        const newExposant = this._exposant.substituteVariables(values)
        if (newBase === this._base && newExposant === this._exposant) {
            // pas de changement
            return this
        }
        return new Power(newBase, this._exposant)
    }

    toFixed(n:number):Base {
        const newBase = this._base.toFixed(n)
        const newExposant = this._exposant.toFixed(n) as Scalar
        return new Power(newBase, newExposant)
    }

    toDict():object {
        return {
            type: "Power",
            base: this._base.toDict(),
            exposant: this._decExposant.toString()
        }
    }

    /**
     * renvoie la dérivée
     * @param {string} varName 
     * @returns {Base}
     */
    derivate(varName:string):Base {
        if (!this._base.variables.includes(varName)) {
            return Scalar.ZERO
        }
        // implémentation spécifique pour Power
        const baseDer = this._base.derivate(varName)
        return Mult.fromList([
            this._exposant,
            baseDer,
            Power.make(
                this._base,
                new Scalar(this._decExposant.minus('1'))
            )
        ])

    }
}

export { Power }
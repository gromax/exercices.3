import _ from "underscore"
import { Base } from "./base"
import { Scalar } from "./scalar"
import { I } from "./constant"
import { Signature } from "../misc/signature"
import { Mult } from "./mult"
import Decimal from "decimal.js"
import { ComplexDecimal } from "../misc/complexdecimal"
import { NestedString } from '@types'


/* Classe représentant une puissance (base^exposant)
   avec un exposant constant
*/

class Power extends Base {
    /** @type {Base} */
    private _base:Base

    /** @type {Decimal} */
    private _exposant:Decimal

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

    static make(base:Base, exposant:Decimal|number):Base {
        if (typeof exposant === 'number') {
            exposant = new Decimal(exposant)
        }
        if (exposant.isZero()) {
            return Scalar.ONE
        } else if (exposant.eq(1)) {
            return base
        }
        if (!exposant.isInteger()) {
            throw new Error(`La puissance ${base}^${exposant} est invalide`);
        }
        return new Power(base, exposant)
    }

    /**
     * constructeur
     * @param {Base} base 
     * @param {Scalar|Decimal} exposant, un entier
     */
    private constructor(base:Base, exposant:Decimal) {
        super()
        this._base = base;
        this._exposant = exposant;
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
            ? this._exposant.toString()
            : lang == 'tex'
                ? this._exposant.toString().replace('.', ',')
                : String(this._exposant)
        if ((this._base.priority <= this.priority) || (this._base.startsWithMinus)) {
            if (lang === 'tex') {
                baseStr = `\\left(${baseStr}\\right)`
            } else {
                baseStr = `(${baseStr})`
            }
        }
        if (this._exposant.lt(0) && lang !== 'tex') {
            exposantStr = `(${exposantStr})`
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

    get exposant():Decimal {
        return this._exposant;
    }

    /**
     * @returns {boolean} revoie vrai si la puissance est développée
     */
    isExpanded():boolean {
        if (!this._base.isExpanded()) {
            return false
        }
        const canBeExpanded = this._base.canBeDistributed ||
            (this._base instanceof Power) ||
            (this._base instanceof Scalar) ||
            (this._base instanceof Mult) ||
            (this._base === I)
        if (this._exposant.gte(0) && canBeExpanded) {
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
        if (this._exposant.isZero() || this._exposant.eq(1)) {
            return false
        }
        if (this._base instanceof Scalar || this._base === I) {
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
        return base.pow(this._exposant);
    }

    /**
     * evaluation numérique en decimal complexe
     * @param {object|undefined} values
     * @returns {ComplexDecimal}
     */
    toComplexDecimal(values:Record<string, Decimal|string|number>):ComplexDecimal {
        const base = this._base.toComplexDecimal(values)
        return base.pow(this._exposant)
    }

    signature():Signature {
        return this._base.signature().power(this._exposant.toNumber())
    }

    substituteVariable(varName:string, value:Base|Decimal|number):Base {
        const newBase = this._base.substituteVariable(varName, value)
        if (newBase === this._base) {
            // pas de changement
            return this
        }
        return new Power(newBase, this._exposant)
    }

    substituteVariables(values:Record<string, Base|Decimal|number>):Base {
        const newBase = this._base.substituteVariables(values)
        if (newBase === this._base) {
            // pas de changement
            return this
        }
        return new Power(newBase, this._exposant)
    }

    toFixed(n:number):Base {
        const newBase = this._base.toFixed(n)
        return new Power(newBase, this._exposant)
    }

    toDict():object {
        return {
            type: "Power",
            base: this._base.toDict(),
            exposant: this._exposant.toString()
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
            new Scalar(this._exposant),
            baseDer,
            Power.make(
                this._base,
                this._exposant.minus('1')
            )
        ])
    }

    isNaN():boolean {
        return this._base.isNaN() || this._exposant.isNaN()
    }
    
    hasI():boolean {
        return this._base.hasI()
    }
}

export { Power }
import _ from "underscore"
import { Base } from "./base"
import { Scalar } from "./scalar"
import { Signature } from "./signature"
import Decimal from "decimal.js"

class Power extends Base {
    /** @type {Base} */
    private _base:Base
    /** @type {Base} */
    private _exposant:Base
    /** @type {string|null} */
    private _string:string|null = null
    /** @type {string|null} */
    private _stringEN:string|null = null
    /** @type {string|null} */
    private _stringTex:string|null = null

    /**
     * constructeur
     * @param {Base} base 
     * @param {Base} exposant 
     */
    constructor(base:Base, exposant:Base) {
        super()
        if (!(base instanceof Base)) {
            throw new Error("base invalide");
        }
        if (!(exposant instanceof Base)) {
            throw new Error("exposant invalide");
        }
        this._base = base;
        this._exposant = exposant;
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

    get exposant():Base {
        return this._exposant;
    }

    get scalarFactor():Scalar {
        return Scalar.ONE
    }

    isExpanded():boolean {
        if (!this._base.isExpanded() || !this._exposant.isExpanded()) {
            return false
        }
        const d = this._exposant.toDecimal(undefined)
        if (d.isNaN()) {
            return true
        }
        if (d.isInteger() && d.gte(0) && this._base.canBeDistributed) {
            return false
        }
        return true
    }


    /**
     * si un nom est précisé, renvoie true si le nœud dépend de la variable,
     * sinon renvoie la liste des variables dont dépend le noeud
     * @param {string|undefined} name 
     * @returns {boolean|Array}
     */
    isFunctionOf(name:string|undefined):boolean|Array<string> {
        if (typeof name === 'undefined') {
            const baseVars = this._base.isFunctionOf(undefined) as Array<string>
            const exposantVars = this._exposant.isFunctionOf(undefined) as Array<string>
            return _.uniq(baseVars.concat(exposantVars)).sort()
        }
        return this._base.isFunctionOf(name) as boolean || this._exposant.isFunctionOf(name) as boolean
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values:Record<string, Decimal|string|number>):Decimal {
        let base = this._base.toDecimal(values);
        let exposant = this._exposant.toDecimal(values);
        return base.pow(exposant);
    }

    signature():Signature {
        const expoValue = this._exposant.toDecimal(undefined)
        if (expoValue.isInteger()) {
            return this._base.signature().power(expoValue.toNumber())
        }
        return super.signature()
    }

    substituteVariable(varName:string, value:Base|string|Decimal|number):Base {
        const newBase = this._base.substituteVariable(varName, value)
        const newExposant = this._exposant.substituteVariable(varName, value)
        if (newBase === this._base && newExposant === this._exposant) {
            // pas de changement
            return this
        }
        return new Power(newBase, newExposant)
    }

    substituteVariables(values:Record<string, Base|string|Decimal|number>):Base {
        const newBase = this._base.substituteVariables(values)
        const newExposant = this._exposant.substituteVariables(values)
        if (newBase === this._base && newExposant === this._exposant) {
            // pas de changement
            return this
        }
        return new Power(newBase, newExposant)
    }

    toFixed(n:number):Base {
        const newBase = this._base.toFixed(n)
        const newExposant = this._exposant.toFixed(n)
        return new Power(newBase, newExposant)
    }

    toDict():object {
        return {
            type: "Power",
            base: this._base.toDict(),
            exposant: this._exposant.toDict()
        }
    }
}

export { Power }
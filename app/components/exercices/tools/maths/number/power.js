import { Base } from "./base"
import Decimal from "decimal.js"

class Power extends Base {
    /** @type {Base} */
    #base;
    /** @type {Base} */
    #exposant;
    /** @type {string|null} */
    #string = null;
    /** @type {string|null} */
    #stringEN = null;
    /** @type {string|null} */
    #stringTex = null;

    /**
     * constructeur
     * @param {Base} base 
     * @param {Base} exposant 
     */
    constructor(base, exposant) {
        super();
        if (!(base instanceof Base)) {
            throw new Error("base invalide");
        }
        if (!(exposant instanceof Base)) {
            throw new Error("exposant invalide");
        }
        this.#base = base;
        this.#exposant = exposant;
    }

    #toStringHelper(lang) {
        let baseStr = lang === 'en'
            ? this.#base.toStringEn()
            : lang == 'tex'
                ? this.#base.toTex()
                : String(this.#base)
        let exposantStr = lang === 'en'
            ? this.#exposant.toStringEn()
            : lang == 'tex'
                ? this.#exposant.toTex()
                : String(this.#exposant)
        if (this.#base.priority <= this.priority) {
            if (lang === 'tex') {
                baseStr = `\\left(${baseStr}\\right)`
            } else {
                baseStr = `(${baseStr})`
            }
        }
        if ((this.#exposant.priority <= this.priority) || (this.#exposant.startsWithMinus)) {
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
    toString() {
        if (this.#string === null) {
            this.#string = this.#toStringHelper('fr')
        }
        return this.#string
    }

    toStringEn() {
        if (this.#stringEN === null) {
            this.#stringEN = this.#toStringHelper('en')
        }
        return this.#stringEN
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex() {
        if (this.#stringTex === null) {
            this.#stringTex = this.#toStringHelper('tex')
        }
        return this.#stringTex
    }

    get priority() {
        return 3;
    }

    get base() {
        return this.#base;
    }

    get exposant() {
        return this.#exposant;
    }

    isExpanded() {
        if (!this.#base.isExpanded() || !this.#exposant.isExpanded()) {
            return false
        }
        const d = this.#exposant.toDecimal()
        if (d.isNaN()) {
            return true
        }
        if (d.isInteger() && d.gte(0) && this.#base.canBeDistributed) {
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
    isFunctionOf(name){
        if (typeof name == 'undefined') {
            return _.uniq(this.#base.isFunctionOf().concat(this.#exposant.isFunctionOf())).sort();
        }
        return this.#base.isFunctionOf(name) || this.#exposant.isFunctionOf(name);
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values) {
        let base = this.#base.toDecimal(values);
        let exposant = this.#exposant.toDecimal(values);
        return base.pow(exposant);
    }

    signature() {
        const expoValue = this.#exposant.toDecimal()
        if (expoValue.isInteger()) {
            return this.#base.signature().power(expoValue.toNumber())
        }
        return super.signature()
    }

    substituteVariable(varName, value) {
        const newBase = this.#base.substituteVariable(varName, value)
        const newExposant = this.#exposant.substituteVariable(varName, value)
        if (newBase === this.#base && newExposant === this.#exposant) {
            // pas de changement
            return this
        }
        return new Power(newBase, newExposant)
    }

    substituteVariables(values) {
        const newBase = this.#base.substituteVariables(values)
        const newExposant = this.#exposant.substituteVariables(values)
        if (newBase === this.#base && newExposant === this.#exposant) {
            // pas de changement
            return this
        }
        return new Power(newBase, newExposant)
    }

    toFixed(n) {
        const newBase = this.#base.toFixed(n)
        const newExposant = this.#exposant.toFixed(n)
        return new Power(newBase, newExposant)
    }

    toDict() {
        return {
            type: "Power",
            base: this.#base.toDict(),
            exposant: this.#exposant.toDict()
        }
    }
}

export { Power }
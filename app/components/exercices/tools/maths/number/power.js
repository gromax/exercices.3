import { A } from "@svgdotjs/svg.js";
import { Base } from "./base";
import Decimal from "decimal.js";

class Power extends Base {
    /** @type {Base} */
    #base;
    /** @type {Base} */
    #exposant;
    /** @type {string|null} */
    #string = null;
    /** @type {string|null} */
    #stringEN = null;

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

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        if (this.#string != null) {
            return this.#string;
        }
        let base = this.#base.priority <= this.priority? `(${String(this.#base)})`:String(this.#base);
        let exposant = this.#exposant.priority <= this.priority? `(${String(this.#exposant)})`:String(this.#exposant);
        if (exposant.startsWith('-')) {
            exposant = `(${exposant})`;
        }
        this.#string = `${base}^${exposant}`;
        return this.#string;
    }

    toStringEn() {
        if (this.#stringEN != null) {
            return this.#stringEN;
        }
        this.#stringEN = `(${this.#base.toStringEn()}) ^ (${this.#exposant.toStringEn()})`
        return this.#stringEN
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
        if (d.isInteger() && d.gte(0) && this.#base._canBeDistributed) {
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
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex() {
        let texBase = this.#base.priority <= this.priority
            ? `\\left(${this.#base.toTex()}\\right)`
            : this.#base.toTex();
        let texExposant = this.#exposant.toTex();
        return `${texBase}^{${texExposant}}`;
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

    _powSignature(signature, n) {
        if (Array.isArray(signature)) {
            signature.forEach(item => {
                this._powSignature(item, n)
            })
            return
        }
        if (signature.text != '1') {
            signature.exponent *= n
        }
        signature.scalarNum = signature.scalarNum.pow(n)
        signature.scalarDen = signature.scalarDen.pow(n)
    }

    signature() {
        const expoStr = String(this.#exposant)
        if (/^[+-]?\d+$/.test(expoStr)) {
            // expo entier
            const n = parseInt(expoStr, 10)
            const b = this.#base.signature()
            this._powSignature(b, n)
            return b
        }
        return {
            scalarNum: Decimal(1),
            scalarDen: Decimal(1),
            exponent: 1,
            text: `${this.toString()}`,
            node: this
        }
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
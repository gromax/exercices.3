import { Base } from "./base"
import { Scalar } from "./scalar"
import { Signature } from "./signature"
import Decimal from "decimal.js"

class Div extends Base {
    #left /** @type {Base} */
    #right /** @type {Base} */
    #string = null /** @type {string|null} représentation texte */
    #stringEN = null /** @type {string|null} représentation texte */

    /**
     * accesseurs
     */
    get left() {
        return this.#left;
    }

    get right() {
        return this.#right;
    }

    get priority() {
        return 2;
    }

    /**
     * constructeur
     * @param {Base} left 
     * @param {Base} right
     */
    constructor(left, right) {
        super();
        if (!(left instanceof Base)) {
            throw new Error("left invalide");
        }
        if (!(right instanceof Base)) {
            throw new Error("right invalide");
        }
        this.#left = left;
        this.#right = right;
    }

    /**
     * si un nom est précisé, renvoie true si le nœud dépend de la variable,
     * sinon renvoie la liste des variables dont dépend le noeud
     * @param {string|undefined} name 
     * @returns {boolean|Array}
     */
    isFunctionOf(name){
        if (typeof name === 'undefined') {
            return _.uniq(this.#left.isFunctionOf().concat(this.#right.isFunctionOf())).sort()
        }
        return this.#left.isFunctionOf(name) || this.#right.isFunctionOf(name)
    }

    substituteVariable(varName, value) {
        const newLeft = this.#left.substituteVariable(varName, value)
        const newRight = this.#right.substituteVariable(varName, value)
        if (newLeft === this.#left && newRight === this.#right) {
            // pas de changement
            return this
        }
        return new Div(newLeft, newRight)
    }

    substituteVariables(values) {
        const leftSub = this.#left.substituteVariables(values)
        const rightSub = this.#right.substituteVariables(values)
        if (leftSub === this.#left && rightSub === this.#right) {
            // pas de changement
            return this
        }
        return new Div(leftSub, rightSub);
    }

    toFixed(n) {
        const newLeft = this.#left.toFixed(n)
        const newRight = this.#right.toFixed(n)
        return new Div(newLeft, newRight)
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        if (this.#string != null) {
            return this.#string
        }
        const left = this.#left.priority <= this.priority
            ? `(${String(this.#left)})`
            : String(this.#left)
        const right = this.#right.priority <= this.priority
            ? `(${String(this.#right)})`
            : String(this.#right)
        this.#string = `${left} / ${right}`
        return this.#string;
    }

    toStringEn() {
        if (this.#stringEN == null) {
            this.#stringEN = `(${this.#left.toStringEn()}) / (${this.#right.toStringEn()})`
        }
        return this.#stringEN
    }

    isExpanded() {
        if (!this.#left.isExpanded() || !this.#right.isExpanded()) {
            return false;
        }
        return true;
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex() {
        let texLeft = this.#left.toTex();
        let texRight = this.#right.toTex();
        return `\\frac{${texLeft}}{${texRight}}`;
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values) {
        let left = this.#left.toDecimal(values);
        let right = this.#right.toDecimal(values);
        return left.dividedBy(right);
    }

    signature() {
        return this.#left.signature().div(this.#right.signature())
    }

    opposite() {
        if (typeof this.#left.opposite === 'function') {
            return new Div(this.#left.opposite(), this.#right);
        }
        if (typeof this.#right.opposite === 'function') {
            return new Div(this.#left, this.#right.opposite());
        }
        return new Mult(Scalar.MINUS_ONE, this);
    }

    toDict() {
        return {
            type: "Div",
            left: this.#left.toDict(),
            right: this.#right.toDict()
        }
    }
}

export { Div }
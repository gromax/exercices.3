import { Base } from "./base";
import Decimal from "decimal.js";

class Function extends Base {
    /** @type {Base} */
    #child;
    /** @type {string} */
    #name;
    /** @type {string|null} représentation texte */
    #string = null;

    static NAMES = ['sqrt', '(-)', '(+)', 'cos', 'sin', 'ln', 'exp', 'inverse'];

    /**
     * constructeur
     * @param {string} name 
     * @param {Base} child 
     */
    constructor(name, child) {
        super();
        if (!Function.isFunction(name)) {
            throw new Error(`${name} n'est pas une fonction reconnue.`);
        }
        this.#name = name;
        this.#child = child;
    }

    /**
     * tente la fabrication d'un Function à partir d'une chaine
     * @param {string} chaine 
     * @return {null, Function}
     */
    static fromString(chaine) {
        if (!Function.isFunction(chaine)) {
            return null;
        }
        return new Function(chaine);
    }

    /**
     * Teste si la chaîne est bien d'une fonction
     * @param {string} chaine 
     * @returns {boolean}
     */
    static isFunction(chaine) {
        return (Function.NAMES.indexOf(chaine)>=0);
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        if (this.#string != null) {
            return this.#string;
        }
        if (this.#name == '(+)') {
            this.#string = String(this.#child);
        } else if (this.#name == '(-)') {
            let child = this.#child.priority <= this.priority? `(${String(this.#child)})`:` ${String(this.#child)}`;
            this.#string = `-${child}`;
        } else {
            let child = this.#child.priority <= this.priority? `(${String(this.#child)})`:` ${String(this.#child)}`;
            this.#string = `${this.#name}${child}`;
        }
        return this.#string;
    }

    get name() {
        return this.#name;
    }

    get priority() {
        return 4;
    }

    get child() {
        return this.#child;
    }

    /**
     * si un nom est précisé, renvoie true si le nœud dépend de la variable,
     * sinon renvoie la liste des variables dont dépend le noeud
     * @param {string|undefined} name 
     * @returns {boolean|Array}
     */
    isFunctionOf(name){
        if (typeof name == 'undefined') {
            return this.#child.isFunctionOf();
        }
        return this.#child.isFunctionOf(name);
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    tex() {
        if (this.#name == 'inverse') {
            return `\\frac{1}{${this.#child.tex()}}`;
        }
        if (this.#name == 'sqrt') {
            return `\\sqrt{${this.#child.tex()}}`;
        }
        if (this.#name == '(+)') {
            return this.#child.tex();
        }

        let texChild = this.#child.priority <= this.priority? `\\left(${this.#child.tex()}\\right)`:` ${this.#child.tex()}`;
        if (this.#name == '(-)') {
            return `- ${texChild}`;
        }
        return `\\${this.#name}${texChild}`;
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values) {
        let child = this.#child.toDecimal(values);
        switch (this.#name) {
            case 'sqrt': return Decimal.sqrt(child);
            case 'ln': return Decimal.ln(child);
            case 'exp': return Decimal.exp(child);
            case 'cos': return Decimal.cos(child);
            case 'sin': return Decimal.sin(child);
            case '(-)': return child.negated();
            case '(+)': return child;
            default: return Decimal.NAN;
        }
    }

}

export { Function };
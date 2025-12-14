import { Base } from "./base";
import Decimal from "decimal.js";
import { Scalar } from "./scalar";

class Function extends Base {
    /** @type {Base} */
    #child;
    /** @type {string} */
    #name;
    /** @type {string|null} représentation texte */
    #string = null;
    /** @type {string|null} représentation texte */
    #stringEN = null;

    static NAMES = ['sqrt', '(-)', '(+)', 'cos', 'sin', 'ln', 'log', 'exp', 'inverse']
    static EN_NAMES = {
        'ln': 'log',
        'log': 'log10',
    }

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
     * exécute une fonction numérique
     * @param {string} name 
     * @param {Decimal} value 
     * @returns {Decimal}
     */
    static calc(name, value) {
        switch (name) {
            case 'sqrt': return Decimal.sqrt(value);
            case 'ln': return Decimal.ln(value);
            case 'log': return Decimal.log(value);
            case 'exp': return Decimal.exp(value);
            case 'cos': return Decimal.cos(value);
            case 'sin': return Decimal.sin(value);
            case '(-)': return value.negated();
            case '(+)': return value;
            default: return new Decimal(NaN) ;
        }
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
            const child = this.#child.priority <= this.priority
                ? `(${String(this.#child)})`
                : ` ${String(this.#child)}`;
            this.#string = `-${child}`;
        } else if (this.#name == 'inverse') {
            this.#string = `1/(${String(this.#child)})`;
        } else {
            this.#string = `${this.#name}(${String(this.#child)})`;
        }
        return this.#string;
    }

    toStringEn() {
        if (this.#stringEN != null) {
            return this.#stringEN
        }
        if (typeof Function.EN_NAMES[this.#name] === 'undefined') {
            this.#stringEN = this.toString()
            return this.#stringEN
        }
        const enName = Function.EN_NAMES[this.#name]
        this.#stringEN = `${enName}(${this.#child.toStringEn()})`
        return this.#stringEN
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

    isExpanded() {
        return this.#child.isExpanded();
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
        return this.#child.isFunctionOf(name)
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex() {
        if (this.#name == 'inverse') {
            return `\\frac{1}{${this.#child.toTex()}}`;
        }
        if (this.#name == 'sqrt') {
            return `\\sqrt{${this.#child.toTex()}}`;
        }
        if (this.#name == '(+)') {
            return this.#child.toTex();
        }
        if (this.#name == '(-)') {
            if (this.#child.priority < this.priority) {
                return `- \\left(${this.#child.toTex()}\\right)`;
            }
            return `- ${this.#child.toTex()}`;
        }
        return `\\${this.#name}\\left(${this.#child.toTex()}\\right)`;
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values) {
        let child = this.#child.toDecimal(values);
        return Function.calc(this.#name, child)
    }

    signature() {
        return [this.toString()];
    }

    isExponential() {
        if (this.#name === 'exp') {
            return this.#child;
        }
        return false;
    }

    simplify() {
        const childSim = this.#child.simplify();
        if (this.#name === '(+)') {
            return childSim;
        }
        if (this.#name === '(-)') {
            if (typeof childSim.opposite === 'function') {
                return childSim.opposite();
            }
        }
        if (typeof childSim.isExponential === 'function' && this.#name == 'ln') {
            const exponent = childSim.isExponential();
            if (exponent !== false) {
                return exponent;
            }
        }
        if (childSim.isZero()) {
            if (this.#name === '(+)' || this.#name === '(-)' || this.#name === 'sin' || this.#name === 'sqrt') {
                return childSim;
            }
            if (this.#name === 'exp' || this.#name === 'cos') {
                return Scalar.ONE;
            }
            if (this.#name === 'ln' || this.#name === 'log') {
                return Scalar.NAN;
            }
        }

        if (childSim === this.#child) {
            return this;
        }
        return new Function(this.#name, childSim);
    }

    opposite() {
        if (this.#name === '(+)') {
            return new Function('(-)', this.#child);
        }
        if (this.#name === '(-)') {
            return this.#child;
        }
        return new Function('(-)', this);
    }

    substituteVariable(varName, value) {
        const newChild = this.#child.substituteVariable(varName, value)
        if (newChild === this.#child) {
            return this
        }
        return new Function(this.#name, newChild)
    }

    substituteVariables(values) {
        const newChild = this.#child.substituteVariables(values)
        if (newChild === this.#child) {
            return this
        }
        return new Function(this.#name, newChild)
    }

    Decimalize() {
        const newChild = this.#child.Decimalize()
        if (newChild._isNumber) {
            const d = newChild.toDecimal()
            return new Scalar( Function.calc(this.#name, d) )
        }
        return new Function(this.#name, newChild)
    }

    toFixed(n) {
        const newChild = this.#child.toFixed(n)
        return new Function(this.#name, newChild)
    }
}

export { Function };
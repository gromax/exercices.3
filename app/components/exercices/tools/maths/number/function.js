import { Base } from "./base"
import Decimal from "decimal.js"

class Function extends Base {
    /** @type {Base} */
    #child;
    /** @type {string} */
    #name;
    /** @type {string|null} représentation texte */
    #string = null;
    /** @type {string|null} représentation texte */
    #stringEN = null;

    static NAMES = ['sqrt', '(-)', '(+)', 'cos', 'sin', 'ln', 'log', 'exp', 'inverse', 'sign']
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
            case 'sqrt': return Decimal.sqrt(value)
            case 'ln': return Decimal.ln(value)
            case 'log': return Decimal.log(value)
            case 'exp': return Decimal.exp(value)
            case 'cos': return Decimal.cos(value)
            case 'sin': return Decimal.sin(value)
            case '(-)': return value.negated()
            case '(+)': return value
            case 'inverse': return new Decimal(1).dividedBy(value)
            case 'sign': return new Decimal(value.isZero() ? 0 : (value.isPositive() ? 1 : -1))
            default: return new Decimal(NaN)
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

    get startsWithMinus() {
        return this.#name === '(-)';
    }

    get child() {
        return this.#child;
    }

    get scalarFactor() {
        if (this.#name === '(+)') {
            return this.#child.scalarFactor
        }
        if (this.#name === '(-)') {
            let childFactor = this.#child.scalarFactor
            if (childFactor === 1) {
                childFactor === Scalar.ONE
            }
            return childFactor.opposite()
        }
        return 1
    }

    get withoutScalarFactor() {
        if (this.#name === '(+)' || this.#name === '(-)') {
            return this.#child.withoutScalarFactor
        }
        return this
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
        if (this.#name == 'sign') {
            return `\\text{sign}\\left(${this.#child.toTex()}\\right)`;
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
        if (this.#name === '(+)' || this.#name === '(-)') {
            return this.#child.signature()
        }
        if (this.#name === 'inverse') {
            return this.#child.signature().power(-1)
        }
        return super.signature()
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

    toFixed(n) {
        const newChild = this.#child.toFixed(n)
        return new Function(this.#name, newChild)
    }

    toDict() {
        return {
            type: "Function",
            name: this.#name,
            child: this.#child.toDict()
        }
    }
}

export { Function };
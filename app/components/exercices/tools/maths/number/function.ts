import { Base } from "./base"
import { Scalar } from "./scalar"
import Decimal from "decimal.js"
import { Signature } from "./signature"

class Function extends Base {
    /** @type {Base} */
    private _child:Base
    /** @type {string} */
    private _name:string
    /** @type {string|null} représentation texte */
    private _string: string | null = null
    /** @type {string|null} représentation texte */
    private _stringEN: string | null = null

    static readonly NAMES = ['sqrt', '(-)', '(+)', 'cos', 'sin', 'ln', 'log', 'exp', 'inverse', 'sign']
    static readonly EN_NAMES = {
        'ln': 'log',
        'log': 'log10',
    }

    /**
     * constructeur
     * @param {string} name 
     * @param {Base} child 
     */
    constructor(name:string, child:Base) {
        super()
        if (!Function.isFunction(name)) {
            throw new Error(`${name} n'est pas une fonction reconnue.`);
        }
        this._name = name
        this._child = child
    }

    /**
     * Teste si la chaîne est bien d'une fonction
     * @param {string} chaine 
     * @returns {boolean}
     */
    static isFunction(chaine:string):boolean {
        return (Function.NAMES.indexOf(chaine)>=0);
    }

    /**
     * exécute une fonction numérique
     * @param {string} name 
     * @param {Decimal} value 
     * @returns {Decimal}
     */
    static calc(name:string, value:Decimal):Decimal {
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
    toString():string {
        if (this._string != null) {
            return this._string
        }
        if (this._name == '(+)') {
            this._string = String(this._child)
        } else if (this._name == '(-)') {
            const child = this._child.priority <= this.priority
                ? `(${String(this._child)})`
                : ` ${String(this._child)}`
            this._string = `-${child}`;
        } else if (this._name == 'inverse') {
            this._string = `1/(${String(this._child)})`
        } else {
            this._string = `${this._name}(${String(this._child)})`
        }
        return this._string
    }

    toStringEn():string {
        if (this._stringEN != null) {
            return this._stringEN
        }
        if (typeof Function.EN_NAMES[this._name] === 'undefined') {
            this._stringEN = this.toString()
            return this._stringEN
        }
        const enName = Function.EN_NAMES[this._name]
        this._stringEN = `${enName}(${this._child.toStringEn()})`
        return this._stringEN
    }

    get name():string {
        return this._name
    }

    get priority():number {
        return 4
    }

    get startsWithMinus():boolean {
        return this._name === '(-)'
    }

    get child():Base {
        return this._child
    }

    get scalarFactor():Scalar {
        if (this._name === '(+)') {
            return this._child.scalarFactor
        }
        if (this._name === '(-)') {
            return this._child.scalarFactor.opposite()
        }
        return Scalar.ONE
    }

    get withoutScalarFactor():Base {
        if (this._name === '(+)' || this._name === '(-)') {
            return this._child.withoutScalarFactor
        }
        return this
    }

    /**
     * si un nom est précisé, renvoie true si le nœud dépend de la variable,
     * sinon renvoie la liste des variables dont dépend le noeud
     * @param {string|undefined} name 
     * @returns {boolean|Array}
     */
    isFunctionOf(name:string|undefined):boolean|Array<string> {
        if (typeof name === 'undefined') {
            return this._child.isFunctionOf(undefined);
        }
        return this._child.isFunctionOf(name)
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex():string {
        if (this._name == 'inverse') {
            return `\\frac{1}{${this._child.toTex()}}`;
        }
        if (this._name == 'sqrt') {
            return `\\sqrt{${this._child.toTex()}}`;
        }
        if (this._name == '(+)') {
            return this._child.toTex();
        }
        if (this._name == '(-)') {
            if (this._child.priority < this.priority) {
                return `- \\left(${this._child.toTex()}\\right)`;
            }
            return `- ${this._child.toTex()}`;
        }
        if (this._name == 'sign') {
            return `\\text{sign}\\left(${this._child.toTex()}\\right)`;
        }
        return `\\${this._name}\\left(${this._child.toTex()}\\right)`;
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values:Record<string, Decimal|string|number>|undefined):Decimal {
        let child = this._child.toDecimal(values);
        return Function.calc(this._name, child)
    }

    signature():Signature {
        if (this._name === '(+)' || this._name === '(-)') {
            return this._child.signature()
        }
        if (this._name === 'inverse') {
            return this._child.signature().power(-1)
        }
        return super.signature()
    }

    opposite():Base {
        if (this._name === '(+)') {
            return new Function('(-)', this._child);
        }
        if (this._name === '(-)') {
            return this._child;
        }
        return new Function('(-)', this);
    }

    substituteVariable(varName:string, value:Base|string|Decimal|number):Base {
        const newChild = this._child.substituteVariable(varName, value)
        if (newChild === this._child) {
            return this
        }
        return new Function(this._name, newChild)
    }

    substituteVariables(substitutions:Record<string, Base|string|Decimal|number>):Base {
        const newChild = this._child.substituteVariables(substitutions)
        if (newChild === this._child) {
            return this
        }
        return new Function(this._name, newChild)
    }

    toFixed(n:number):Base {
        const newChild = this._child.toFixed(n)
        return new Function(this._name, newChild)
    }

    toDict():object {
        return {
            type: "Function",
            name: this._name,
            child: this._child.toDict()
        }
    }
}

export { Function };
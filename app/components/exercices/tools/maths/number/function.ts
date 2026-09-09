import { Base } from "./base"
import { Scalar } from "./scalar"
import { Symbol } from "./symbol"
import { Collection } from "./collection"
import { AddMinus } from "./add"
import { Mult } from "./mult"
import { Div } from "./div"
import { Power } from "./power"
import Decimal from "decimal.js"
import { Signature } from "./signature"
import { NestedString } from '@types'
class Function extends Base {
    /** @type {Base} */
    private _child:Base

    /** @type {string} */
    private _name:string

    /** @type {string|null} représentation texte */
    private _string: string | null = null

    /** @type {string|null} représentation texte */
    private _stringEN: string | null = null

    /** @type {Base|null} sert à stocker l'expression de la dérivée dans le cas d'un diff */
    private _derForDiff: Base | null = null

    static readonly NAMES = [
        'sqrt', '(-)', '(+)', 'cos', 'sin', 'tan', 'atan', 'ln', 'log', 'exp', 'inverse', 'sign', 'mod', 'div', 'diff'
    ]

    static readonly EN_NAMES = {
        'ln': 'log',
        'log': 'log10',
    }

    static readonly ARITY2 = ['mod', 'div', 'diff']

    /**
     * constructeur d'une fonction mathématique
     * @param {string} name 
     * @param {Base} child 
     */
    constructor(name:string, child:Base) {
        super()
        if (!Function.isFunction(name)) {
            throw new Error(`${name} n'est pas une fonction reconnue.`)
        }
        this._name = name
        const childSize = child instanceof Collection ? child.children.length : 1
        if (childSize != this.arity) {
            throw new Error(`La fonction ${name} attend ${this.arity} argument(s), mais en a reçu ${childSize}.`)
        }

        // dans le cas diff, il faut un symbole dans le second argument
        if (this._name == 'diff' && child instanceof Collection && childSize == 2) {
            const secondArg = child.children[1]
            if (!(secondArg instanceof Symbol)) {
                throw new Error(`Le second argument de diff doit être un symbole.`)
            }
        }

        if (child instanceof Collection && childSize == 1) {
            child = child.children[0]
        }
        
        this._child = child
    }

    /**
     * renvoie l'arité de la fonction
     * @returns {number}
     */
    get arity():number {
        return Function.ARITY2.indexOf(this._name) >= 0 ? 2 : 1
    }

    /**
     * Teste si la chaîne est bien d'une fonction
     * @param {string} chaine 
     * @returns {boolean}
     */
    static isFunction(chaine:string):boolean {
        return (Function.NAMES.indexOf(chaine)>=0)
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
            case 'tan': return Decimal.tan(value)
            case 'atan': return Decimal.atan(value)
            case '(-)': return value.negated()
            case '(+)': return value
            case 'inverse': return new Decimal(1).dividedBy(value)
            case 'sign': return new Decimal(value.isZero() ? 0 : (value.isPositive() ? 1 : -1))
            default: return new Decimal(NaN)
        }
    }

    /**
     * exécute une fonction numérique pour les opérateurs à deux arguments
     * @param {string} name 
     * @param {Decimal} value1
     * @param {Decimal} value2
     * @returns {Decimal}
     */
    static calc2(name:string, value1:Decimal, value2:Decimal):Decimal {
        switch (name) {
            case 'mod': return value1.modulo(value2)
            case 'div': return value1.minus(value1.modulo(value2)).dividedBy(value2)
            default: return new Decimal(NaN)
        }
    }

    /**
     * renvoie l'expression de la dérivée si c'est un diff
     * @returns {Base}
     */
    private  _getDerForDiff(): Base {
        if (this._name !== 'diff') {
            throw new Error(`Derivative not available for non-diff function`)
        }
        if (this._derForDiff === null) {
            const [expression, variable] = (this._child as Collection).children
            this._derForDiff = expression.derivate(variable.toString())
        }
        return this._derForDiff as Base
    }

    subVariables(): NestedString {
        if (this._name === 'diff') {
            return this._getDerForDiff().subVariables()
        }
        return this._child.subVariables()
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
            this._string = `-${child}`
        } else if (this._name == 'inverse') {
            this._string = `1/(${String(this._child)})`
        } else if (this._child instanceof Collection) {
            this._string = `${this._name}(${String(this._child)})`
        } else {
            this._string = `${this._name}(${String(this._child)})`
        }
        return this._string
    }

    toStringEn():string {
        if (this._stringEN != null) {
            return this._stringEN
        }
        if (typeof Function.EN_NAMES[this._name] !== 'undefined') {
            const enName = Function.EN_NAMES[this._name]
            this._stringEN = `${enName}(${this._child.toStringEn()})`
            return this._stringEN
        }
        if (this._name == '(+)') {
            this._stringEN = this._child.toStringEn()
            return this._stringEN
        }
        if (this._name == '(-)') {
            const child = this._child.priority <= this.priority
                ? `(${this._child.toStringEn()})`
                : ` ${this._child.toStringEn()}`
            this._stringEN = `-${child}`
            return this._stringEN
        }
        if (this._name == 'inverse') {
            this._stringEN = `1/(${this._child.toStringEn()})`
            return this._stringEN
        }
        this._stringEN = `${this._name}(${this._child.toStringEn()})`
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
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex():string {
        if (this._name == 'inverse') {
            return `\\frac{1}{${this._child.toTex()}}`
        }
        if (this._name == 'sqrt') {
            return `\\sqrt{${this._child.toTex()}}`
        }
        if (this._name == '(+)') {
            return this._child.toTex()
        }
        if (this._name == '(-)') {
            if (this._child.priority < this.priority) {
                return `- \\left(${this._child.toTex()}\\right)`
            }
            return `- ${this._child.toTex()}`
        }
        if (this._name == 'sign') {
            return `\\text{sign}\\left(${this._child.toTex()}\\right)`
        }
        if (this._name == 'diff') {
            const [expression, variable] = (this._child as Collection).children
            return `\\frac{d}{d${variable.toTex()}}\\left(${expression.toTex()}\\right)`
        }
        if (this._name == 'atan') {
            return `\\arctan\\left(${this._child.toTex()}\\right)`
        }
        return `\\${this._name}\\left(${this._child.toTex()}\\right)`
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values:Record<string, Decimal|string|number>|undefined):Decimal {
        if (this.arity == 1) {
            let child = this._child.toDecimal(values)
            return Function.calc(this._name, child)
        } else if (this._name == "diff") {
            return this._getDerForDiff().toDecimal(values)
        } else if (this.arity == 2) {
            const [left,right] = (this._child as Collection).children
            let leftDec = left.toDecimal(values)
            let rightDec = right.toDecimal(values)
            return Function.calc2(this._name, leftDec, rightDec)
        }
        throw new Error(`Unsupported arity: ${this.arity}`)
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
            return new Function('(-)', this._child)
        }
        if (this._name === '(-)') {
            return this._child
        }
        return new Function('(-)', this)
    }

    substituteVariable(varName:string, value:Base|string|Decimal|number):Base {
        if (this._name == "diff") {
            return this._getDerForDiff().substituteVariable(varName, value)
        }
        const newChild = this._child.substituteVariable(varName, value)
        if (newChild === this._child) {
            return this
        }
        return new Function(this._name, newChild)
    }

    substituteVariables(substitutions:Record<string, Base|string|Decimal|number>):Base {
        if (this._name == "diff") {
            return this._getDerForDiff().substituteVariables(substitutions)
        }
        const newChild = this._child.substituteVariables(substitutions)
        if (newChild === this._child) {
            return this
        }
        return new Function(this._name, newChild)
    }

    toFixed(n:number):Base {
        if (this._name == "diff") {
            return this._getDerForDiff().toFixed(n)
        }
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

    /**
     * renvoie la dérivée
     * @param {string} varName 
     * @returns {Base}
     */
    derivate(varName:string):Base {
        // implémentation spécifique pour Function
        if (!this.variables.includes(varName)) {
            return Scalar.ZERO
        }
        if (this._name == 'diff') {
            const [childExpression, variable] = (this._child as Collection).children
            const subVarName = variable.toString()
            return childExpression.derivate(subVarName).derivate(varName)
        }
        if (this.arity > 1) {
            throw new Error(`Dérivée non implémentée pour la fonction ${this._name}`)
        }
        const child = this._child as Base
        const childPrime = child.derivate(varName)
        if (this._name === '(+)') {
            return childPrime
        }
        if (this._name === '(-)') {
            return new Function('(-)', childPrime)
        }
        if (this._name === 'sqrt') {
            const numerator = childPrime
            const denominator = Mult.mult(new Scalar(2), this)
            return Div.div(numerator, denominator)
        }
        if (this._name === 'ln') {
            const numerator = childPrime
            const denominator = child
            return Div.div(numerator, denominator)
        }
        if (this._name === 'log') {
            const numerator = childPrime
            const denominator = Mult.mult(child, new Function('ln', new Scalar(10)))
            return Div.div(numerator, denominator)
        }
        if (this._name === 'exp') {
            return Mult.mult(childPrime, this)
        }
        if (this._name === 'inverse') {
            const numerator = Mult.mult(Scalar.MINUS_ONE, childPrime)
            const denominator = new Power(child, new Scalar(2))
            return Div.div(numerator, denominator)
        }
        if (this._name === 'sin') {
            return Mult.mult(childPrime, new Function('cos', child))
        }
        if (this._name === 'cos') {
            const minusSin = new Function('(-)', new Function('sin', child))
            return Mult.mult(childPrime, minusSin)
        }
        if (this._name === 'tan') {
            const cos2 = Power.make(new Function('cos', child), Scalar.TWO)
            return Div.div(childPrime, cos2)
        }
        if (this._name === 'atan') {
            const numerator = childPrime
            const denominator = AddMinus.add(Scalar.ONE, Power.make(child, Scalar.TWO))
            return Div.div(numerator, denominator)
        }
        throw new Error(`Dérivée non implémentée pour la fonction ${this._name}`)
    }
}

export { Function }
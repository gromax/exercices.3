import { Base } from "./base"
import { Signature } from "./signature"
import Decimal from "decimal.js"

/** Calcul du plus grand commun diviseur de deux entiers a et b
 * Valable même pour a et b décimaux
 * @param {Decimal} a
 * @param {Decimal} b
 * @returns {Decimal}
 */
function gcd(a:Decimal, b:Decimal):Decimal {
    if (b.isZero()) {
        return a
    }
    if (a.isZero()) {
        return b
    }
    a = a.abs()
    b = b.abs()
    let r = a.mod(b)
    while (!r.isZero()) {
        a = b
        b = r
        r = a.mod(b)
    }
    return new Decimal(b)
}

class Scalar extends Base {
    static REGEX = new RegExp('\\d+[.,]?\\d*(E-?\\d+)?%?', 'i')
    /** @type {Scalar} */
    static ONE: Scalar
    /** @type {Scalar} */
    static ZERO: Scalar
    /** @type {Scalar} */
    static MINUS_ONE: Scalar
    /** @type {Scalar} */
    static NAN: Scalar

    /** @type{string} */
    private _chaine = ""
    /** @type{Decimal} */
    private _value = new Decimal(NaN)
    /** @type{Decimal|null} */
    private _denominator: Decimal | null = null

    /**
     * tente la fabrication d'un Scalar à partir d'une chaine
     * @param {string} chaine 
     * @return {null, Scalar}
     */
    static fromString(chaine:string):Scalar|null {
        if (!Scalar.REGEX.test(chaine)) {
            return null
        }
        return new Scalar(chaine)
    }

    static div(numerator:Scalar|number|string, denominator:Scalar|number|string): Scalar {
        if (!(numerator instanceof Scalar)) {
            numerator = new Scalar(numerator)
        }
        return numerator.div(denominator)
    }

    static mult(factor1:Scalar|number|string, factor2:Scalar|number|string): Scalar {
        if (!(factor1 instanceof Scalar)) {
            factor1 = new Scalar(factor1)
        }
        return factor1.mult(factor2)
    }

    static plus(addend1:Scalar|number|string, addend2:Scalar|number|string): Scalar {
        if (!(addend1 instanceof Scalar)) {
            addend1 = new Scalar(addend1)
        }
        return addend1.plus(addend2)
    }

    static minus(minuend:Scalar|number|string, subtrahend:Scalar|number|string): Scalar {
        if (!(minuend instanceof Scalar)) {
            minuend = new Scalar(minuend)
        }
        return minuend.minus(subtrahend)
    }

    /**
     * teste si la chaîne est bien d'un scalaire
     * @param {string} chaine 
     * @returns {boolean}
     */
    static isScalar(chaine:string):boolean {
        return Scalar.REGEX.test(chaine)
    }

    /**
     * constructeur
     * @param {string|Decimal|number} entree 
     * @param {Decimal|null} denominator
     */
    constructor(entree: string|Decimal|number, denominator:Decimal|null = null) {
        super()
        if (typeof entree == 'string') {
            this._makeFromString(entree)
        } else if (typeof entree == 'number') {
            this._makeFromNumber(entree)
        } else if (entree instanceof Decimal) {
            this._makeFromDecimal(entree)
        } else {
            throw new Error(`entree = ${entree} invalide pour un Scalar`)
        }
        // si un dennominateur est donné, on est dans un cas où on veut simplifier
        if (!(denominator instanceof Decimal)) {
            return
        }
        // le signe sera toujours porté par le numérateur
        if (denominator.isPositive()) {
            this._denominator = denominator
        } else {
            this._value = this._value.negated()
            this._denominator = denominator.negated()
        }
        const gcdValue = gcd(this._value, this._denominator)
        this._value = this._value.div(gcdValue)
        this._denominator = this._denominator.div(gcdValue)
        // le dénominateur ne sera jamais de 1
        if (this._denominator.equals(1)) {
            this._denominator = null
        } else if (this._denominator.equals(0)) {
            this._value = new Decimal(NaN)
            this._denominator = null
        }
        this._chaine = this.toString()
    }

    get isNumber():boolean {
        return true
    }

    get startsWithMinus():boolean {
        return this._value.isNegative()
    }

    private _getDenominator() {
        return this._denominator || new Decimal(1)
    }

    /**
     * auxiliaire constructureur pour une chaine
     * @param {string} chaine 
     */
    private _makeFromString(chaine:string):void {
        if (!Scalar.isScalar(chaine)) {
            throw new Error(`entree = ${chaine} invalide pour un Scalar`)
        }
        chaine = chaine.trim()
        let percent = false
        this._chaine = chaine
        chaine = chaine.replace(',', '.')
        let i = chaine.indexOf('%')
        if (i >= 0) {
            percent = true
            chaine = chaine.substring(0,i).trim()
        }
        this._value = new Decimal(chaine)
        if (percent) {
            this._value = this._value.div(100)
        }
    }

    /**
     * auxiliaire constructeur pour un Number
     * @param {number}
     */
    private _makeFromNumber(n:number):void {
        this._chaine = String(n)
        this._value = new Decimal(n)
    }

    /**
     * auxiliaire constructeur pour un Decimal
     * @param {Decimal} d
     */
    private _makeFromDecimal(d:Decimal):void {
        this._chaine = d.toString()
        this._value = d
    }

    /**
     * trantypage
     * @return {string}
     */
    toString():string {
        const numerator = this._value.toString().replace('.', ',')
        if (this._denominator === null) {
            return numerator;
        }
        const denominator = this._denominator.toString().replace('.', ',')
        return `${numerator} / ${denominator}`
    }

    toStringEn():string {
        const numerator = this._value.toString()
        if (this._denominator === null) {
            return numerator;
        }
        const denominator = this._denominator.toString()
        return `${numerator} / ${denominator}`
    }

    get priority():number {
        return 10
    }

    get scalarFactor():Scalar {
        return this
    }

    get withoutScalarFactor():Scalar {
        return Scalar.ONE
    }

    isInteger() {
        return this._value.isInteger() && (this._denominator === null)
    }

    get floatValue():number {
        const numValue = this._value.toNumber()
        if (this._denominator === null) {
            return numValue
        }
        return numValue / this._denominator.toNumber()
    }

    plus(value: Scalar|number|string): Scalar {
        if (!(value instanceof Scalar)) {
            // si value n'est pas un Scalar, on tente de le convertir
            // si la valeur n'est pas satisfaisante, le contructeurr lève une erreur
            value = new Scalar(value)
        }
        if (this._denominator === null && value._denominator === null) {
            // cas simple
            return new Scalar(this._value.add(value._value))
        }
        // cas avec dénominateurs
        const deno = this._getDenominator()
        const valDeno = value._getDenominator()
        const numerator = this._value.mul(valDeno).add(value._value.mul(deno))
        const denominator = deno.mul(valDeno)
        return new Scalar(numerator, denominator)
    }

    minus(value: Scalar|number|string): Scalar {
        if (!(value instanceof Scalar)) {
            // si value n'est pas un Scalar, on tente de le convertir
            // si la valeur n'est pas satisfaisante, le contructeurr lève une erreur
            value = new Scalar(value)
        }
        return this.plus(value.opposite())
    }

    pow(exponent: Scalar|number|string): Scalar {
        const _expo = exponent instanceof Scalar
            ? exponent.toDecimal(undefined)
            : new Decimal(exponent)
        const numerator = this._value.pow(_expo)
        const den = this._denominator !== null ? this._denominator.pow(_expo) : null
        return new Scalar(numerator, den)
    }

    inverse():Scalar {
        if (this.isNaN() || this._value.isZero()) {
            return Scalar.NAN
        }
        const deno = this._getDenominator()
        return new Scalar(deno, this._value)
    }

    mult(value: Scalar|number|string):Scalar {
        if (!(value instanceof Scalar)) {
            // si value n'est pas un Scalar, on tente de le convertir
            // si la valeur n'est pas satisfaisante, le contructeurr lève une erreur
            value = new Scalar(value)
        }
        const newNumerator = this._value.mul(value._value)
        if (this._denominator === null && value._denominator === null) {
            // cas simple
            return new Scalar(newNumerator)
        }
        // cas avec dénominateurs
        const deno = this._getDenominator()
        const valDeno = value._getDenominator()
        const newDenominator = deno.mul(valDeno)
        return new Scalar(newNumerator, newDenominator)
    }

    div(value: Scalar|number|string):Scalar {
        if (!(value instanceof Scalar)) {
            // si value n'est pas un Scalar, on tente de le convertir
            // si la valeur n'est pas satisfaisante, le contructeurr lève une erreur
            value = new Scalar(value)
        }
        if (this._denominator === null && value._denominator === null) {
            // cas simple
            return new Scalar(this._value, value._value)
        }
        // cas avec dénominateurs
        const newNumerator = this._value.mul(value._getDenominator())
        const newDenominator = this._getDenominator().mul(value._value)
        return new Scalar(newNumerator, newDenominator)
    }

    /**
     * Renvoie vrai si == 1
     * @returns { boolean }
     */
    isOne(): boolean {
        return this._value.equals(1) && (this._denominator === null)
    }

    /**
     * Renvoie vrai si == 1
     * @returns { boolean }
     */
    isZero(): boolean {
        return this._value.equals(0)
    }

    /**
     * renvoie true si c'est un NaN
     * @returns {boolean}
     */
    isNaN():boolean {
        return this._value.isNaN()
    }

    /**
     * renvoie -this
     * @returns {Scalar}
     */
    opposite(): Scalar {
        if (this.isNaN()) {
            return this
        }
        return new Scalar(this._value.negated(), this._denominator)
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex():string {
        const numerator = this._value.toString().replace('.', ',')
        if (this._denominator === null) {
            return numerator;
        }
        const denominator = this._denominator.toString().replace('.', ',')
        return `\\frac{${numerator}}{${denominator}}`
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values:Record<string, Decimal|string|number>|undefined):Decimal {
        const numerator = this._value
        if (this._denominator === null) {
            return numerator
        }
        return numerator.div(this._denominator)
    }

    signature():Signature {
        return new Signature()
    }

    toFixed(n:number):Base {
        return new Scalar(this.toDecimal(undefined).toFixed(n))
    }

    toDict():object {
        if (this._denominator === null) {
            return {
                type: "Scalar",
                chaine: this._chaine,
                decimal: this.toDecimal(undefined),
                number: this._value.toNumber()
            }
        }
        return {
            type: "Scalar",
            chaine: this._chaine,
            decimal: this.toDecimal(undefined),
            numerator: this._value.toNumber(),
            denominator: this._denominator.toNumber()
        }
    }

    isPositive() {
        return this._value.isPositive()
    }
}

/** @type {Scalar} */
Scalar.ONE = new Scalar(1)

/** @type {Scalar} */
Scalar.ZERO = new Scalar(0)

/** @type {Scalar} */
Scalar.MINUS_ONE = Scalar.ONE.opposite()

/** @type {Scalar} */
Scalar.NAN = new Scalar(NaN)

export { Scalar }
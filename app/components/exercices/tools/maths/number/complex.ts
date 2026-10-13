import { Base } from "./base"
import { Scalar } from "./scalar"
import { Signature } from "../misc/signature"
import Decimal from "decimal.js"
import { ComplexDecimal } from "../misc/complexdecimal"
import { NestedString } from '@types'

class Complex extends Base {
    /** @type {Complex} */
    static I: Complex

    /** @type {Complex} */
    static MINUS_I: Complex


    /** @type{Scalar} */
    private _real:Scalar

    /** @type{Scalar} */
    private _imag:Scalar

    static plus(a: Complex|Scalar, b:Complex|Scalar): Complex|Scalar {
        if (a instanceof Complex) {
            return a.plus(b)
        }
        if (b instanceof Complex) {
            return b.plus(a)
        }
        return a.plus(b)
    }

    static minus(a: Complex|Scalar, b:Complex|Scalar): Complex|Scalar {
        if (a instanceof Complex) {
            return a.minus(b)
        }
        if (b instanceof Complex) {
            return b.opposite().plus(a)
        }
        return a.minus(b)
    }
    
    static mult(a: Complex|Scalar, b:Complex|Scalar): Complex|Scalar {
        if (a instanceof Complex) {
            return a.mult(b)
        }
        if (b instanceof Complex) {
            return b.mult(a)
        }
        return a.mult(b)
    }

    static div(a: Complex|Scalar, b:Complex|Scalar): Complex|Scalar {
        if (a instanceof Complex) {
            return a.div(b)
        }
        if (b instanceof Complex) {
            return b.inverse().mult(a)
        }
        return a.div(b)
    }

    /**
     * fabrique un Complexe ou un Scalar selon le besoin
     * @param {string|Decimal|number|Scalar} real partie réelle
     * @param {string|Decimal|number|Scalar} imag partie imaginaire
     */
    static make(real:string|Decimal|number|Scalar, imag:string|Decimal|number|Scalar):Complex|Scalar {
        const re = Scalar.make(real)
        if (re.isNaN() || imag === "0" || imag === 0) {
            return re
        }
        const im = Scalar.make(imag)
        if (im.isZero()) {
            return re
        }
        if (im.isNaN()) {
            return im
        }
        return new Complex(re, im)
    }


    /**
     * constructeur
     * @param {string|Decimal|number} entree 
     * @param {Decimal|null} denominator
     */
    private constructor(real: string|Decimal|number|Scalar, imag:string|Decimal|number|Scalar) {
        super()
        this._real = real instanceof Scalar ? real : new Scalar(real)
        this._imag = imag instanceof Scalar ? imag : new Scalar(imag)
    }

    get isNumber():boolean {
        return true
    }

    get startsWithMinus():boolean {
        return this._real.startsWithMinus || this._real.isZero() && this._imag.startsWithMinus
    }

    /**
     * renvoie la liste des variables dont dépend le noeud
     * @returns {NestedString}
     */
    subVariables(): NestedString {
        return []
    }

    /**
     * trantypage
     * @return {string}
     */
    toString():string {
        return this.toStringEn().replace('.', ',')
    }

    toStringEn():string {
        const real_part = this._real.toString()
        const imag_part = this._imag.toString()
        if (real_part === '0' && imag_part === '0') {
            return '0'
        }
        if (imag_part === '0') {
            return real_part
        }
        const imag_part_i = imag_part == '1'
            ? 'i'
            : imag_part == '-1'
                ? '-i'
                : imag_part+'i'
        if (real_part === '0') {
            return imag_part_i
        }
        if (imag_part.startsWith('-')) {
            return `${real_part} - ${imag_part_i.slice(1)}`
        }
        return `${real_part} + ${imag_part_i}`
    }

    get priority():number {
        return 10
    }

    isInteger() {
        return this._real.isInteger() && this._imag.isZero()
    }

    get floatValue():number {
        if (this._imag.isZero()) {
            return this._real.floatValue
        }
        return NaN
    }

    plus(value: Complex|Scalar|number|string): Complex|Scalar {
        if (value instanceof Complex) {
            return Complex.make(
                this._real.plus(value._real),
                this._imag.plus(value._imag)
            )
        }
        if (value instanceof Scalar) {
            return new Complex(
                this._real.plus(value),
                this._imag
            )
        }
        const s = new Scalar(value)
        return new Complex(
            this._real.plus(s),
            this._imag
        )
    }

    minus(value: Complex|Scalar|number|string): Complex|Scalar {
        if (value instanceof Complex) {
            return Complex.make(
                this._real.minus(value._real),
                this._imag.minus(value._imag)
            )
        }
        if (value instanceof Scalar) {
            return new Complex(
                this._real.minus(value),
                this._imag
            )
        }
        const s = new Scalar(value)
        return new Complex(
            this._real.minus(s),
            this._imag
        )
    }

    pow(exponent: number): Complex|Scalar {
        if (this.isNaN()) {
            return Scalar.NAN
        }
        if (exponent === 0) {
            return Scalar.ONE
        }
        if (exponent === 1) {
            return this
        }
        if (Math.floor(exponent) == exponent) {
            const neg = exponent < 0
            exponent = Math.abs(exponent)
            // si l'exposant est un entier, on peut utiliser une méthode plus efficace
            // expo rapide
            let result: Complex|Scalar = new Complex(Scalar.ONE, Scalar.ZERO)
            let base: Complex|Scalar = this
            while (exponent > 0) {
                if (exponent % 2 === 1) {
                    result = Complex.mult(base,result)
                }
                base = Complex.mult(base, base)
                exponent = Math.floor(exponent / 2)
            }
            if (neg) {
                return result.inverse()
            }
            return result
        }
        return Scalar.NAN
    }

    conjugate(): Complex|Scalar {
        if (this.isNaN()) {
            return Scalar.NAN
        }
        return new Complex(this._real, this._imag.opposite())
    }

    abs2(): Scalar {
        if (this.isNaN()) {
            return Scalar.NAN
        }
        return this._real.mult(this._real).plus(this._imag.mult(this._imag))
    }

    inverse():Complex|Scalar {
        if (this.isNaN() || this.isZero()) {
            return Scalar.NAN
        }
        const abs2 = this.abs2()
        return new Complex(this._real.div(abs2), this._imag.opposite().div(abs2))
    }

    mult(value: Complex|Scalar|number|string):Complex|Scalar {
        if (value instanceof Complex) {
            return Complex.make(
                this._real.mult(value._real).minus(this._imag.mult(value._imag)),
                this._real.mult(value._imag).plus(this._imag.mult(value._real))
            )
        }
        if (value instanceof Scalar) {
            return Complex.make(
                this._real.mult(value),
                this._imag.mult(value)
            )
        }
        const s = new Scalar(value)
        return Complex.make(
            this._real.mult(s),
            this._imag.mult(s)
        )
    }

    div(value: Complex|Scalar|number|string):Complex|Scalar {
        if (value instanceof Complex) {
            const denominator = value.abs2()
            return Complex.make(
                this._real.mult(value._real).plus(this._imag.mult(value._imag)).div(denominator),
                this._imag.mult(value._real).minus(this._real.mult(value._imag)).div(denominator)
            )
        }
        if (value instanceof Scalar) {
            return Complex.make(
                this._real.div(value),
                this._imag.div(value)
            )
        }
        const s = new Scalar(value)
        return Complex.make(
            this._real.div(s),
            this._imag.div(s)
        )
    }

    /**
     * Renvoie vrai si == 1
     * @returns { boolean }
     */
    isOne(): boolean {
        return this._real.isOne() && this._imag.isZero()
    }

    /**
     * Renvoie vrai si == -1
     * @returns { boolean }
     */
    isMinusOne(): boolean {
        return this._real.isMinusOne() && this._imag.isZero()
    }

    /**
     * Renvoie vrai si == 0
     * @returns { boolean }
     */
    isZero(): boolean {
        return this._real.isZero() && this._imag.isZero()
    }
    
    /**
     * renvoie true si c'est un nombre imaginaire pur (i)
     * @returns {boolean}
     */
    isI():boolean {
        return this._real.isZero() && this._imag.isOne()
    }

    /**
     * renvoie true si c'est un NaN
     * @returns {boolean}
     */
    isNaN():boolean {
        return this._real.isNaN() || this._imag.isNaN()
    }

    /**
     * renvoie -this
     * @returns {Scalar}
     */
    opposite(): Complex {
        if (this.isNaN() || this.isZero()) {
            return this
        }
        return new Complex(this._real.opposite(), this._imag.opposite())
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex():string {
        if (this.isNaN()) {
            return "\\mathrm{NaN}"
        }
        if (this.isZero()) {
            return "0"
        }
        const realPart = this._real.isZero() ? "" : this._real.toTex()
        const imagPart = this._imag.isZero() ? "" : this._imag.toTex()
        if (imagPart === "") {
            return realPart
        }
        const imagPartWithI = imagPart == "1"
            ? "i"
            : imagPart == "-1"
                ? "-i"
                : imagPart + "i"
        if (realPart == "") {
            return imagPartWithI
        }
        if (imagPart.startsWith("-")) {
            return realPart + " - " + imagPartWithI.slice(1)
        }
        return realPart + " + " + imagPartWithI
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values:Record<string, Decimal|string|number>|undefined):Decimal {
        if (this._imag.isZero()) {
            return this._real.toDecimal(values)
        }
        return new Decimal(NaN)
    }

    /**
     * evaluation numérique en decimal complexe
     * @param {object|undefined} values
     * @returns {ComplexDecimal}
     */
    toComplexDecimal(values:Record<string, Decimal|string|number>|undefined):ComplexDecimal {
        return new ComplexDecimal(this._real.toDecimal(values), this._imag.toDecimal(values))
    }

    signature():Signature {
        return new Signature()
    }

    toFixed(n:number):Complex {
        return new Complex(this._real.toFixed(n), this._imag.toFixed(n))
    }

    toDict():object {
        return {
            type: "Complex",
            real: this._real.toDict(),
            imag: this._imag.toDict()
        }
    }

    /**
     * renvoie la dérivée
     * @param {string} varName 
     * @returns {Base}
     */
    derivate(varName:string):Base {
        return Scalar.ZERO
    }

    isComplex():boolean {
        return !this._imag.isZero()
    }
}

/** @type {Complex} */
Complex.I = Complex.make(0, 1) as Complex

/** @type {Complex} */
Complex.MINUS_I = Complex.make(0, -1) as Complex


export { Complex }
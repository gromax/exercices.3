import { Base } from "./base"
import { Signature } from "./signature"
import Decimal from "decimal.js"

/** Calcul du plus grand commun diviseur de deux entiers a et b
 * @param {Decimal} a
 * @param {Decimal} b
 * @returns {Decimal}
 */
function gcd(a, b) {
    if (!a.isInteger() || !b.isInteger()) {
        return Scalar.ONE
    }
    if (b.isZero()) {
        return a
    }
    if (a.isZero()) {
        return b
    }
    a = a.abs().toNumber()
    b = b.abs().toNumber()
    while (a % b !== 0) {
        const r = a % b
        a = b
        b = r
    }
    return new Decimal(b)
}

class Scalar extends Base {
    static REGEX = new RegExp('\\d+[.,]?\\d*(E-?\\d+)?%?', 'i');
    /** @type {Scalar} */
    static ONE;
    /** @type {Scalar} */
    static ZERO;
    /** @type {Scalar} */
    static MINUS_ONE;
    /** @type {Scalar} */
    static NAN;

    /** @type{string} */
    #chaine = ""
    /** @type{Decimal} */
    #value = new Decimal(NaN)
    /** @type{Decimal|null} */
    #denominator = null

    /**
     * tente la fabrication d'un Scalar à partir d'une chaine
     * @param {string} chaine 
     * @return {null, Scalar}
     */
    static fromString(chaine) {
        if (!Scalar.REGEX.test(chaine)) {
            return null;
        }
        return new Scalar(chaine);
    }

    /**
     * teste si la chaîne est bien d'un scalaire
     * @param {string} chaine 
     * @returns {boolean}
     */
    static isScalar(chaine) {
        return Scalar.REGEX.test(chaine)
    }

    /**
     * constructeur
     * @param {string|Decimal|number} entree 
     * @param {Decimal|null} denominator
     */
    constructor(entree, denominator = null) {
        super();
        if (typeof entree == 'string') {
            this.#makeFromString(entree)
        } else if (typeof entree == 'number') {
            this.#makeFromNumber(entree)
        } else if (entree instanceof Decimal) {
            this.#makeFromDecimal(entree)
        } else {
            throw new Error(`entree = ${entree} invalide pour un Scalar`)
        }
        // si un dennominateur est donné, on est dans un cas où on veut simplifier
        if (!(denominator instanceof Decimal)) {
            return
        }
        // le signe sera toujours porté par le numérateur
        if (denominator.isPositive()) {
            this.#denominator = denominator
        } else {
            this.#value = this.#value.negated()
            this.#denominator = denominator.negated()
        }
        const gcdValue = gcd(this.#value, this.#denominator)
        this.#value = this.#value.dividedBy(gcdValue)
        this.#denominator = this.#denominator.dividedBy(gcdValue)
        // le dénominateur ne sera jamais de 1
        if (this.#denominator.equals(1)) {
            this.#denominator = null
        }
        if (this.#denominator.equals(0)) {
            this.#value = new Decimal(NaN)
            this.#denominator = null
        }
        this.#chaine = this.toString()
    }

    get isNumber() {
        return true
    }

    #getDenominator() {
        return this.#denominator || new Decimal(1)
    }

    /**
     * auxiliaire constructureur pour une chaine
     * @param {string} chaine 
     */
    #makeFromString(chaine) {
        if (!Scalar.isScalar(chaine)) {
            throw new Error(`entree = ${chaine} invalide pour un Scalar`)
        }
        chaine = chaine.trim()
        let percent = false
        this.#chaine = chaine
        chaine = chaine.replace(',', '.')
        let i = chaine.indexOf('%')
        if (i >= 0) {
            percent = true
            chaine = chaine.substring(0,i).trim()
        }
        this.#value = new Decimal(chaine)
        if (percent) {
            this.#value = this.#value.div(100)
        }
    }

    /**
     * auxiliaire constructeur pour un Number
     * @param {number}
     */
    #makeFromNumber(n) {
        this.#chaine = String(n)
        this.#value = new Decimal(n)
    }

    /**
     * auxiliaire constructeur pour un Decimal
     * @param {Decimal} d
     */
    #makeFromDecimal(d) {
        this.#chaine = d.toString()
        this.#value = d
    }

    /**
     * trantypage
     * @return {string}
     */
    toString() {
        const numerator = this.#value.toString().replace('.', ',')
        if (this.#denominator === null) {
            return numerator;
        }
        const denominator = this.#denominator.toString().replace('.', ',')
        return `${numerator} / ${denominator}`
    }

    toStringEn() {
        const numerator = this.#value.toString()
        if (this.#denominator === null) {
            return numerator;
        }
        const denominator = this.#denominator.toString()
        return `${numerator} / ${denominator}`
    }

    get priority() {
        return 10
    }

    isInteger() {
        return this.#value.isInteger() && (this.#denominator === null)
    }

    get floatValue() {
        const numValue = this.#value.toNumber()
        if (this.#denominator === null) {
            return numValue
        }
        return numValue / this.#denominator.toNumber()
    }

    plus(value) {
        if (!(value instanceof Scalar)) {
            // si value n'est pas un Scalar, on tente de le convertir
            // si la valeur n'est pas satisfaisante, le contructeurr lève une erreur
            value = new Scalar(value)
        }
        if (this.#denominator === null || value.#denominator === null) {
            // cas simple
            return new Scalar(this.#value.add(value.#value))
        }
        // cas avec dénominateurs
        const deno = this.#getDenominator()
        const valDeno = value.#getDenominator()
        const numerator = this.#value.mul(valDeno).add(value.#value.mul(deno))
        const denominator = deno.mul(valDeno)
        return new Scalar(numerator, denominator)
    }

    minus(value) {
        if (!(value instanceof Scalar)) {
            // si value n'est pas un Scalar, on tente de le convertir
            // si la valeur n'est pas satisfaisante, le contructeurr lève une erreur
            value = new Scalar(value)
        }
        return this.plus(value.opposite())
    }

    inverse() {
        if (this.isNaN() || this.#value.isZero()) {
            return Scalar.NAN
        }
        const deno = this.#getDenominator()
        return new Scalar(deno, this.#value)
    }

    mult(value) {
        if (!(value instanceof Scalar)) {
            // si value n'est pas un Scalar, on tente de le convertir
            // si la valeur n'est pas satisfaisante, le contructeurr lève une erreur
            value = new Scalar(value)
        }
        const newNumerator = this.#value.mul(value.#value)
        if (this.#denominator === null || value.#denominator === null) {
            // cas simple
            return new Scalar(newNumerator)
        }
        // cas avec dénominateurs
        const deno = this.#getDenominator()
        const valDeno = value.#getDenominator()
        const newDenominator = deno.mul(valDeno)
        return new Scalar(newNumerator, newDenominator)
    }

    div(value) {
        if (!(value instanceof Scalar)) {
            // si value n'est pas un Scalar, on tente de le convertir
            // si la valeur n'est pas satisfaisante, le contructeurr lève une erreur
            value = new Scalar(value)
        }
        if (this.#denominator === null || value.#denominator === null) {
            // cas simple
            return new Scalar(this.#value, value.#value)
        }
        // cas avec dénominateurs
        const newNumerator = this.#value.mul(value.#getDenominator())
        const newDenominator = this.#getDenominator().mul(value.#value)
        return new Scalar(newNumerator, newDenominator)
    }

    /**
     * Renvoie vrai si == 1
     * @returns { boolean }
     */
    isOne() {
        return this.#value.equals(1) && (this.#denominator === null)
    }

    /**
     * Renvoie vrai si == 1
     * @returns { boolean }
     */
    isZero() {
        return this.#value.equals(0)
    }

    /**
     * renvoie true si c'est un NaN
     * @returns {boolean}
     */
    isNaN() {
        return this.#value.isNaN()
    }

    /**
     * renvoie -this
     * @returns {Scalar}
     */
    opposite() {
        if (this.isNaN()) {
            return this
        }
        return new Scalar(this.#value.negated(), this.#denominator)
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex() {
        const numerator = this.#value.toString().replace('.', ',')
        if (this.#denominator === null) {
            return numerator;
        }
        const denominator = this.#denominator.toString().replace('.', ',')
        return `\\frac{${numerator}}{${denominator}}`
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values) {
        const numerator = this.#value
        if (this.#denominator === null) {
            return numerator
        }
        return numerator.div(this.#denominator)
    }

    signature() {
        return new Signature()
    }

    toFixed(n) {
        return new Scalar(this.toDecimal().toFixed(n))
    }

    toDict() {
        if (this.#denominator === null) {
            return {
                type: "Scalar",
                chaine: this.#chaine,
                decimal: this.toDecimal(),
                number: this.#value.toNumber()
            }
        }
        return {
            type: "Scalar",
            chaine: this.#chaine,
            decimal: this.toDecimal(),
            numerator: this.#value.toNumber(),
            denominator: this.#denominator.toNumber()
        }
    }

    isPositive() {
        return this.#value.isPositive()
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
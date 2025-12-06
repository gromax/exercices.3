import { Base } from "./base";
import Decimal from "decimal.js";

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
    #chaine = "";
    /** @type{Decimal} */
    #value = new Decimal(NaN);


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
     * constructeur
     * @param {string, number} entree 
     */
    constructor(entree) {
        super();
        if (typeof entree == 'string') {
            this.#makeFromString(entree);
        } else if (typeof entree == 'number') {
            this.#makeFromNumber(entree);
        } else if (entree instanceof Decimal) {
            this.#makeFromString(String(entree));
        } else {
            throw new Error(`entree = ${entree} invalide pour un Scalar`);
        }
    }

    /**
     * teste si la chaîne est bien d'un scalaire
     * @param {string} chaine 
     * @returns {boolean}
     */
    static isScalar(chaine) {
        return Scalar.REGEX.test(chaine);
    }

    /**
     * auxiliaire constructureur pour une chaine
     * @param {string} chaine 
     */
    #makeFromString(chaine) {
        if (!Scalar.isScalar(chaine)) {
            throw new Error(`entree = ${entree} invalide pour un Scalar`);
        }
        chaine = chaine.trim();
        let percent = false;
        this.#chaine = chaine;
        chaine = chaine.replace(',', '.');
        let i = chaine.indexOf('%');
        if (i >= 0) {
            percent = true;
            chaine = chaine.substring(0,i).trim();
        }
        this.#value = new Decimal(chaine);
        if (percent) {
            this.#value = this.#value.div(100);
        }
    }

    /**
     * auxiliaire constructeur pour un Number
     * @param {number}
     */
    #makeFromNumber(n) {
        this.#chaine = String(n);
        this.#value = new Decimal(n);
    }

    /**
     * trantypage
     * @return {string}
     */
    toString() {
        return this.#value.toString();
    }

    get priority() {
        return 10;
    }

    isInteger() {
        return this.#value.isInteger();
    }

    get floatValue() {
        return this.#value.toNumber();
    }

    /**
     * Renvoie vrai si == 1
     * @returns { boolean }
     */
    isOne() {
        return this.#value.equals(1);
    }

    /**
     * Renvoie vrai si == 1
     * @returns { boolean }
     */
    isZero() {
        return this.#value.equals(0);
    }

    /**
     * renvoie true si c'est un NaN
     * @returns {boolean}
     */
    isNaN() {
        return this.#value.isNaN();
    }

    /**
     * renvoie -this
     * @returns {Scalar}
     */
    opposite() {
        if (this.isNaN()) {
            return this;
        }
        let opp = new Scalar(1);
        opp.#value = this.#value.negated();
        if (this.#chaine.startsWith('-')) {
            opp.#chaine = this.#chaine.substring(1).trim();
        } else {
            opp.#chaine = `-${this.#chaine}`;
        }
        return opp;
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex() {
        return this.#chaine.replace('%', '\\%');
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values) {
        return this.#value;
    }

    signature() {
        return [];
    }

    multiplyBy(n) {
        if (!(n instanceof Scalar)) {
            throw new Error('n doit être un Scalar');
        }
        return new Scalar(this.#value.mul(n.#value));
    }
}

/** @type {Scalar} */
Scalar.ONE = new Scalar(1);

/** @type {Scalar} */
Scalar.ZERO = new Scalar(0);

/** @type {Scalar} */
Scalar.MINUS_ONE = Scalar.ONE.opposite();

/** @type {Scalar} */
Scalar.NAN = new Scalar(NaN);

export { Scalar };
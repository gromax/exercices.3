import { Base } from "./base";
import { pgcd } from "../numbertools/misc";

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
    /** @type{boolean} */
    #float = false;
    /** @type{number} */
    #floatValue;
    /** @type{number} */
    #numerator = 0;
    /** @type{number} */
    #denominator = 1;

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
        } else {
            throw new Error(`entree = ${entree} invalide pour un Scalar`);
        }
    }

    /**
     * teste si la chaîne est bien d'un symbole
     * @param {string} chaine 
     * @returns {boolean}
     */
    static isScalar(chaine) {
        return Scalar.REGEX.test(chaine);
    }

    /**
     * Effectue la somme des scalaires
     * @param {Array} scalars 
     * @returns {Scalar}
     */
    static somme(scalars) {
        let s = this.ZERO;
        for (let scalar of scalars) {
            if (!(scalar instanceof Scalar)) {
                throw new Error(`${scalar} n'est pas un objet Scalar`);
            }
            s = s.add(scalar);
        }
        return s;
    }

    /**
     * Effectue la multiplication des scalaires
     * @param {Array} scalars 
     * @returns {Scalar}
     */
    static produit(scalars) {
        let s = this.ONE;
        for (let scalar of scalars) {
            if (!(scalar instanceof Scalar)) {
                throw new Error(`${scalar} n'est pas un objet Scalar`);
            }
            s = s.multiply(scalar);
        }
        return s;
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
        this.#floatValue = Number(chaine);
        if (percent) {
            this.#floatValue = this.#floatValue/100;
        }
        if (chaine.indexOf('E') >= 0) {
            this.#float = true;
            this.#numerator = this.#floatValue;
            return;
        }
        let iDot = chaine.indexOf('.');
        let a = iDot >=0? chaine.substring(0,iDot) : chaine;
        let b = iDot >=0? chaine.substring(iDot+1) : "";
        this.#denominator = Math.pow(10,b.length);
        if (percent) {
            this.#denominator *= 100;
        }
        this.#numerator = Number(a+b);
        this.#reduction();
    }

    /**
     * Réduit la fraction
     */
    #reduction(){
        if (this.#float) {
            return;
        }
        let p = pgcd(this.#numerator, this.#denominator);
        if (p>1) {
            this.#numerator = this.#numerator / p;
            this.#denominator = this.#denominator / p;
        }
    }

    /**
     * auxiliaire constructeur pour un Number
     * @param {number}
     */
    #makeFromNumber(n) {
        this.#chaine = String(n);
        this.#floatValue = n;
        this.#numerator = n;
        this.#float = isNaN(n) || (Math.floor(n) != n);
    }

    /**
     * trantypage
     * @return {string}
     */
    toString() {
        return this.#chaine;
    }

    get priority() {
        return 10;
    }

    isInteger() {
        return (!this.#float) && (this.#denominator == 1);
    }

    get floatValue() {
        return this.#floatValue;
    }

    /**
     * Renvoie vrai si == 1
     * @returns { boolean }
     */
    isOne() {
        return (!this.#float) && (this.#numerator == 1) && (this.#denominator == 1);
    }

    /**
     * Renvoie vrai si == 1
     * @returns { boolean }
     */
    isZero() {
        return this.#floatValue == 0;
    }

    /**
     * renvoie true si c'est un NaN
     * @returns {boolean}
     */
    isNaN() {
        return isNaN(this.#floatValue);
    }

    /**
     * renvoie -this
     * @returns {Scalar}
     */
    opposite() {
        if (this.isNaN()) {
            return this;
        }
        let opp = new Scalar(-this.#floatValue);
        opp.#float = this.#float || opp.isNaN();
        opp.#numerator = - this.#numerator;
        opp.#denominator = this.#denominator;
        if (!opp.#float) {
            opp.#chaine = opp.#denominator == 1? `${opp.#numerator}` : `(${opp.#numerator}/${opp.#denominator})`;
        }
        return opp;
    }

    /**
     * renvoie l'inverse de this
     * @returns {Scalar}
     */
    inverse() {
        if (this.isNaN()) {
            return Scalar.NAN;
        }
        let inv = this.#floatValue == 0? new Scalar(Number('NaN')):new Scalar(1/this.#floatValue);
        inv.#float = this.#float || inv.isNaN()
        inv.#numerator = this.#numerator>0? this.#denominator:-this.#denominator;
        inv.#denominator = Math.abs(this.#numerator);
        if (!inv.#float) {
            inv.#chaine = inv.#denominator == 1? `${inv.#numerator}` : `(${inv.#numerator}/${inv.#denominator})`;
        }
        return inv;
    }

    /**
     * renvoie this * other
     * @param {Scalar|number|string} other 
     * @returns {Scalar}
     */
    multiply(other) {
        if (this.isNaN()) {
            return Scalar.NAN;
        }
        if (other === 1) {
            return this;
        }
        if (!(other instanceof Scalar)) {
            other = new Scalar(other);
        }
        if (other.isNaN()) {
            return Scalar.NAN;
        }
        let s = new Scalar(this.#floatValue * other.floatValue);
        s.#float = this.#float || other.#float;
        s.#numerator = this.#numerator * other.#numerator;
        s.#denominator = this.#denominator * other.#denominator;
        s.#reduction();
        if (!s.#float) {
            s.#chaine = s.#denominator == 1? `${s.#numerator}` : `${s.#numerator}/${s.#denominator}`;
        }
        return s;
    }

    /**
     * renvoie this * other
     * @param {Scalar|number|string} other 
     * @returns {Scalar}
     */
    power(other) {
        if (this.isNaN()) {
            return this;
        }
        if (other === 1) {
            return this;
        }
        if (!(other instanceof Scalar)) {
            other = new Scalar(other);
        }
        if (other.isNaN()) {
            return other;
        }
        if (this.#float || other.#float || !other.isInteger()) {
            return new Scalar(Math.pow(this.#floatValue, other.#floatValue));
        }
        let p = Math.abs(other.#floatValue);
        let s = Scalar.ONE;
        for (let i=0; i<p; i++) {
            s = s.multiply(this);
        }
        if (other.#floatValue<0) {
            s = s.inverse();
        }
        return s;
    }

    /**
     * renvoie this * other
     * @param {Scalar|number|string} other 
     * @returns {Scalar}
     */
    add(other) {
        if (this.isNaN()) {
            return Scalar.NAN;
        }
        if (other === 0) {
            return this;
        }
        if (!(other instanceof Scalar)) {
            other = new Scalar(other);
        }
        if (other.isNaN()) {
            return Scalar.NAN;
        }
        let s = new Scalar(this.#floatValue + other.floatValue);
        s.#float = this.#float || other.#float;
        s.#numerator = this.#numerator * other.#denominator + other.#numerator * this.#denominator;
        s.#denominator = this.#denominator * other.#denominator;
        s.#reduction();
        if (!s.#float) {
            s.#chaine = s.#denominator == 1? `${s.#numerator}` : `${s.#numerator}/${s.#denominator}`;
        }
        return s;
    }

    /**
     * renvoie this * other
     * @param {Scalar|number|string} other 
     * @returns {Scalar}
     */
    divide(other) {
        if (this.isNaN()) {
            return Scalar.NAN;
        }
        if (other === 1) {
            return this;
        }
        if (!(other instanceof Scalar)) {
            other = new Scalar(other);
        }
        if (other.isNaN()) {
            return Scalar.NAN;
        }
        return this.multiply(other.inverse());
    }

    /**
     * scalaire pouvant être factorisé
     * @returns {Scalar}
     */
    scalar(){
        return this;
    }
    
    /**
     * renvoie la partie du noeud sans les scalaires pouvant être factorisés
     * @returns {Scalar}
     */
    noScalar() {
        return Scalar.ONE;
    }

    /**
     * renvoie la chaîne dépourvue de scalaires pour identifier un groupe dans une somme
     * @returns {Base}
     */
    noScalarString() {
        return "1";
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    tex() {
        return this.#floatValue; // à compléter...
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

Base.prototype.scalar = function() {
    return Scalar.ONE;
}

export { Scalar };
import { Base } from "./base";
import { Scalar } from "./scalar";
import Decimal from "decimal.js";

class MultDiv extends Base {
    _left; /** @type {Base} */
    _right; /** @type {Base} */

    /**
     * accesseurs
     */
    get left() {
        return this._left;
    }

    get right() {
        return this._right;
    }

    get priority() {
        return 2;
    }

    /**
     * constructeur
     * @param {Base} left 
     * @param {Base} right
     */
    constructor(left, right) {
        super();
        if (!(left instanceof Base)) {
            throw new Error("left invalide");
        }
        if (!(right instanceof Base)) {
            throw new Error("right invalide");
        }
        this._left = left;
        this._right = right;
    }

    /**
     * si un nom est précisé, renvoie true si le nœud dépend de la variable,
     * sinon renvoie la liste des variables dont dépend le noeud
     * @param {string|undefined} name 
     * @returns {boolean|Array}
     */
    isFunctionOf(name){
        if (typeof name === 'undefined') {
            return _.uniq(this._left.isFunctionOf().concat(this._right.isFunctionOf())).sort()
        }
        return this._left.isFunctionOf(name) || this._right.isFunctionOf(name)
    }

    substituteVariable(varName, value) {
        const newLeft = this._left.substituteVariable(varName, value)
        const newRight = this._right.substituteVariable(varName, value)
        if (newLeft === this._left && newRight === this._right) {
            // pas de changement
            return this
        }
        return new this.constructor(newLeft, newRight)
    }

    substituteVariables(values) {
        const leftSub = this._left.substituteVariables(values)
        const rightSub = this._right.substituteVariables(values)
        if (leftSub === this._left && rightSub === this._right) {
            // pas de changement
            return this
        }
        return new this.constructor(leftSub, rightSub);
    }

    toFixed(n) {
        const newLeft = this._left.toFixed(n)
        const newRight = this._right.toFixed(n)
        return new this.constructor(newLeft, newRight)
    }
}


class Mult extends MultDiv {
    /** @type {string|null} représentation texte */
    #string = null;
    /** @type {string|null} représentation texte */
    #stringEN = null;

    /**
     * 
     * @param {Array} operandes 
     * @returns {Mult, Scalar}
     */
    static fromList(operandes) {
        if (operandes.length == 0){
            return Scalar.ONE;
        }
        if (operandes.length == 1) {
            return operandes[0];
        }
        let n = operandes.length;
        let node = new Mult(operandes[n-2], operandes[n-1]);
        for (let i=n-3; i>=0; i--) {
            node = new Mult(operandes[i], node);
        }
        return node;
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        if (this.#string == null) {
            let left = this._left.priority < this.priority
                ? `(${String(this._left)})`
                : String(this._left);
            let right = this._right.priority < this.priority
                ? `(${String(this._right)})`
                : String(this._right);
            this.#string = `${left} * ${right}`;
        }
        return this.#string;
    }

    toStringEn() {
        if (this.#stringEN == null) {
            this.#stringEN = `(${this._left.toStringEn()}) * (${this._right.toStringEn()})`
        }
        return this.#stringEN
    }

    isExpanded() {
        if (!this._left.isExpanded() || !this._right.isExpanded()) {
            return false;
        }
        if (this._left instanceof Scalar && this._right instanceof Scalar) {
            return false;
        }
        if (this._left.canBeDistributed || this._right.canBeDistributed) {
            return false;
        }
        return true;
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex() {
        let texLeft = this._left.priority < this.priority
            ? `\\left(${this._left.toTex()}\\right)`
            : this._left.toTex();
        let texRight = this._right.priority < this.priority
            ? `\\left(${this._right.toTex()}\\right)`
            : this._right.toTex();
        return `${texLeft} \\cdot ${texRight}`;
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values) {
        let v = this._left.toDecimal(values);
        return v.mul(this._right.toDecimal(values));
    }

    signature() {
        let lefts = this._left.signature()
        if (!Array.isArray(lefts)) {
            lefts = [lefts]
        }
        let rights = this._right.signature()
        if (!Array.isArray(rights)) {
            rights = [rights]
        }
        for (let s of rights) {
            let found = false
            for (let s1 of lefts) {
                if (s.text === s1.text) {
                    // simplification
                    s1.exponent += s.exponent
                    s1.scalarNum = s1.scalarNum.mul(s.scalarNum)
                    s1.scalarDen = s1.scalarDen.mul(s.scalarDen)
                    found = true
                    break
                }
            }
            if (!found) {
                lefts.push(s)
            }
        }
        for (let item of lefts) {
            if (item.scalarNum.equals(0)) {
                return {
                    scalarNum: Decimal(0),
                    scalarDen: Decimal(1),
                    exponent: 1,
                    text: '0',
                    node: Scalar.ZERO
                }
            }
            if (item.exponent === 0) {
                item.text = '1'
                item.node = Scalar.ONE
            }
        }
        const scalars = lefts.filter(item => item.text === '1')
        const nonScalars = lefts.filter(item => item.text !== '1')
        while (scalars.length > 1) {
            const s1 = scalars.pop()
            scalars[0].scalarNum = scalars[0].scalarNum.mul(s1.scalarNum)
            scalars[0].scalarDen = scalars[0].scalarDen.mul(s1.scalarDen)
        }
        const result = [...scalars, ...nonScalars]
        if (result.length === 1) {
            return result[0]
        }
        return result.sort((a, b) => a.text.localeCompare(b.text))
    }

    /** recherche les facteurs dans les mults enfants
     * @returns {Array<Base>} */
    childFactors() {
        const factorsLeft = this._left instanceof Mult
            ? this._left.childFactors()
            : [this._left];
        const factorsRight = this._right instanceof Mult
            ? this._right.childFactors()
            : [this._right];
        return factorsLeft.concat(factorsRight);
    }

    opposite() {
        // recherche un enfant pour porter l'opposite
        // sinon multiplie par -1
        if (typeof this.left.opposite === 'function') {
            return new Mult(this.left.opposite(), this.right);
        }
        if (typeof this.right.opposite === 'function') {
            return new Mult(this.left, this.right.opposite());
        }
        return new Mult(Scalar.MINUS_ONE, this);
    }

    toDict() {
        return {
            type: "Mult",
            left: this._left.toDict(),
            right: this._right.toDict()
        }
    }
}


class Div extends MultDiv {
    /** @type {string|null} représentation texte */
    #string = null
    /** @type {string|null} représentation texte */
    #stringEN = null

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        if (this.#string != null) {
            return this.#string
        }
        const left = this._left.priority <= this.priority
            ? `(${String(this._left)})`
            : String(this._left)
        const right = this._right.priority <= this.priority
            ? `(${String(this._right)})`
            : String(this._right)
        this.#string = `${left} / ${right}`
        return this.#string;
    }

    toStringEn() {
        if (this.#stringEN == null) {
            this.#stringEN = `(${this._left.toStringEn()}) / (${this._right.toStringEn()})`
        }
        return this.#stringEN
    }

    isExpanded() {
        if (!this.left.isExpanded() || !this.right.isExpanded()) {
            return false;
        }
        return true;
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex() {
        let texLeft = this._left.toTex();
        let texRight = this._right.toTex();
        return `\\frac{${texLeft}}{${texRight}}`;
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values) {
        let left = this._left.toDecimal(values);
        let right = this._right.toDecimal(values);
        return left.dividedBy(right);
    }

    signature() {
        let lefts = this._left.signature()
        if (!Array.isArray(lefts)) {
            lefts = [lefts]
        }
        let rights = this._right.signature()
        if (!Array.isArray(rights)) {
            rights = [rights]
        }
        for (let s of rights) {
            let found = false
            for (let s1 of lefts) {
                if (s.text === s1.text) {
                    // simplification
                    s1.exponent -= s.exponent
                    s1.scalarNum = s1.scalarNum.mul(s.scalarDen)
                    s1.scalarDen = s1.scalarDen.mul(s.scalarNum)
                    found = true
                    break
                }
            }
            if (!found) {
                s.exponant = -s.exponent
                const den = s.scalarDen
                s.scalarDen = s.scalarNum
                s.scalarNum = den
                lefts.push(s)
            }
        }
        for (let item of lefts) {
            if (item.scalarNum.equals(0)) {
                return {
                    scalarNum: Decimal(0),
                    scalarDen: Decimal(1),
                    exponent: 1,
                    text: '0',
                    node: Scalar.ZERO
                }
            }
            if (item.exponent === 0) {
                item.text = '1'
                item.node = Scalar.ONE
            }
        }
        const scalars = lefts.filter(item => item.text === '1')
        const nonScalars = lefts.filter(item => item.text !== '1')
        while (scalars.length > 1) {
            const s1 = scalars.pop()
            scalars[0].scalarNum = scalars[0].scalarNum.mul(s1.scalarNum)
            scalars[0].scalarDen = scalars[0].scalarDen.mul(s1.scalarDen)
        }
        const result = [...scalars, ...nonScalars]
        if (result.length === 1) {
            return result[0]
        }
        return result.sort((a, b) => a.text.localeCompare(b.text))
    }

    opposite() {
        if (typeof this._left.opposite === 'function') {
            return new Div(this._left.opposite(), this._right);
        }
        if (typeof this._right.opposite === 'function') {
            return new Div(this._left, this._right.opposite());
        }
        return new Mult(Scalar.MINUS_ONE, this);
    }

    toDict() {
        return {
            type: "Div",
            left: this._left.toDict(),
            right: this._right.toDict()
        }
    }
}

export { Mult, Div, MultDiv};
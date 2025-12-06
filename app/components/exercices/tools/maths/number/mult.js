import { Base } from "./base";
import { Scalar } from "./scalar";
import { Add, Minus } from "./add";
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
            return _.uniq(this._left.isFunctionOf().concat(this._right.isFunctionOf()));
        }
        return this._left.isFunctionOf(name) || this._right.isFunctionOf(name);
    }
}


class Mult extends MultDiv {
    /** @type {string|null} représentation texte */
    #string = null;

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

    isExpanded() {
        if (!this._left.isExpanded() || !this._right.isExpanded()) {
            return false;
        }
        if (this._left instanceof Scalar && this._right instanceof Scalar) {
            return false;
        }
        if (this._left instanceof Add || this._right instanceof Add
            || this._left instanceof Minus || this._right instanceof Minus
        ) {
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
        const lefts = this._left.signature();
        const rights = this._right.signature();
        return [...lefts, ...rights].sort();
    }

    /** recherche les facteurs dans les mults enfants
     * @returns {Array<Base>} */
    _chilfFactors() {
        const factorsLeft = this._left instanceof Mult
            ? this._left._chilfFactors()
            : [this._left];
        const factorsRight = this._right instanceof Mult
            ? this._right._chilfFactors()
            : [this._right];
        return factorsLeft.concat(factorsRight);
    }

    simplify() {
        const factors = this._chilfFactors().map(f => f.simplify());
        const scalarsFactors = factors.filter(f => f instanceof Scalar);
        let scalarFactor = Scalar.ONE;
        for (let sf of scalarsFactors) {
            scalarFactor = scalarFactor.multiplyBy(sf);
        }
        if (scalarFactor.isZero()) {
            return Scalar.ZERO;
        }
        const nonScalarFactors = factors.filter(f => !(f instanceof Scalar) && !f.isOne());
        if (nonScalarFactors.length === 0) {
            return scalarFactor;
        }

        const nonScalar = Mult.fromList(nonScalarFactors);
        if (scalarFactor.isOne()) {
            return nonScalar;
        }
        return new Mult(scalarFactor, nonScalar);
    }

    opposite() {
        // recherche un enfant pour porter l'opposite
        // sinon multiplie par -1
        const s = this.simplify();
        if (s instanceof Mult) {
            if (typeof s.left.opposite === 'function') {
                return new Mult(s.left.opposite(), s.right);
            }
            if (typeof s.right.opposite === 'function') {
                return new Mult(s.left, s.right.opposite());
            }
            return new Mult(Scalar.MINUS_ONE, s);
        }
        if (typeof s.opposite === 'function') {
            return s.opposite();
        }
        return new Mult(Scalar.MINUS_ONE, s);
    }
}


class Div extends MultDiv {
    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        let left = this._left.priority <= this.priority
            ? `(${String(this._left)})`
            : String(this._left);
        let right = this._right.priority <= this.priority
            ? `(${String(this._right)})`
            : String(this._right);
        return `${left} / ${right}`;
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
        const lefts = this._left.signature();
        const rights = this._right.signature().map(s => `/${s}`);
        const result = [];
        for (let s of lefts) {
            if (rights.includes(`/${s}`)) {
                // simplification
                const i = rights.indexOf(`/${s}`);
                rights.splice(i, 1);
                continue;
            }
            result.push(s);
        }
        for (let s of rights) {
            result.push(s);
        }
        return result.sort();
    }

    simplify() {
        const leftSim = this._left.simplify();
        const rightSim = this._right.simplify();
        if (leftSim.isZero()) {
            return Scalar.ZERO;
        }
        if (rightSim.isOne()) {
            return leftSim;
        }
        if (rightSim.isZero()) {
            return Scalar.NAN;
        }
        // simplification des scalaires
        if (leftSim instanceof Scalar && rightSim instanceof Scalar) {
            if (leftSim.toDecimal().modulo(rightSim.toDecimal()).equals(0)
                && (!leftSim.isInteger() || !rightSim.isInteger())) {
                const val = leftSim.toDecimal().dividedBy(rightSim.toDecimal());
                return new Scalar(val);
            }
        }
        return new Div(leftSim, rightSim);
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

}

export { Mult, Div};
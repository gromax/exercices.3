import { Base } from "./base";
import { Scalar } from "./scalar";
import Decimal from "decimal.js";

class AddMinus extends Base {
    _left; /** @type {Base} */
    _right; /** @type {Base} */
    _canBeDistributed = true

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
     * accesseurs
     */
    get left() {
        return this._left;
    }

    get right() {
        return this._right;
    }

    get priority() {
        return 1;
    }

    /**
     * prédicat : le noeud est-il développé
     * @returns {boolean}
     */
    isExpanded() {
        if (!this._left.isExpanded() || !this._right.isExpanded()) {
            return false;
        }
        if (this._left instanceof Scalar && this._right instanceof Scalar) {
            return false;
        }
        const c = this.childrenSignatures();
        if (new Set(c).size < c.length) {
            return false;
        }
        if (c.includes('0')) {
            return false;
        }
        return true;
    }

    _getChildAddMinus() {
        const left  = this._left instanceof AddMinus
            ? this._left._getChildAddMinus()
            : [this._left]
        const right = this._right instanceof AddMinus
            ? this._right._getChildAddMinus()
            : [this._right]
        return left.concat(right)
    }

    childrenSignatures() {
        // récupère les enfants pris dans un +/-
        return this._getChildAddMinus().map(
            (child) => {
                const s = child.signature()
                if (Array.isArray(s)) {
                    return s.map( c => `(${c.text})^${c.exponent}` ).join('*')
                } else {
                    return `(${s.text})^${s.exponent}`
                }
            }
        )
    }

    /**
     * si un nom est précisé, renvoie true si le nœud dépend de la variable,
     * sinon renvoie la liste des variables dont dépend le noeud
     * @param {string|undefined} name 
     * @returns {boolean|Array}
     */
    isFunctionOf(name){
        if (typeof name == 'undefined') {
            return _.uniq(this._left.isFunctionOf().concat(this._right.isFunctionOf())).sort()
        }
        return this._left.isFunctionOf(name) || this._right.isFunctionOf(name)
    }

    simplify() {
        const leftSim = this._left.simplify()
        const rightSim = this._right.simplify()
        if (leftSim.isZero()) {
            return rightSim
        } 
        if (rightSim.isZero()) {
            return leftSim
        }
        if (leftSim instanceof Scalar && rightSim instanceof Scalar) {
            let val = leftSim.toDecimal().plus(rightSim.toDecimal())
            return new Scalar(val)
        }
        return new this.constructor(leftSim, rightSim)
    }

    substituteVariable(varName, value) {
        const leftSub = this._left.substituteVariable(varName, value)
        const rightSub = this._right.substituteVariable(varName, value)
        if (leftSub === this._left && rightSub === this._right) {
            // pas de changement
            return this
        }
        return new this.constructor(leftSub, rightSub);
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


class Add extends AddMinus {
    /** @type {string|null} représentation texte */
    #string;
    /** @type {string|null} représentation texte */
    #stringEN;

    /**
     * constructeur
     * @param {Base} left 
     * @param {Base} right 
     */
    constructor(left, right) {
        super(left, right);
    }

    /**
     * Produit une somme à partir d'une liste d'opérandes
     * @param {Array<Base>} operandes 
     * @returns {Base}
     */
    static fromList(operandes) {
        operandes = _.filter(operandes, function(item){return (!(item instanceof Scalar) || !item.isZero())})
        if (operandes.length == 0){
            return Scalar.ZERO;
        }
        if (operandes.length == 1) {
            return operandes[0];
        }
        let n = operandes.length;
        let node = new Add(operandes[n-2], operandes[n-1]);
        for (let i=n-3; i>=0; i--) {
            node = new Add(operandes[i], node);
        }
        return node;
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        if (this.#string != null) {
            return this.#string
        }
        this.#string = `${String(this._left)} + ${String(this._right)}`
        return this.#string
    }

    toStringEn() {
        if (this.#stringEN != null) {
            return this.#stringEN
        }
        this.#stringEN = `${this._left.toStringEn()} + ${this._right.toStringEn()}`
        return this.#stringEN
    }

    /** recherche les opérandes des add/minus enfants
     * @returns {[Array<Base>, Array<Base>]} les éléments en plus et les éléments en moins
     */
    childOperands() {
        const factorsLeft = this._left instanceof AddMinus
            ? this._left.childOperands()
            : [[this._left], []]
        const factorsRight = this._right instanceof AddMinus
            ? this._right.childOperands()
            : [[this._right], []]
        return [
            factorsLeft[0].concat(factorsRight[0]),
            factorsLeft[1].concat(factorsRight[1])
        ]
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex() {
        let texLeft = this._left.toTex();
        let texRight = this._right.toTex();
        return `${texLeft} + ${texRight}`;
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values) {
        let v = this._left.toDecimal(values);
        return v.plus(this._right.toDecimal(values));
    }

    toDict() {
        return {
            type: "Add",
            left: this._left.toDict(),
            right: this._right.toDict()
        }
    }
}

class Minus extends AddMinus {
    /** @type {string|null} représentation texte */
    #string = null
    /** @type {string|null} représentation texte */
    #stringEN = null

    constructor(left, right) {
        super(left, right);
        this.#stringEN = `${this._left.toStringEn()} - (${this._right.toStringEn()})`;
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        if (this.#string != null) {
            return this.#string
        }
        const strLeft = this._left.priority <= this.priority
            ? `(${String(this._left)})`
            : String(this._left)
        const strRight = this._right.priority <= this.priority
            ? `(${String(this._right)})`
            : String(this._right)
        this.#string = `${strLeft} - ${strRight}`
        return this.#string
    }

    toStringEn() {
        if (this.#stringEN != null) {
            return this.#stringEN
        }
        this.#stringEN = `(${this._left.toStringEn()}) - (${this._right.toStringEn()})`
        return this.#stringEN
    }

    /** recherche les opérandes des add/minus enfants
     * @returns {[Array<Base>, Array<Base>]} les éléments en plus et les éléments en moins
     */
    childOperands() {
        const factorsLeft = this._left instanceof AddMinus
            ? this._left.childOperands()
            : [[this._left], []]
        const factorsRight = this._right instanceof AddMinus
            ? this._right.childOperands().reverse()
            : [[], [this._right]]
        return [
            factorsLeft[0].concat(factorsRight[0]),
            factorsLeft[1].concat(factorsRight[1])
        ]
    }
 
    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex() {
        let texLeft = this._left.toTex();
        let texRight = this._right.priority <= this.priority
            ? `\\left(${this._right.toTex()})`
            : this._right.toTex();
        return `${texLeft} - ${texRight}`;
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values) {
        let left = this._left.toDecimal(values);
        let right = this._right.toDecimal(values);
        return left.minus(right);
    }

    opposite() {
        return new Minus(this._right, this._left);
    }

    toDict() {
        return {
            type: "Minus",
            left: this._left.toDict(),
            right: this._right.toDict()
        }
    }

}

export { Add, Minus, AddMinus};
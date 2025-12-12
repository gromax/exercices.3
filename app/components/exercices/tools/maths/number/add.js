import { Base } from "./base";
import { Scalar } from "./scalar";
import Decimal from "decimal.js";

class AddMinus extends Base {
    _left; /** @type {Base} */
    _right; /** @type {Base} */

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
        return true;
    }

    childrenSignatures() {
        // récupère les sinatures des enfants
        const lefts = (this._left instanceof AddMinus)
            ? this._left.childrenSignatures()
            : [this._left.signature().join(',')];
        const rights = (this._right instanceof AddMinus)
            ? this._right.childrenSignatures()
            : [this._right.signature().join(',')];
        return [...lefts, ...rights];
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
}


class Add extends AddMinus {
    #string;

    /**
     * constructeur
     * @param {Base} left 
     * @param {Base} right 
     */
    constructor(left, right) {
        super(left, right);
        this.#string = `${String(this._left)} + ${String(this._right)}`;
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
        return this.#string;
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
}

class Minus extends AddMinus {
    #string;
    constructor(left, right) {
        super(left, right);
        const strLeft = String(this._left);
        const strRight = this._right.priority <= this.priority
            ? `(${String(this._right)})`
            : String(this._right);
        this.#string = `${strLeft} - ${strRight}`;
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        return this.#string;
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

    simplify() {
        const leftSim = this._left.simplify();
        const rightSim = this._right.simplify();
        if (leftSim.isZero()) {
            if (typeof rightSim.opposite === 'function') {
                return rightSim.opposite();
            }
        } 
        if (rightSim.isZero()) {
            return leftSim;
        }
        if (leftSim instanceof Scalar && rightSim instanceof Scalar) {
            let val = leftSim.toDecimal().minus(rightSim.toDecimal());
            return new Scalar(val);
        }
        return new this.constructor(leftSim, rightSim);
    }

    opposite() {
        return new Minus(this._right, this._left);
    }

}

export { Add, Minus};
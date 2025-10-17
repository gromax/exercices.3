import { Base } from "./base";
import { Scalar } from "./scalar";
import Decimal from "decimal.js";

class Mult extends Base {
    #left;
    #right;
    #items;
    /** @type {string|null} représentation texte */
    #string = null;

    /**
     * constructeur
     * @param {Base} left 
     * @param {Base} right 
     */
    constructor(left, right) {
        super();
        if (typeof left == "undefined") {
            throw new Error("left undefined");
        }
        if (typeof right == "undefined") {
            throw new Error("right undefined");
        }

        this.#left = left;
        this.#right = right;
        let items = [];
        if (left instanceof Mult) {
            items.push(...left.items());
        } else {
            items.push(left);
        }
        if (right instanceof Mult) {
            items.push(...right.items());
        } else {
            items.push(right);
        }
        this.#items = items;
    }

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

    items() {
        return [...this.#items];
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        if (this.#string == null) {
            let left = this.#left.priority < this.priority? `(${String(this.#left)})`:String(this.#left);
            let right = this.#right.priority < this.priority? `(${String(this.#right)})`:String(this.#right);
            this.#string = `${left} * ${right}`;
        }
        return this.#string;
    }

    get priority() {
        return 2;
    }

    get left() {
        return this.#left;
    }

    get right() {
        return this.#right;
    }

    /**
     * si un nom est précisé, renvoie true si le nœud dépend de la variable,
     * sinon renvoie la liste des variables dont dépend le noeud
     * @param {string|undefined} name 
     * @returns {boolean|Array}
     */
    isFunctionOf(name){
        if (typeof name == 'undefined') {
            return _.uniq(this.#left.isFunctionOf().concat(this.#right.isFunctionOf()));
        }
        return this.#left.isFunctionOf(name) || this.#right.isFunctionOf(name);
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex() {
        let texLeft = this.#left.priority < this.priority? `\\left(${this.#left.toTex()}\\right)`:this.#left.toTex();
        let texRight = this.#right.priority < this.priority? `\\left(${this.#right.toTex()}\\right)`:this.#right.toTex();
        return `${texLeft} \\cdot ${texRight}`;
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values) {
        let v = new Decimal(1);
        for (let item of this.#items) {
            v = v.mul(item.toDecimal(values));
        }
        return v;
    }
}


class Div extends Base {
    #left;
    #right;
    constructor(left, right) {
        super();
        this.#left = left;
        this.#right = right;
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        let left = String(this.#left);
        let right = this.#right.priority <= this.priority? `(${String(this.#right)})`:String(this.#right);
        return `${left} / ${right}`;
    }

    get priority() {
        return 2;
    }

    get left() {
        return this.#left;
    }

    get right() {
        return this.#right;
    }

    /**
     * si un nom est précisé, renvoie true si le nœud dépend de la variable,
     * sinon renvoie la liste des variables dont dépend le noeud
     * @param {string|undefined} name 
     * @returns {boolean|Array}
     */
    isFunctionOf(name){
        if (typeof name == 'undefined') {
            return _.uniq(this.#left.isFunctionOf().concat(this.#right.isFunctionOf()));
        }
        return this.#left.isFunctionOf(name) || this.#right.isFunctionOf(name);
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex() {
        let texLeft = this.#left.toTex();
        let texRight = this.#right.toTex();
        return `\\frac{${texLeft}}{${texRight}}`;
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values) {
        let left = this.#left.toDecimal(values);
        let right = this.#right.toDecimal(values);
        return left.dividedBy(right);
    }

}

export { Mult, Div};
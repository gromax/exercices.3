import { Base } from "./base";
import { Scalar } from "./scalar";

class Mult extends Base {
    #left;
    #right;
    #items;
    /** @type {string|null} représentation texte */
    #string = null;
    /** @type {Base|null} noeud sans les scalaires factorisables */
    #noScalar = null;
    /** @type {Scalar|nulll} scalaire factorisable */
    #scalar = null;

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
        this.#items = _.sortBy(items, function(item){ return item.noScalarString(); });
    }

    /**
     * 
     * @param {Array} operandes 
     * @returns {Mult, Scalar}
     */
    static fromList(operandes) {
        if (operandes.length == 0){
            return new Scalar(1);
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
     * calcule le poduit des scalaires
     * @returns {Scalar}
     */
    scalar() {
        if (this.#scalar) {
            return this.#scalar;
        }
        let scalars = _.filter(this.#items, function(item){ return item instanceof Scalar; });
        if (scalars.length == 0) {
            return Scalar.ONE;
        }
        let s = scalars.pop();
        for (let item of scalars) {
            s = s.multiply(item);
        }
        this.#scalar = s;
        return s;
    }

    /**
     * renvoie le noeud composé des éléments nons scalaires
     * @returns {Base}
     */
    noScalar() {
        if (this.#noScalar == null) {
            this.#noScalar = Mult.fromList(_.filter(this.#items, function(item){ return !(item instanceof Scalar); }));
        }
        return this.#noScalar;
    }

    /**
     * renvoie la chaîne dépourvue de scalaires pour identifier un groupe dans une somme
     * @returns {Base}
     */
    noScalarString() {
        return String(this.noScalar());
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
    tex() {
        let texLeft = this.#left.priority < this.priority? `\\left(${this.#left.tex()}\\right)`:this.#left.tex();
        let texRight = this.#right.priority < this.priority? `\\left(${this.#right.tex()}\\right)`:this.#right.tex();
        return `${texLeft} \\cdot ${texRight}`;
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
    tex() {
        let texLeft = this.#left.tex();
        let texRight = this.#right.tex();
        return `\\frac{${texLeft}}{${texRight}}`;
    }

}

export { Mult, Div};
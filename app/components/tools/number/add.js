import { Base } from "./base";
import { Scalar } from "./scalar";


class Add extends Base {
    #left;
    #right;
    #items;
    #str;

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

        this.#left = left;
        this.#right = right;
        let items = [];
        if (left instanceof Add) {
            items.push(...left.items);
        } else {
            items.push(left);
        }
        if (right instanceof Add) {
            items.push(...right.items);
        } else {
            items.push(right);
        }
        this.#items = _.sortBy(items, function(item){return item.noScalarString()});
        this.#str = `${String(this.#left)} + ${String(this.#right)}`;
    }

    /**
     * 
     * @param {Array} operandes 
     * @returns {Base}
     */
    static fromList(operandes) {
        operandes = _.filter(operandes, function(item){return (!(item instanceof Scalar) || !item.isZero())})
        if (operandes.length == 0){
            return new Scalar(0);
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

    get items() {
        return [...this.#items];
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        return this.#str;
    }

    get priority() {
        return 1;
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
        return `${texLeft} + ${texRight}`;
    }
}


class Minus extends Base {
    #left;
    #right;
    #string;
    constructor(left, right) {
        super();
        this.#left = left;
        this.#right = right;
        let strLeft = String(this.#left);
        let strRight = this.#right.priority <= this.priority? `(${String(this.#right)})`:String(this.#right);
        this.#string = `${strLeft} - ${strRight}`;
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        return this.#string;
    }

    get priority() {
        return 1;
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
        let texRight = this.#right.priority <= this.priority? `\\left(${this.#right.tex()})`:this.#right.tex();
        return `${texLeft} - ${texRight}`;
    }

}

export { Add, Minus};
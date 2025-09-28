import { Base } from "./base";


class Power extends Base {
    /** @type {Base} */
    #base;
    /** @type {Base} */
    #exposant;
    /** @type {string|null} */
    #string = null; 

    /**
     * constructeur
     * @param {Base} base 
     * @param {Base} exposant 
     */
    constructor(base, exposant) {
        super();
        if (!(base instanceof Base)) {
            throw new Error("base invalide");
        }
        if (!(exposant instanceof Base)) {
            throw new Error("exposant invalide");
        }
        this.#base = base;
        this.#exposant = exposant;
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        if (this.#string != null) {
            return this.#string;
        }
        let base = this.#base.priority <= this.priority? `(${String(this.#base)})`:String(this.#base);
        let exposant = this.#exposant.priority <= this.priority? `(${String(this.#exposant)})`:String(this.#exposant);
        this.#string = `${base} ^ ${exposant}`;
        return this.#string;
    }

    get priority() {
        return 3;
    }

    get base() {
        return this.#base;
    }

    get exposant() {
        return this.#exposant;
    }

    /**
     * si un nom est précisé, renvoie true si le nœud dépend de la variable,
     * sinon renvoie la liste des variables dont dépend le noeud
     * @param {string|undefined} name 
     * @returns {boolean|Array}
     */
    isFunctionOf(name){
        if (typeof name == 'undefined') {
            return _.uniq(this.#base.isFunctionOf().concat(this.#exposant.isFunctionOf()));
        }
        return this.#base.isFunctionOf(name) || this.#exposant.isFunctionOf(name);
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    tex() {
        let texBase = this.#base.priority <= this.priority? `\\left(${this.#base.tex()}\\right)`:this.#base.tex();
        let texExposant = this.#exposant.tex();
        return `${texBase}^{${texExposant}}`;
    }
}

export { Power }
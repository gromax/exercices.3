import { Base } from "./base";

class Symbol extends Base {
    #name; /** @type{string} */
    static REGEX = new RegExp("[a-zA-Z_\\x7f-\\xff][a-zA-Z0-9_\\x7f-\\xff]*", 'i');
    static #liste = {};

    constructor(name) {
        super();
        this.#name = name;
    }

    /**
     * tente la fabrication d'un Scalar à partir d'une chaine
     * @param {string} chaine 
     * @return {null, Symbol}
     */
    static fromString(chaine) {
        if (!Symbol.isSymbol(chaine)) {
            return null;
        }
        if (typeof this.#liste[chaine] == 'undefined') {
            this.#liste[chaine] = new Symbol(chaine);
        }
        return this.#liste[chaine];
    }

    /**
     * teste si la chaîne est bien d'un symbole
     * @param {string} chaine 
     * @returns {boolean}
     */
    static isSymbol(chaine) {
        return Symbol.REGEX.test(chaine);
    }    

    toString() {
        return this.#name;
    }

    get priority() {
        return 10;
    }

    /**
     * si un nom est précisé, renvoie true si le nœud dépend de la variable,
     * sinon renvoie la liste des variables dont dépend le noeud
     * @param {string|undefined} name 
     * @returns {boolean|Array}
     */
    isFunctionOf(name){
        if (typeof name == 'undefined') {
            return [this.#name];
        }
        return this.#name == name;
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    tex() {
        return this.#name;
    }
}

function makeSymbol(name) {
    return Symbol.fromString(name);
}

function isSymbol(name) {
    return Symbol.isSymbol(name);
}

export { makeSymbol, isSymbol };
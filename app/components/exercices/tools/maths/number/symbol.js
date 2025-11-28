import { Base } from "./base";
import Decimal from "decimal.js";

const GREEK_TO_TEX = {
    'alpha': '\\alpha',
    'beta': '\\beta',
    'gamma': '\\gamma',
    'delta': '\\delta',
    'epsilon': '\\epsilon',
    'zeta': '\\zeta',
    'eta': '\\eta',
    'theta': '\\theta',
    'iota': '\\iota',
    'kappa': '\\kappa',
    'lambda': '\\lambda',
    'mu': '\\mu',
    'nu': '\\nu',
    'xi': '\\xi',
    'omicron': '\\omicron',
    'pi': '\\pi',
    'rho': '\\rho',
    'sigma': '\\sigma',
    'tau': '\\tau',
    'upsilon': '\\upsilon',
    'phi': '\\phi',
    'chi': '\\chi',
    'psi': '\\psi',
    'omega': '\\omega',
    'Alpha': '\\Alpha',
    'Beta': '\\Beta',
    'Gamma': '\\Gamma',
    'Delta': '\\Delta',
    'Epsilon': '\\Epsilon',
    'Zeta': '\\Zeta',
    'Eta': '\\Eta',
    'Theta': '\\Theta',
    'Iota': '\\Iota',
    'Kappa': '\\Kappa',
    'Lambda': '\\Lambda',
    'Mu': '\\Mu',
    'Nu': '\\Nu',
    'Xi': '\\Xi',
    'Omicron': '\\Omicron',
    'Pi': '\\Pi',
    'Rho': '\\Rho',
    'Sigma': '\\Sigma',
    'Tau': '\\Tau',
    'Upsilon': '\\Upsilon',
    'Phi': '\\Phi',
    'Chi': '\\Chi',
    'Psi': '\\Psi',
    'Omega': '\\Omega'
}



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
    toTex() {
        if (this.#name in GREEK_TO_TEX) {
            return GREEK_TO_TEX[this.#name];
        }
        return this.#name;
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values) {
        let v = new Decimal(NaN);
        if ((typeof values !== 'undefined') && (values[this.#name] !== 'undefined')) {
            v = new Decimal(values[this.#name]);
        }
        return v;
    }

    signature() {
        return [this.#name];
    }
}

function makeSymbol(name) {
    return Symbol.fromString(name);
}

function isSymbol(name) {
    return Symbol.isSymbol(name);
}

export { makeSymbol, isSymbol };
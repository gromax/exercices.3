import { Base } from "./base";
import Decimal from "decimal.js";

class Constant extends Base {
    static NAMES = ['e', 'i', 'pi', 'π']
    static TEX = {
        'e': 'e',
        'π': '\\pi',
        'i': 'i',
    }
    static #list = {};
    #name; /** @type{string} */
    constructor(name) {
        super();
        if (!Constant.isConstant(name)) {
            throw new Error(`${name} n'est pas une constante valide.`)
        }
        this.#name = name;
    }

    static alias(name){
        switch(name) {
            case 'infini': return '∞';
            case 'pi': return 'π';
            default: return name;
        }
    }

    /**
     * tente la fabrication d'un Constant à partir d'une chaine
     * @param {string} chaine 
     * @return {null, Constant}
     */
    static fromString(chaine) {
        if (!Constant.isConstant(chaine)) {
            return null;
        }
        let name = this.alias(chaine);
        if (typeof this.#list[name] == 'undefined') {
            this.#list[name] = new Constant(name);
        }
        return this.#list[name];
    }

    /**
     * teste si la chaîne est bien d'une constante
     * @param {string} chaine 
     * @returns {boolean}
     */
    static isConstant(chaine) {
        return (Constant.NAMES.indexOf(chaine)>=0);
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        return this.#name;
    }

    get priority() {
        return 10;
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex() {
        return Constant.TEX[this.#name];
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values) {
        switch (this.#name) {
            case 'e': return Decimal.exp(1);
            case 'π': return Decimal.PI;
            case 'i': return Decimal.I;
            case '∞': return Decimal.INFINITY;
            default: return Decimal.NAN;
        }
    }
}

const E = Constant.fromString('e');
const PI = Constant.fromString('pi');
const I = Constant.fromString('i');
const INFINI = Constant.fromString('infini');

function isConstant(name){
    return Constant.isConstant(name);
}

function makeConstant(name){
    return Constant.fromString(name);
}

export { makeConstant, isConstant, E, PI, I, INFINI };
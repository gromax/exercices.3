import { Base } from "./base"
import { Scalar } from "./scalar"
import { Signature } from "./signature"
import Decimal from "decimal.js"

class Constant extends Base {
    static NAMES = ['e', 'i', 'pi', 'π', '∞', 'inf', 'infinity', 'infini']
    static TEX = {
        'e': 'e',
        'π': '\\pi',
        'i': 'i',
        '∞': '\\infty'
    }
    
    static #list = {};

    #name; /** @type{string} */

    constructor(name) {
        super()
        if (!Constant.isConstant(name)) {
            throw new Error(`${name} n'est pas une constante valide.`)
        }
        this.#name = name
    }

    static alias(name){
        switch(name) {
            case 'inf': return '∞'
            case 'infinity': return '∞'
            case 'infini': return '∞'
            case 'pi': return 'π'
            default: return name
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
        const name = this.alias(chaine);
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
        return Constant.NAMES.includes(chaine)
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        return this.#name
    }

    get isNumber() {
        return true
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
            case 'π': return Decimal.acos(-1);
            case 'i': return Decimal.I;
            case '∞': return new Decimal(Infinity);
            default: return new Decimal(NaN) ;
        }
    }

    toFixed(n) {
        return new Scalar(this.toDecimal().toFixed(n))
    }

    toDict() {
        return {
            type: "Constant",
            name: this.#name
        }
    }

    signature() {
        return new Signature({[this.#name]:1})
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
    return Constant.fromString(name)
}

function isTypeConstant(obj){
    return obj instanceof Constant;
}

export { makeConstant, isConstant, isTypeConstant, E, PI, I, INFINI }
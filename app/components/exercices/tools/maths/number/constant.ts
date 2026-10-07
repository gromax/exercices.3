import { Base } from "./base"
import { Scalar } from "./scalar"
import { Signature } from "./signature"
import Decimal from "decimal.js"
import { NestedString } from '@types'
class Constant extends Base {
    static readonly NAMES = ['e', 'pi', 'π', '∞', '-inf', '-∞', 'infinity', 'inf', 'infini', '𝐢', 'NaN', 'nan']
    static readonly TEX = {
        'e': 'e',
        'π': '\\pi',
        '𝐢': '\\mathrm{i}',
        '∞': '\\infty',
        '-∞': '-\\infty',
        'NaN': '\\mathrm{NaN}'
    }
    
    private static _list:Record<string, Constant> = {}

    private _name:string /** @type{string} */

    private constructor(name:string) {
        super()
        if (!Constant.isConstant(name)) {
            throw new Error(`${name} n'est pas une constante valide.`)
        }
        this._name = name
    }

    static alias(name:string):string {
        switch(name) {
            case 'inf': return '∞'
            case 'infinity': return '∞'
            case 'infini': return '∞'
            case 'pi': return 'π'
            case 'nan': return 'NaN'
            default: return name
        }
    }

    /**
     * tente la fabrication d'un Constant à partir d'une chaine
     * @param {string} chaine 
     * @return {null, Constant}
     */
    static fromString(chaine:string): Constant | null {
        if (!Constant.isConstant(chaine)) {
            return null;
        }
        const name = this.alias(chaine);
        if (typeof Constant._list[name] == 'undefined') {
            Constant._list[name] = new Constant(name)
        }
        return Constant._list[name]
    }

    /**
     * teste si la chaîne est bien d'une constante
     * @param {string} chaine 
     * @returns {boolean}
     */
    static isConstant(chaine:string):boolean {
        return Constant.NAMES.includes(chaine)
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString():string {
        return this._name
    }

    toStringEn():string {
        switch(this._name) {
            case '∞': return 'infinity'
            case '-∞': return '-infinity'
            case 'π': return 'pi'
            default: return this._name
        }
    }

    get isNumber():boolean {
        return true
    }

    get priority():number {
        return 10;
    }

    get scalarFactor():Scalar {
        return Scalar.ONE
    }

    subVariables(): NestedString {
        return []
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex():string {
        return Constant.TEX[this._name];
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values:Record<string, Decimal|string|number>|undefined):Decimal {
        switch (this._name) {
            case 'e': return Decimal.exp(1)
            case 'π': return Decimal.acos(-1)
            case '∞': return new Decimal(Infinity)
            case '-∞': return new Decimal(-Infinity)
            default: return new Decimal(NaN)
        }
    }

    toFixed(n:number):Scalar {
        return new Scalar(this.toDecimal(undefined).toFixed(n))
    }

    toDict():object {
        return {
            type: "Constant",
            name: this._name
        }
    }

    signature():Signature {
        return new Signature({[this._name]:1})
    }

    /**
     * renvoie la dérivée
     * @param {string} varName 
     * @returns {Base}
     */
    derivate(varName:string):Base {
        // implémentation spécifique pour Constant
        return Scalar.ZERO
    }

    /**
     * prédicat : le noeud est-il l'infini positif ?
     * @returns {boolean} true si le noeud représente l'infini positif, false sinon
     */
    isPlusInfinity():boolean {
        return this._name === '∞'
    }

    /**
     * prédicat : le noeud est-il l'infini négatif ?
     * @returns {boolean} true si le noeud représente l'infini négatif, false sinon
     */
    isMinusInfinity():boolean {
        return this._name === '-∞'
    }

    /**
     * prédicat : le noeud est-il NaN ?
     * @returns {boolean} true si le noeud représente NaN, false sinon
     */
    isNaN():boolean {
        return this._name === 'NaN'
    }

}

const E = Constant.fromString('e')
const PI = Constant.fromString('pi')
const INFINI = Constant.fromString('infini')
const MINUS_INFINI = Constant.fromString('-∞')
const NAN = Constant.fromString('NaN')
const I = Constant.fromString('𝐢')

export { Constant, E, PI, INFINI, MINUS_INFINI, NAN, I }
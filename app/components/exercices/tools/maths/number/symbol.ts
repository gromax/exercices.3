import { Base } from "./base"
import { Scalar } from "./scalar"
import { Signature } from "./signature"
import Decimal from "decimal.js"

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
    private _name:string /** @type{string} */
    static readonly REGEX = new RegExp("[a-zA-Z_\\x7f-\\xff][a-zA-Z0-9_\\x7f-\\xff]*", 'i')
    
    // la liste permet de garantir l'unicité des Symbol
    private static _liste:Record<string, Symbol> = {}

    private constructor(name:string) {
        super()
        this._name = name
    }

    /**
     * tente la fabrication d'un Scalar à partir d'une chaine
     * @param {string} chaine 
     * @return {null, Symbol}
     */
    static fromString(chaine:string): Symbol | null {
        if (!Symbol.isSymbol(chaine)) {
            return null;
        }
        if (typeof this._liste[chaine] == 'undefined') {
            this._liste[chaine] = new Symbol(chaine);
        }
        return this._liste[chaine];
    }

    /**
     * teste si la chaîne est bien d'un symbole
     * @param {string} chaine 
     * @returns {boolean}
     */
    static isSymbol(chaine:string):boolean {
        return Symbol.REGEX.test(chaine)
    }    

    toString():string {
        return this._name
    }

    get priority():number {
        return 10
    }

    get scalarFactor():Scalar {
        return Scalar.ONE
    }

    /**
     * si un nom est précisé, renvoie true si le nœud dépend de la variable,
     * sinon renvoie la liste des variables dont dépend le noeud
     * @param {string|undefined} name 
     * @returns {boolean|Array}
     */
    isFunctionOf(name:string|undefined):boolean|Array<string> {
        if (typeof name === 'undefined') {
            return [this._name];
        }
        return this._name === name;
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex():string {
        if (this._name in GREEK_TO_TEX) {
            return GREEK_TO_TEX[this._name];
        }
        return this._name;
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values:Record<string, Decimal|string|number>):Decimal {
        return ((typeof values !== 'undefined') && (values[this._name] !== 'undefined'))
            ? new Decimal(values[this._name])
            : new Decimal(NaN)
    }

    signature():Signature {
        return new Signature({[this._name]:1})
    }

    substituteVariable(varName:string, value:Base|string|Decimal|number):Base {
        if (this._name === varName) {
            if (value instanceof Base) {
                return value
            } else {
                return new Scalar(value)
            }
        }
        return this
    }

    substituteVariables(substitions:Record<string, Base|string|Decimal|number>):Base {
        if (this._name in substitions) {
            return this.substituteVariable(this._name, substitions[this._name])
        }
        return this
    }

    toDict():object {
        return {
            type: "Symbol",
            name: this._name
        }
    }
}

export { Symbol }
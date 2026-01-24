import Decimal from 'decimal.js'
import { Signature } from './signature'
import { Scalar } from './scalar'
Decimal.set({ precision: 50, rounding: Decimal.ROUND_HALF_UP });

abstract class Base {
    /**
     * transtypage vers string
     * @returns {string}
     */
    toString():string {
        return "(?)";
    }

    /**
     * transtypage vers string version anglaise
     */
    toStringEn():string {
        return this.toString();
    }

    get isNumber():boolean {
        return false
    }

    /**
     * priorité
     */
    get priority():number {
        return 0;
    }

    abstract get scalarFactor():Scalar

    get withoutScalarFactor():Base {
        return this
    }

    /**
     * prédicat : le noeud peut-il être distribué ?
     * @return {boolean}
     */
    get canBeDistributed():boolean {
        return false
    }

    /**
     * prédicat : le noeud commence-t-il par un signe moins ?
     * @returns {boolean}
     */
    get startsWithMinus():boolean {
        return false
    }

    /**
     * si un nom est précisé, renvoie true si le nœud dépend de la variable,
     * sinon renvoie la liste des variables dont dépend le noeud
     * @param {string|undefined} name 
     * @returns {boolean|Array}
     */
    isFunctionOf(name:string|undefined):boolean|Array<string> {
        if (typeof name == 'undefined') {
            return []
        }
        return false
    }

    /**
     * Test simple qui vérifie qu'au moins les calcul type
     * nombre + nombre ou nombre * nombre son développés
     * @returns {boolean}
     */
    isExpanded():boolean {
        return true;
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex():string {
        return "(?)"
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values:Record<string, Decimal|string|number>|undefined):Decimal {
        return new Decimal(NaN);
    }

    /**
     * renvoie une signature, c'est à dire un objet avec un facteur scalair
     * et un texte représentant le contenu
     * @returns {Signature}
     */
    signature():Signature {
        return new Signature(
            {
                [this.toString()]: 1
            }
        )
    }

    /**
     * prédicat : le noeud est-il nul ?
     * @returns {boolean}
     */
    isZero():boolean {
        const d = this.toDecimal(undefined)
        return d.equals(0)
    }

    /**
     * prédicat : le noeud est-il égal à 1 ?
     * @returns {boolean}
     */
    isOne():boolean {
        return false;
    }

    /**
     * crée un clone avec la variable substituée par la valeur donnée
     * @param {string} varName 
     * @param {Base|number} value 
     * @returns {Base}
     */
    substituteVariable(varName:string, value:Base|string|Decimal|number):Base {
        return this;
    }

    /**
     * substitue d'un coup plusieurs variables
     * @param {object} substitutions de forme {varName: Base|number, ...}
     * @returns {Base}
     */
    substituteVariables(substitutions:Record<string, Base|string|Decimal|number>):Base {
        return this;
    }

    /**
     * construit une fonction à partir du noeud
     * @param {Array<string>|undefined} order ordre des variables
     * @returns {Function}
     */
    buildFunction(order:Array<string>|undefined):(...args:any)=>number {
        const _order = typeof order === 'undefined'
            ? this.isFunctionOf(undefined) as Array<string>
            : order
        const self = this
        return function(...args) {
            let values = {}
            for (let i = 0; i < _order.length; i++) {
                values[_order[i]] = args[i];
            }
            return self.substituteVariables(values).toDecimal(values).toNumber()
        }
    }

    /**
     * Transforme to les décimaux en une version fixée à n chiffres
     * @param {number} n 
     * @returns {Base}
     */
    toFixed(n:number):Base {
        return this
    }

    /**
     * renvoie une version dictionnaire du noeud
     */
    toDict():object {
        return { type: "Base" }
    }
}

export { Base }
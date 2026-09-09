import _ from "underscore"
import { Base } from "./base"
import { Scalar } from "./scalar"
import Decimal from "decimal.js"
import { NestedString } from '@types'

class Collection extends Base {
    private _children:Array<Base> /** @type {Base[]} */
    /** @type {string|undefined} représentation texte */
    private _string:string|undefined
    /** @type {string|undefined} représentation texte version anglaise */
    private _stringEN:string|undefined
    /** @type {string|undefined} représentation tex */
    private _stringTex:string|undefined

    /**
     * Crée une collection à partir d'une liste d'opérandes.
     * @param operandes La liste des opérandes à inclure dans la collection
     * @returns Une instance de Collection contenant les opérandes fournis
     */
    static collectionFromList(operandes:Array<Base>):Base {
        if (operandes.length == 0){
            return Scalar.ZERO
        }
        if (operandes.length == 1) {
            return operandes[0]
        }
        if (!operandes.every( item => item instanceof Base)) {
            throw new Error('Tous les éléments de la liste doivent être des instances de Base')
        }
        // Il faut applatir des enfants qui sont aussi des Collection
        const flat_operandes = _.flatten(
            operandes.map(
                item => (item instanceof Collection)
                    ? item.children
                    : item
            )
        )
        return new Collection(flat_operandes)
    }

    /**
     * constructeur
     * @param {Base[]} children 
     */
    constructor(children:Array<Base>) {
        super()
        this._children = children.flatMap(
            item => (item instanceof Collection)
                ? item.children
                : item
        )
    }

    /**
     * accesseurs
     */
    get children(): Array<Base> {
        return [...this._children]
    }

    get scalarFactor():Scalar {
        return Scalar.ONE
    }

    subVariables(): NestedString {
        return this._children.map( c => c.subVariables() ).flat()
    }

    /**
     * prédicat : le noeud est-il développé
     * @returns {boolean}
     */
    isExpanded():boolean {
        for (let item of this._children) {
            if (!item.isExpanded()) {
                return false;
            }
        }
        const scalars = this._children.filter( (item) => item instanceof Scalar )
        if (scalars.length > 1) {
            return false
        }
        if (scalars.length == 1 && scalars[0].isZero()) {
            return false
        }
        // vérifie s'il existe des signatures semblables
        const childrenSignatures = this._children.map(c => c.signature().toString())
        if (new Set(childrenSignatures).size < childrenSignatures.length) {
            return false;
        }
        return true;
    }

    /**
     * Produit une copie de l'objet en substituant la variable spécifiée
     * @param {string} varName le nom de la variable à substituer
     * @param {Base|string|Decimal|number} value la valeur à substituer à la variable
     * @returns {Base} le nouveau noeud après substitution
     */
    substituteVariable(varName:string, value:Base|string|Decimal|number):Base {
        const children = this._children.map( c => c.substituteVariable(varName, value) )
        if (children.every( (c, i) => c === this._children[i] )) {
            // pas de changement
            return this
        }
        return new Collection(children)
    }

    /**
     * Produit une copie de l'objet en substituant plusieurs variables
     * @param {Record<string, Base|string|Decimal|number>} substitutions un objet contenant les substitutions à effectuer
     * @returns {Base} le nouveau noeud après substitution
     */
    substituteVariables(substitutions:Record<string, Base|string|Decimal|number>):Base {
        const children = this._children.map( c => c.substituteVariables(substitutions) )
        if (children.every( (c, i) => c === this._children[i] )) {
            // pas de changement
            return this
        }
        return new Collection(children)
    }

    /**
     * Produit une copie de l'objet en arrondissant chaque enfant à un nombre fixe de décimales
     * @param {number} n le nombre de décimales
     * @returns {Base} le nouveau noeud après arrondi
     */
    toFixed(n:number):Base {
        const children = this._children.map( c => c.toFixed(n) )
        return new Collection(children)
    }

    /**
     * Convertit l'objet en dictionnaire
     * @returns {object} la représentation en dictionnaire de l'objet
     */
    toDict():object {
        return {
            type: "Collection",
            children: this._children.map( c => c.toDict() )
        }
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString():string {
        if (!this._string) {
            this._string = this._toStringHelper('fr')
        }
        return this._string
    }

    /**
     * transtypage -> string en anglais
     * @returns {string}
     */
    toStringEn():string {
        if (!this._stringEN) {
            this._stringEN = this._toStringHelper('en')
        }
        return this._stringEN
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex():string {
        if (!this._stringTex) {
            this._stringTex = this._toStringHelper('tex')
        }
        return this._stringTex
    }

    /**
     * Génère une représentation en chaîne de caractères de l'objet selon la langue spécifiée
     * @param {string} lang la langue ('fr', 'en', 'tex')
     * @returns {string} la représentation en chaîne de caractères
     */
    private _toStringHelper(lang:string):string {
        const subStrings = this._children.map( c => {
            if (lang === 'en') {
                return c.toStringEn()
            } else if (lang === 'tex') {
                return c.toTex()
            } else {
                return c.toString()
            }
        })
        if (lang === 'en') {
            return `(${subStrings.join(',')})`
        } else if (lang === 'tex') {
            return `\\left(${subStrings.join('\\,;')} \\right)`
        } else {
            return subStrings.join(' ; ')
        }
    }

    /**
     * renvoie la dérivée
     * @param {string} varName 
     * @returns {Base}
     */
    derivate(varName:string):Base {
        // implémentation spécifique pour Collection
        return new Collection(
            this._children.map( c => c.derivate(varName) )
        )
    }
}

export { Collection }

import _ from "underscore"
import { Base } from "./base"
import { Scalar } from "./scalar"
import Decimal from "decimal.js"

class AddMinus extends Base {
    private _children:Array<Base> /** @type {Base[]} */
    private _positive:Array<boolean> /** @type {boolean[]} */
    /** @type {string|undefined} représentation texte */
    private _string:string|undefined
    /** @type {string|undefined} représentation texte version anglaise */
    private _stringEN:string|undefined
    /** @type {string|undefined} représentation tex */
    private _stringTex:string|undefined

    static addFromList(operandes:Array<Base>):Base {
        if (operandes.length == 0){
            return Scalar.ZERO
        }
        if (operandes.length == 1) {
            return operandes[0]
        }
        if (!operandes.every( item => item instanceof Base)) {
            throw new Error('Tous les éléments de la liste doivent être des instances de Base')
        }
        // Il faut applatir des enfants qui sont aussi des AddMinus
        const flat_operandes = _.flatten( operandes.map( item => (item instanceof AddMinus) ? item.children : item) )
        const positive = _.flatten( operandes.map( item => (item instanceof AddMinus) ? item.positive : true) )
        // il faut absorber les moins de certains opérandes
        for (let i=0; i<flat_operandes.length; i++) {
            const item = flat_operandes[i]
            if (item.startsWithMinus && typeof (item as any).opposite === 'function') {
                positive[i] = !positive[i]
                flat_operandes[i] = (item as any).opposite()
            }
        }
        return new AddMinus(flat_operandes, positive)
    }

    /**
     * Crée une somme à partir d'une liste d'opérandes et d'une liste de signes
     * @param {Base[]} operandes 
     * @param {boolean[]} positive 
     * @returns {Base}
     */
    static fromList(operandes:Array<Base>, positive:Array<boolean>):Base {
        if (operandes.length !== positive.length) {
            throw new Error('operandes et positive doivent avoir la même longueur')
        }
        if (!operandes.every( item => item instanceof Base)) {
            throw new Error('Tous les éléments de la liste doivent être des instances de Base')
        }
        if (!positive.every( item => typeof item === 'boolean')) {
            throw new Error('Tous les éléments de positive doivent être des booléens')
        }
        if (operandes.length == 0){
            return Scalar.ZERO;
        }
        if (operandes.length == 1) {
            if (positive[0]) {
                return operandes[0]
            } else if (typeof (operandes[0] as any).opposite === 'function') {
                return (operandes[0] as any).opposite()
            }
        }
        // Il faut applatir des enfants qui sont aussi des AddMinus
        const flat_operandes = _.flatten( operandes.map( item => (item instanceof AddMinus) ? item.children : item) )
        const flat_positive = []
        for (let i=0; i<operandes.length; i++) {
            const item = operandes[i]
            const p = positive[i]
            if (!(item instanceof AddMinus)) {
                flat_positive.push(p)
            } else {
                const child_positive = item.positive
                for (let j=0; j<child_positive.length; j++) {
                    flat_positive.push( p ? child_positive[j] : !child_positive[j] )
                }
            }
        }
        // enfin il faut absorber les moins de certains opérandes
        for (let i=0; i<flat_operandes.length; i++) {
            const item = flat_operandes[i]
            if (item.startsWithMinus && typeof (item as any).opposite === 'function') {
                flat_positive[i] = !flat_positive[i]
                flat_operandes[i] = (item as any).opposite()
            }
        }
        return new AddMinus(flat_operandes, flat_positive)
    }

    static add(left:Base, right:Base):AddMinus {
        let children:Array<Base>, positive:Array<boolean>
        if (!(left instanceof Base) || !(right instanceof Base)) {
            throw new Error('Les deux arguments doivent être des instances de Base')
        }
        if (left instanceof AddMinus) {
            children = left._children
            positive = left._positive
        } else {
            children = [left]
            positive = [true]
        }
        if (right instanceof AddMinus) {
            children = [...children, ...right._children]
            positive = [...positive, ...right._positive]
        } else {
            children.push(right)
            positive.push(true)
        }
        return new AddMinus(children, positive)
    }

    static minus(left:Base, right:Base):AddMinus {
        let children:Array<Base>, positive:Array<boolean>
        if (!(left instanceof Base) || !(right instanceof Base)) {
            throw new Error('Les deux arguments doivent être des instances de Base')
        }
        if (left instanceof AddMinus) {
            children = left._children
            positive = left._positive
        } else {
            children = [left]
            positive = [true]
        }
        if (right instanceof AddMinus) {
            children = [...children, ...right._children]
            positive = [...positive, ...right._positive.map( p => !p)]
        } else {
            children.push(right)
            positive.push(false)
        }
        return new AddMinus(children, positive)
    }

    /**
     * constructeur
     * @param {Base[]} children 
     * @param {boolean[]} positive
     */
    constructor(children:Array<Base>, positive:Array<boolean>) {
        super()
        this._children = children
        this._positive = positive
    }

    /**
     * accesseurs
     */
    get children(): Array<Base> {
        return [...this._children]
    }

    get positive():Array<boolean> {
        return [...this._positive]
    }

    get priority(): number {
        return 1;
    }

    get canBeDistributed():boolean {
        return true
    }

    get scalarFactor():Scalar {
        return Scalar.ONE
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
     * si un nom est précisé, renvoie true si le nœud dépend de la variable,
     * sinon renvoie la liste des variables dont dépend le noeud
     * @param {string|undefined} name 
     * @returns {boolean|Array}
     */
    isFunctionOf(name:string|undefined): boolean|Array<string> {
        if (typeof name == 'undefined') {
            return _.uniq(_.flatten(this._children.map( c => c.isFunctionOf(undefined) as Array<string> ))).sort()
        }
        for (let item of this._children) {
            if (item.isFunctionOf(name)) {
                return true
            }
        }
        return false
    }

    substituteVariable(varName:string, value:Base|string|Decimal|number):Base {
        const children = this._children.map( c => c.substituteVariable(varName, value) )
        if (children.every( (c, i) => c === this._children[i] )) {
            // pas de changement
            return this
        }
        return new AddMinus(children, this._positive)
    }

    substituteVariables(substitutions:Record<string, Base|string|Decimal|number>):Base {
        const children = this._children.map( c => c.substituteVariables(substitutions) )
        if (children.every( (c, i) => c === this._children[i] )) {
            // pas de changement
            return this
        }
        return new AddMinus(children, this._positive)
    }

    toFixed(n:number):Base {
        const children = this._children.map( c => c.toFixed(n) )
        return new AddMinus(children, this._positive)
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values:Record<string, Decimal|string|number>|undefined):Decimal {
        const children = this._children.map( c => c.toDecimal(values) )
        let acc = new Decimal(0)
        for (let i=0; i<children.length; i++) {
            if (this._positive[i]) {
                acc = acc.plus( children[i] )
            } else {
                acc = acc.minus( children[i] )
            }
        }
        return acc
    }

    opposite():Base {
        const newPositive = this._positive.map( p => !p )
        return new AddMinus(this._children, newPositive)
    }

    toDict():object {
        return {
            type: "AddMinus",
            children: this._children.map( c => c.toDict() ),
            signs: this._positive.map( p => p ? '+' : '-' ),
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

    private _toStringHelper(lang) {
        let result = ''
        for (let i=0; i<this._children.length; i++) {
            const child = this._children[i]
            let childStr:string
            if (lang === 'en') {
                childStr = child.toStringEn()
            } else if (lang === 'tex') {
                childStr = child.toTex()
            } else {
                childStr = String(child)
            }
            const sign = this._positive[i] ? '+' : '-'
            if (child.startsWithMinus) {
                // ne devrait pas arriver
                // puisque le signe - de l'enfant a déjà été absorbé
                if (lang === 'tex') {
                    childStr = `\\left(${childStr}\\right)`
                } else {
                    childStr = `(${childStr})`
                }
            }
            if (i !== 0 || sign === '-') {
                result += ` ${sign} ${childStr}`
            } else {
                result += `${childStr}`
            }
        }
        return result
    }
}

export { AddMinus};
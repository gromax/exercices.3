import { Base } from "./base";
import { Scalar } from "./scalar";
import Decimal from "decimal.js";

// Constante privée
// sert à empêcher l'accès direct au constructeur
const PRIVATE = Symbol('private');

class AddMinus extends Base {
    #children; /** @type {Base[]} */
    #positive; /** @type {boolean[]} */
    /** @type {string|undefined} représentation texte */
    #string;
    /** @type {string|undefined} représentation texte version anglaise */
    #stringEN;
    /** @type {string|undefined} représentation tex */
    #stringTex;

    static addFromList(operandes) {
        if (operandes.length == 0){
            return Scalar.ZERO;
        }
        if (operandes.length == 1) {
            return operandes[0];
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
            if (item.startsWithMinus && typeof item.opposite === 'function') {
                positive[i] = !positive[i]
                flat_operandes[i] = item.opposite()
            }
        }
        return new AddMinus(PRIVATE, flat_operandes, positive)
    }

    /**
     * Crée une somme à partir d'une liste d'opérandes et d'une liste de signes
     * @param {Base[]} operandes 
     * @param {boolean[]} positive 
     * @returns {AddMinus}
     */
    static fromList(operandes, positive) {
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
            } else if (typeof operandes[0].opposite === 'function') {
                return operandes[0].opposite()
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
            if (item.startsWithMinus && typeof item.opposite === 'function') {
                flat_positive[i] = !flat_positive[i]
                flat_operandes[i] = item.opposite()
            }
        }
        return new AddMinus(PRIVATE, flat_operandes, flat_positive)
    }

    static add(left, right) {
        let children, positive
        if (!(left instanceof Base) || !(right instanceof Base)) {
            throw new Error('Les deux arguments doivent être des instances de Base')
        }
        if (left instanceof AddMinus) {
            children = left.#children
            positive = left.#positive
        } else {
            children = [left]
            positive = [true]
        }
        if (right instanceof AddMinus) {
            children = [...children, ...right.#children]
            positive = [...positive, ...right.#positive]
        } else {
            children.push(right)
            positive.push(true)
        }
        return new AddMinus(PRIVATE, children, positive)
    }

    static minus(left, right) {
        let children, positive
        if (!(left instanceof Base) || !(right instanceof Base)) {
            throw new Error('Les deux arguments doivent être des instances de Base')
        }
        if (left instanceof AddMinus) {
            children = left.#children
            positive = left.#positive
        } else {
            children = [left]
            positive = [true]
        }
        if (right instanceof AddMinus) {
            children = [...children, ...right.#children]
            positive = [...positive, ...right.#positive.map( p => !p)]
        } else {
            children.push(right)
            positive.push(false)
        }
        return new AddMinus(PRIVATE, children, positive)
    }

    /**
     * constructeur
     * @param {symbol} token
     * @param {Base[]} children 
     * @param {boolean[]} positive
     */
    constructor(token, children, positive) {
        if (token !== PRIVATE) {
            throw new Error('Utilisez AddMinus.add ou AddMinus.minus pour créer une instance')
        }
        super()
        this.#children = children
        this.#positive = positive
    }

    /**
     * accesseurs
     */
    get children() {
        return [...this.#children]
    }

    get positive() {
        return [...this.#positive]
    }

    get priority() {
        return 1;
    }

    get canBeDistributed() {
        return true
    }

    /**
     * prédicat : le noeud est-il développé
     * @returns {boolean}
     */
    isExpanded() {
        for (let item of this.#children) {
            if (!item.isExpanded()) {
                return false;
            }
        }
        const scalars = this.#children.filter( (item) => item instanceof Scalar )
        if (scalars.length > 1) {
            return false
        }
        if (scalars.length == 1 && scalars[0].isZero()) {
            return false
        }
        // vérifie s'il existe des signatures semblables
        const childrenSignatures = this.#children.map(c => c.signature().toString())
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
    isFunctionOf(name){
        if (typeof name == 'undefined') {
            return _.uniq(_.flatten(this.#children.map( c => c.isFunctionOf() ))).sort()
        }
        for (let item of this.#children) {
            if (item.isFunctionOf(name)) {
                return true
            }
        }
        return false
    }

    substituteVariable(varName, value) {
        const children = this.#children.map( c => c.substituteVariable(varName, value) )
        if (children.every( (c, i) => c === this.#children[i] )) {
            // pas de changement
            return this
        }
        return new AddMinus(PRIVATE, children, this.#positive)
    }

    substituteVariables(values) {
        const children = this.#children.map( c => c.substituteVariable(varName, value) )
        if (children.every( (c, i) => c === this.#children[i] )) {
            // pas de changement
            return this
        }
        return new AddMinus(PRIVATE, children, this.#positive)
    }

    toFixed(n) {
        const children = this.#children.map( c => c.toFixed(n) )
        return new AddMinus(PRIVATE, children, this.#positive)
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values) {
        const children = this.#children.map( c => c.toDecimal(values) )
        let acc = new Decimal(0)
        for (let i=0; i<children.length; i++) {
            if (this.#positive[i]) {
                acc = acc.plus( children[i] )
            } else {
                acc = acc.minus( children[i] )
            }
        }
        return acc
    }

    opposite() {
        const newPositive = this.#positive.map( p => !p )
        return new AddMinus(PRIVATE, this.#children, newPositive)
    }

    toDict() {
        return {
            type: "AddMinus",
            children: this.#children.map( c => c.toDict() ),
            signs: this.#positive.map( p => p ? '+' : '-' ),
        }
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        if (!this.#string) {
            this.#string = this.#toStringHelper('fr')
        }
        return this.#string
    }

    toStringEn() {
        if (!this.#stringEN) {
            this.#stringEN = this.#toStringHelper('en')
        }
        return this.#stringEN
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex() {
        if (!this.#stringTex) {
            this.#stringTex = this.#toStringHelper('tex')
        }
        return this.#stringTex
    }

    #toStringHelper(lang) {
        let result = ''
        for (let i=0; i<this.#children.length; i++) {
            const child = this.#children[i]
            let childStr
            if (lang === 'en') {
                childStr = child.toStringEn()
            } else if (lang === 'tex') {
                childStr = child.toTex()
            } else {
                childStr = String(child)
            }
            const sign = this.#positive[i] ? '+' : '-'
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
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

    _canBeDistributed = true

    static addFromList(operandes) {
        operandes = _.filter(operandes, function(item){return (!(item instanceof Scalar) || !item.isZero())})
        if (operandes.length == 0){
            return Scalar.ZERO;
        }
        if (operandes.length == 1) {
            return operandes[0];
        }
        let n = operandes.length;
        if (!operandes.every( item => item instanceof Base)) {
            throw new Error('Tous les éléments de la liste doivent être des instances de Base')
        }
        return new AddMinus(PRIVATE, operandes, new Array(operandes.length).fill(true))
    }

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
        return new AddMinus(PRIVATE, [...operandes], [...positive])
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
            return false;
        }
        const c = this.childrenSignatures();
        if (new Set(c).size < c.length) {
            return false;
        }
        if (c.includes('0')) {
            return false;
        }
        return true;
    }

    childrenSignatures() {
        // récupère les enfants pris dans un +/-
        return this.#children.map(
            (child) => {
                const s = child.signature()
                if (Array.isArray(s)) {
                    return s.map( c => `(${c.text})^${c.exponent}` ).join('*')
                } else {
                    return `(${s.text})^${s.exponent}`
                }
            }
        )
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

    simplify() {
        const childrenSim = this.#children.map( c => c.simplify() )
        const children = []
        const positive = []
        for (let i=0; i<childrenSim.length; i++) {
            const child = childrenSim[i]
            if (child instanceof Scalar) {
                if (child.isZero()) {
                    // on ignore
                    continue
                }
                // on ajoute au début
                children.unshift(child)
                positive.unshift(this.#positive[i])
            } else {
                // on ajoute à la fin
                children.push(child)
                positive.push(this.#positive[i])
            }
        }
        // on réduit les scalaires au début
        while (children.length >= 2 && children[0] instanceof Scalar && children[1] instanceof Scalar) {
            let val1 = children.shift()
            let pos1 = positive.shift()
            let val2 = children.shift()
            let pos2 = positive.shift()
            let newVal
            if (pos1 === pos2) {
                newVal = new Scalar(val1.toDecimal().plus(val2.toDecimal()))
            } else {
                newVal = new Scalar(val1.toDecimal().minus(val2.toDecimal()))
            }
            if (!pos1) {
                newVal = newVal.opposite()
            }
            if (newVal.isZero()) {
                continue
            }
            children.unshift(newVal)
            positive.unshift(true)
        }
        return new AddMinus(PRIVATE, children, positive)
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
        const acc = new Decimal(0)
        for (let i=0; i<children.length; i++) {
            if (this.#positive[i]) {
                acc.add( children[i] )
            } else {
                acc.sub( children[i] )
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

    /** recherche les opérandes des add/minus enfants
     * @returns {[Array<Base>, Array<Base>]} les éléments en plus et les éléments en moins
     */
    childOperands() {
        const factorsPlus = []
        const factorsMinus = []
        for (let i=0; i<this.#children.length; i++) {
            if (this.#positive[i]) {
                factorsPlus.push(this.#children[i])
            } else {
                factorsMinus.push(this.#children[i])
            }
        }
        return [factorsPlus, factorsMinus]
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
            let childStr
            if (lang === 'en') {
                childStr = this.#children[i].toStringEn()
            } else if (lang === 'tex') {
                childStr = this.#children[i].toTex()
            } else {
                childStr = String(this.#children[i])
            }
            const sign = this.#positive[i] ? '+' : '-'
            if (childStr.startsWith('-')) {
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
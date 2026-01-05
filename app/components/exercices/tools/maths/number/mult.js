import { some } from "underscore"
import { Base } from "./base"
import { Scalar } from "./scalar"
import Decimal from "decimal.js"
import { Signature } from "./signature"

// Constante privée
// sert à empêcher l'accès direct au constructeur
const PRIVATE = Symbol('private');

class Mult extends Base {
    #children; /** @type {Base[]} */
    #string = null /** @type {string|null} représentation texte */
    #stringEN = null /** @type {string|null} représentation texte */
    #stringTex = null /** @type {string|null} représentation tex */

    /**
     * accesseurs
     */
    get children() {
        return [...this.#children]
    }

    get priority() {
        return 2;
    }

    get scalarFactor() {
        const factors = this.#children.map( child => child.scalarFactor ).filter( f => f !== 1 )
        if (factors.length === 0) {
            return 1
        }
        return factors.reduce( (acc, val) => Scalar.mult(acc, val), Scalar.ONE )
    }

    get withoutScalarFactor() {
        const newChildren = this.#children
            .map( child => child.withoutScalarFactor )
            .filter( c => c !== Scalar.ONE )
        if (newChildren.length === 0) {
            return Scalar.ONE
        }
        if (newChildren.length === 1) {
            return newChildren[0]
        }
        return new Mult(PRIVATE, newChildren)
    }

    get startsWithMinus() {
        if (this.#children.length === 0) {
            return false
        }
        return this.#children[0].startsWithMinus
    }

    /**
     * 
     * @param {Array} operandes 
     * @returns {Mult, Scalar}
     */
    static fromList(operandes) {
        if (operandes.length == 0){
            return Scalar.ONE
        }
        if (operandes.length == 1) {
            return operandes[0]
        }
        if (!operandes.every( item => item instanceof Base)) {
            throw new Error('Tous les éléments de la liste doivent être des instances de Base')
        }
        return new Mult(PRIVATE, [...operandes])
    }

    static mult(left, right) {
        if (!(left instanceof Base) || !(right instanceof Base)) {
            throw new Error('Les deux opérandes doivent être des instances de Base')
        }
        if (left instanceof Scalar && left.isOne()) {
            return right;
        }
        if (right instanceof Scalar && right.isOne()) {
            return left;
        }
        const operandes = left instanceof Mult
            ? left.children
            : [left]
        if (right instanceof Mult) {
            operandes.push(...right.children)
        } else {
            operandes.push(right)
        }
        return new Mult(PRIVATE, operandes)
    }

    /**
     * constructeur
     * @param {symbol} token
     * @param {Base[]} children
     */
    constructor(token, children) {
        super()
        if (token !== PRIVATE) {
            throw new Error('Utilisez AddMinus.add ou AddMinus.minus pour créer une instance')
        }
        this.#children = children
    }

    /**
     * si un nom est précisé, renvoie true si le nœud dépend de la variable,
     * sinon renvoie la liste des variables dont dépend le noeud
     * @param {string|undefined} name 
     * @returns {boolean|Array}
     */
    isFunctionOf(name){
        if (typeof name === 'undefined') {
            return _.uniq(_.flatten(this.#children.map(child => child.isFunctionOf()))).sort()
        }
        return some(this.#children, child => child.isFunctionOf(name))
    }

    substituteVariable(varName, value) {
        if (!this.isFunctionOf(varName)) {
            return this
        }
        const children = this.#children.map( c => c.substituteVariable(varName, value) )
        return new Mult(PRIVATE, children)
    }

    substituteVariables(values) {
        const children = this.#children.map( c => c.substituteVariables(values) )
        if (children.every((child, index) => child === this.#children[index])) {
            // pas de changement
            return this
        }
        return new Mult(PRIVATE, children);
    }

    toFixed(n) {
        const children = this.#children.map( c => c.toFixed(n) )
        return new Mult(PRIVATE, children)
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
            if (i !== 0 && child.startsWithMinus || child.priority < this.priority) {
                if (lang === 'tex') {
                    childStr = `\\left(${childStr}\\right)`
                } else {
                    childStr = `(${childStr})`
                }
            }
            if (i !== 0) {
                if (lang === 'tex') {
                    result += ' \\cdot '
                } else {
                    result += ' * '
                }
            }
            result += childStr
        }
        return result
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        if (!this.#string) {
            this.#string = this.#toStringHelper('fr')
        }
        return this.#string;
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

    isExpanded() {
        return !some(this.#children, child => !child.isExpanded())
            && !some(this.#children, child => child.canBeDistributed)
            && this.#children.filter( c => c instanceof Scalar).length <= 1
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values) {
        let acc = new Decimal(1)
        for (let child of this.#children) {
            let v = child.toDecimal(values)
            acc = acc.mul(v)
        }
        return acc
    }

    /**
     * renvoie la signature de l'expression
     * @returns {Signature}
     */
    signature() {
        const children = this.#children.map( c => c.signature() )
        let s = new Signature()
        for (let child of children) {
            s = s.mult(child)
        }
        return s
    }

    opposite() {
        // recherche un enfant pour porter l'opposite
        // sinon multiplie par -1
        const children = [...this.#children]
        for (let i=0; i<children.length; i++) {
            const child = children[i]
            if (typeof child.opposite === 'function') {
                const newChild = child.opposite()
                children[i] = newChild
                return new Mult(PRIVATE, children)
            }
        }
        children.unshift(Scalar.MINUS_ONE)
        return new Mult(PRIVATE, children)
    }

    toDict() {
        return {
            type: "Mult",
            children: this.#children.map( child => child.toDict() )
        }
    }
}

export { Mult };
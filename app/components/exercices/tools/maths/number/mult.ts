import _ from "underscore"
import { Base } from "./base"
import { Scalar } from "./scalar"
import Decimal from "decimal.js"
import { Signature } from "./signature"

class Mult extends Base {
    private _children:Array<Base> /** @type {Base[]} */
    private _string:string|null = null /** @type {string|null} représentation texte */
    private _stringEN = null /** @type {string|null} représentation texte */
    private _stringTex = null /** @type {string|null} représentation tex */

    /**
     * accesseurs
     */
    get children():Array<Base> {
        return [...this._children]
    }

    get priority():number {
        return 2
    }

    get scalarFactor():Scalar {
        const factors = this._children.map( child => child.scalarFactor ).filter( f => f instanceof Scalar )
        if (factors.length === 0) {
            return Scalar.ONE
        }
        return factors.reduce( (acc, val) => Scalar.mult(acc, val), Scalar.ONE )
    }

    get withoutScalarFactor():Base {
        const newChildren = this._children
            .map( child => child.withoutScalarFactor )
            .filter( c => c !== Scalar.ONE )
        if (newChildren.length === 0) {
            return Scalar.ONE
        }
        if (newChildren.length === 1) {
            return newChildren[0]
        }
        return new Mult(newChildren)
    }

    get startsWithMinus():boolean {
        if (this._children.length === 0) {
            return false
        }
        return this._children[0].startsWithMinus
    }

    /**
     * 
     * @param {Array} operandes 
     * @returns {Mult, Scalar}
     */
    static fromList(operandes:Array<Base>):Base {
        if (operandes.length == 0){
            return Scalar.ONE
        }
        if (operandes.length == 1) {
            return operandes[0]
        }
        if (!operandes.every( item => item instanceof Base)) {
            throw new Error('Tous les éléments de la liste doivent être des instances de Base')
        }
        return new Mult([...operandes])
    }

    static mult(left:Base, right:Base):Base {
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
        return new Mult(operandes)
    }

    /**
     * constructeur
     * @param {Base[]} children
     */
    constructor(children: Array<Base>) {
        super()
        this._children = children
    }

    /**
     * si un nom est précisé, renvoie true si le nœud dépend de la variable,
     * sinon renvoie la liste des variables dont dépend le noeud
     * @param {string|undefined} name 
     * @returns {boolean|Array}
     */
    isFunctionOf(name:string|undefined):boolean|Array<string> {
        if (typeof name === 'undefined') {
            return _.uniq(_.flatten(this._children.map(child => child.isFunctionOf(undefined) as Array<string>))).sort()
        }
        return _.some(this._children, child => child.isFunctionOf(name) as boolean)
    }

    substituteVariable(varName:string, value:Base|string|Decimal|number):Base {
        if (!this.isFunctionOf(varName)) {
            return this
        }
        const children = this._children.map( c => c.substituteVariable(varName, value) )
        return new Mult(children)
    }

    substituteVariables(substitions:Record<string, Base|string|Decimal|number>):Base {
        const children = this._children.map( c => c.substituteVariables(substitions) )
        if (children.every((child, index) => child === this._children[index])) {
            // pas de changement
            return this
        }
        return new Mult(children);
    }

    toFixed(n:number):Base {
        const children = this._children.map( c => c.toFixed(n) )
        return new Mult(children)
    }

    private _toStringHelper(lang:string):string {
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
    toString():string {
        if (!this._string) {
            this._string = this._toStringHelper('fr')
        }
        return this._string;
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

    isExpanded():boolean {
        return !_.some(this._children, child => !child.isExpanded())
            && !_.some(this._children, child => child.canBeDistributed)
            && this._children.filter( c => c instanceof Scalar).length <= 1
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values:Record<string, Decimal|string|number>|undefined):Decimal {
        let acc = new Decimal(1)
        for (let child of this._children) {
            let v = child.toDecimal(values)
            acc = acc.mul(v)
        }
        return acc
    }

    /**
     * renvoie la signature de l'expression
     * @returns {Signature}
     */
    signature():Signature {
        const children = this._children.map( c => c.signature() )
        let s = new Signature()
        for (let child of children) {
            s = s.mult(child)
        }
        return s
    }

    opposite():Base {
        // recherche un enfant pour porter l'opposite
        // sinon multiplie par -1
        const children = [...this._children]
        for (let i=0; i<children.length; i++) {
            const child = children[i]
            if (typeof (child as any).opposite === 'function') {
                const newChild = (child as any).opposite()
                children[i] = newChild
                return new Mult(children)
            }
        }
        children.unshift(Scalar.MINUS_ONE)
        return new Mult(children)
    }

    toDict():object {
        return {
            type: "Mult",
            children: this._children.map( child => child.toDict() )
        }
    }
}

export { Mult };
import { AddMinus } from './add'
import { Mult } from './mult'
import { Div } from './div'
import { Power } from './power'
import { Scalar } from './scalar'
import { Constant, E } from './constant'
import { Symbol } from './symbol'
import { Base } from './base'
import { Function } from './function'

/**
 * Renvoie l'opposé d'un noeud
 * @param {Base} node 
 * @returns {Base}
 */
function opposite(node:Base):Base {
    if (typeof (node as any).opposite === 'function') {
        return (node as any).opposite()
    }
    return simplify(new Function('(-)', node))
}

/**
 * fonction de simplification
 * @param {Base} node 
 * @returns {Base}
 */
function simplify(node:Base):Base {
    if (node instanceof Scalar
        || (node instanceof Constant)
        || (node instanceof Symbol)) {
        return node
    }

    if (node instanceof Power) {
        return powerSimplify(node)
    }
    if (node instanceof Function) {
        return functionSimplify(node)
    }
    if (node instanceof Mult) {
        return multSimplify(node)
    }
    if (node instanceof Div) {
        return divSimplify(node)
    }
    if (node instanceof AddMinus) {
        return addSimplify(node)
    }

    return node
}

/**
 * simplification d'une puissance
 * @param {Power} node
 * @returns {Base}
 */
function powerSimplify(node:Power):Base {
    const base = node.base
    const exposant = node.exposant
    const sbase = simplify(base)
    const sexposant = simplify(exposant)
    // cas des exposants nuls
    if (sexposant instanceof Scalar) {
        if (sexposant.isZero()) {
            if (sbase.isZero()) {
                return Scalar.NAN
            }
            return Scalar.ONE
        }
        if (sexposant.isOne()) {
            return sbase
        }
        if ((sbase instanceof Scalar) && sexposant.isInteger()) {
            return sbase.pow(sexposant)
        }
    }
    if (sbase instanceof Scalar) {
        if (sbase.isZero()) {
            return Scalar.ZERO
        }
        if (sbase.isOne()) {
            return Scalar.ONE
        }
    }
    if (sbase === E ) {
        return simplify(new Function('exp', sexposant))
    }
    if (sbase === base && sexposant === exposant) {
        return node
    }
    return new Power(sbase, sexposant)
}

function functionSimplify(node:Function):Base {
    const funcName = node.name
    const child = node.child
    const childSim = simplify(child)
    if (funcName === '(+)') {
        return childSim;
    }
    if (funcName === '(-)') {
        if (typeof (childSim as any).opposite === 'function') {
            return (childSim as any).opposite();
        }
    }
    if (childSim instanceof Function && childSim.name == 'exp' && funcName == 'ln') {
        return childSim.child
    }

    if (funcName === 'inverse') {
        if (childSim instanceof Div) {
            return simplify(new Div(childSim.right, childSim.left))
        }
        if (childSim instanceof Function) {
            if (childSim.name === 'inverse') {
                return childSim.child
            }
            if (childSim.name === 'exp' ) {
                return simplify(new Function('exp', opposite(childSim.child)))
            }
        }
        return simplify(new Div(Scalar.ONE, childSim))
    }

    const d = childSim.toDecimal(undefined)
    if (funcName === 'sign') {
        if (d.isZero()) {
            return Scalar.ZERO
        }
        if (d.isPositive()) {
            return Scalar.ONE
        }
        if (d.isNegative()) {
            return Scalar.MINUS_ONE
        }
    }
    

    if (d.isZero()) {
        if (funcName === '(+)' || funcName === '(-)' || funcName === 'sin' || funcName === 'sqrt') {
            return Scalar.ZERO
        }
        if (funcName === 'exp' || funcName === 'cos') {
            return Scalar.ONE
        }
        if (funcName === 'ln' || funcName === 'log' || funcName === 'inverse') {
            return Scalar.NAN
        }
    }

    if (childSim === child) {
        return node
    }
    return new Function(funcName, childSim)
}

function multSimplify(node:Mult):Base {
    const factors = node.children.map(f => simplify(f))
    const scalarsFactors = factors.filter(f => f instanceof Scalar);
    let scalarFactor = Scalar.ONE;
    for (let sf of scalarsFactors) {
        scalarFactor = scalarFactor.mult(sf);
    }
    if (scalarFactor.isZero()) {
        return Scalar.ZERO;
    }
    const nonScalarFactors = factors.filter(f => !(f instanceof Scalar) && !f.isOne())
    if (nonScalarFactors.length === 0) {
        return scalarFactor
    }

    if (!scalarFactor.isOne()) {
        nonScalarFactors.unshift(scalarFactor)
    }
    return Mult.fromList(nonScalarFactors)
}

function divSimplify(node:Div):Base {
    let leftSim = simplify(node.left)
    let rightSim = simplify(node.right)
    if (leftSim.isZero()) {
        return Scalar.ZERO
    }
    if (rightSim.isOne()) {
        return leftSim
    }
    if (rightSim.isZero()) {
        return Scalar.NAN
    }
    // simplification des scalaires
    if ((leftSim instanceof Scalar) && (rightSim instanceof Scalar)) {
        return leftSim.div(rightSim)
    }
    if ((leftSim instanceof Mult) && (rightSim instanceof Scalar)) {
        return simplify(Mult.mult(leftSim, rightSim.inverse()))
    }
    return new Div(leftSim, rightSim)
}

function addSimplify(node: AddMinus): Base {
    const childrenSim = node.children.map( c => simplify(c) )
    const currentPositive = node.positive

    // créer un dictionnaire selon les signatures
    const groups = {}
    for (let i=0; i<childrenSim.length; i++) {
        const node = childrenSim[i]
        const p = currentPositive[i]
        const sig = String(node.signature())
        if (typeof groups[sig] === 'undefined') {
            groups[sig] = {
                items: [],
                positive: []
            }
        }
        groups[sig].items.push(node)
        groups[sig].positive.push(p)
    }
    // Ensuite on regroupe les termes pouvant l'être
    const newChildren = []
    const newPositive = []
    for (const sig in groups) {
        const group = groups[sig]
        const [n, p] = _regroupeSameSignatur(group.items, group.positive)
        if (n !== Scalar.ZERO) {
            newChildren.push(n)
            newPositive.push(p)
        }
    }
    return AddMinus.fromList(newChildren, newPositive)
}

/**
 * Fonction auxiliaire pour produire la somme d'items ayant une même signature
 * @param {Array<Base>} items 
 * @param {Array<boolean>} positive 
 * @returns {[Base,boolean]}
 */
function _regroupeSameSignatur(items:Array<Base>, positive:Array<boolean>):[Base,boolean] {
    if (items.length != positive.length) {
        throw new Error("items et positive doivent avoir même taille.")
    }
    if (items.length === 0) {
        return [Scalar.ZERO, true]
    }
    if (items.length === 1) {
        return [items[0], positive[0]]
    }
    // Il y a plusieurs termes avec même signature qu'il faut contracter
    const scalars = items.map(n => n.scalarFactor)
    let scalar = Scalar.ZERO
    for (let i=0; i<scalars.length; i++) {
        if (positive[i]) {
            scalar = scalar.plus(scalars[i])
        } else {
            scalar = scalar.minus(scalars[i])
        }
    }
    const w = items[0].withoutScalarFactor
    return [simplify(Mult.mult(scalar, w)), true]
}

function decimalize(node:Base):Base {
    const d = node.toDecimal(undefined)
    if (!d.isNaN()) {
        return new Scalar(d)
    }
    if (node instanceof AddMinus) {
        const children = node.children.map(decimalize)
        return simplify(AddMinus.fromList(children, node.positive))
    }
    if (node instanceof Function) {
        const newChild = decimalize(node.child)
        return new Function(node.name, newChild)
    }

    if (node instanceof Mult) {
        const children = node.children.map(decimalize)
        return simplify(Mult.fromList(children))
    }

    if (node instanceof Div) {
        const newLeft = decimalize(node.left)
        const newRight = decimalize(node.right)
        return simplify(new Div(newLeft, newRight))
    }

    if (node instanceof Power) {
        const newBase = decimalize(node.base)
        const newExposant = decimalize(node.exposant)
        return simplify(new Power(newBase, newExposant))
    }

    return node

}


export { simplify, decimalize }
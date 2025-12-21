import { AddMinus } from './add'
import { Mult, Div, MultDiv } from './mult'
import { Power } from './power'
import { Scalar } from './scalar'
import { isTypeConstant, E } from './constant'
import { isTypeSymbol } from './symbol'
import { Base } from './base'
import { Function } from './function'

/**
 * Renvoie l'opposé d'un noeud
 * @param {Base} node 
 * @returns {Base}
 */
function opposite(node) {
    if (typeof node.opposite === 'function') {
        return node.opposite()
    }
    return simplify(new Function('(-)', node))
}

/**
 * fonction de simplification
 * @param {Base} node 
 * @returns {Base}
 */
function simplify(node) {
    if (node instanceof Scalar
        || isTypeConstant(node)
        || isTypeSymbol(node)) {
        return node
    }

    if (typeof node.simplify === 'function') {
        return node.simplify()
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
    return node
}

/**
 * simplification d'une puissance
 * @param {Base} node
 * @returns {Base}
 */
function powerSimplify(node) {
    const base = node.base
    const exposant = node.exposant
    const sbase = simplify(base)
    const sexposant = simplify(exposant)
    // cas des exposants nuls
    if (sexposant instanceof Scalar) {
        if (sexposant.toDecimal().equals(0)) {
            return Scalar.ONE
        }
        if (sexposant.toDecimal().equals(1)) {
            return sbase
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

function functionSimplify(node) {
    const funcName = node.name
    const child = node.child
    const childSim = simplify(child)
    if (funcName === '(+)') {
        return childSim;
    }
    if (funcName === '(-)') {
        if (typeof childSim.opposite === 'function') {
            return childSim.opposite();
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

    const d = childSim.toDecimal()
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

function multSimplify(node) {
    const factors = node.childFactors().map(f => simplify(f))
    const scalarsFactors = factors.filter(f => f instanceof Scalar);
    let scalarFactor = Scalar.ONE;
    for (let sf of scalarsFactors) {
        scalarFactor = scalarFactor.multiplyBy(sf);
    }
    if (scalarFactor.isZero()) {
        return Scalar.ZERO;
    }
    const nonScalarFactors = factors.filter(f => !(f instanceof Scalar) && !f.isOne())
    if (nonScalarFactors.length === 0) {
        return scalarFactor
    }

    const nonScalar = Mult.fromList(nonScalarFactors)
    if (scalarFactor.isOne()) {
        return nonScalar
    }
    if (scalarFactor.toDecimal().equals(-1)) {
        return opposite(nonScalar)
    }
    return new Mult(scalarFactor, nonScalar)
}

function divSimplify(node) {
    const leftSim = simplify(node.left);
    const rightSim = simplify(node.right);
    if (leftSim.isZero()) {
        return Scalar.ZERO;
    }
    if (rightSim.isOne()) {
        return leftSim;
    }
    if (rightSim.isZero()) {
        return Scalar.NAN;
    }
    // simplification des scalaires
    if (leftSim instanceof Scalar && rightSim instanceof Scalar) {
        if (!rightSim.isPositive()) {
            return simplify(new Div(opposite(leftSim), opposite(rightSim)))
        }
        if (leftSim.toDecimal().modulo(rightSim.toDecimal()).equals(0)
            && leftSim.isInteger() && rightSim.isInteger()) {
            const val = leftSim.toDecimal().dividedBy(rightSim.toDecimal());
            return new Scalar(val);
        }
    }
    return new Div(leftSim, rightSim)
}

function decimalize(node) {
    const d = node.toDecimal()
    if (!d.isNaN()) {
        return new Scalar(d)
    }
    if (node instanceof AddMinus) {
        const children = node.children.map( decimalize )
        return simplify( AddMinus.fromList(children, node.positive) )
    }
    if (node instanceof Function) {
        const newChild = decimalize(node.child)
        return new Function(node.name, newChild)
    }

    if (node instanceof MultDiv) {
        const newLeft = decimalize(node.left)
        const newRight = decimalize(node.right)
        return simplify(new node.constructor(newLeft, newRight))
    }

    if (node instanceof Power) {
        const newBase = decimalize(node.base)
        const newExposant = decimalize(node.exposant)
        return simplify(new Power(newBase, newExposant))
    }

    return node

}


export { simplify, decimalize }
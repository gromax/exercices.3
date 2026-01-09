import { AddMinus } from './add'
import { Mult } from './mult'
import { Div } from './div'
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

function divSimplify(node) {
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
    if (leftSim instanceof Scalar && rightSim instanceof Scalar) {
        return leftSim.div(rightSim)
    }
    return new Div(leftSim, rightSim)
}

function addSimplify(node) {
    const childrenSim = node.children.map( c => simplify(c) )
    const currentPositive = node.positive
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
            positive.unshift(currentPositive[i])
        } else {
            // on ajoute à la fin
            children.push(child)
            positive.push(currentPositive[i])
        }
    }
    // on réduit les scalaires au début de la liste
    while (children.length >= 2 && children[0] instanceof Scalar && children[1] instanceof Scalar) {
        let val1 = children.shift()
        let pos1 = positive.shift()
        let val2 = children.shift()
        let pos2 = positive.shift()
        let newVal
        if (pos1 === pos2) {
            newVal = val1.plus(val2)
        } else {
            newVal = val1.minus(val2)
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
    if (children.length > 0 && children[0] instanceof Scalar && children[0].isZero()) {
        children.shift()
        positive.shift()
    }
    if (children.length === 0) {
        return Scalar.ZERO
    }
    if (children.length === 1) {
        if (positive[0]) {
            return children[0]  
        } else {
            return opposite(children[0])
        }
    }
    return AddMinus.fromList(children, positive)
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

    if (node instanceof Mult) {
        const children = node.children.map( decimalize )
        return simplify( Mult.fromList(children) )
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
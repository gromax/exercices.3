import { AddMinus } from './add'
import { Mult } from './mult'
import { Div } from './div'
import { Power } from './power'
import { Scalar } from './scalar'
import { Constant, E } from './constant'
import { Symbol } from './symbol'
import { Base } from './base'
import { Function } from './function'
import { simplify } from './simplify'

/**
 * fonction de simplification
 * @param {Base} node 
 * @returns {Base}
 */
function derivate(node:Base):Base {
    if (node instanceof Scalar
        || (node instanceof Constant)
        || (node instanceof Symbol)) {
        return Scalar.ZERO
    }

    if (node instanceof AddMinus) {
        return simplify(AddMinus.fromList(node.children.map(derivate), node.positive))
    }

    if (node instanceof Div) {
        const u = node.left
        const v = node.right
        const uPrime = derivate(u)
        const vPrime = derivate(v)
        const numerator = AddMinus.minus(
            Mult.mult(uPrime, v),
            Mult.mult(u, vPrime)
        )
        const denominator = new Power(v, new Scalar(2))
        return simplify(Div.div(numerator, denominator))
    }

    if (node instanceof Mult) {
        const children = node.children
        const childrenPrime = children.map(derivate)
        const terms= []
        for (let i = 0; i < children.length; i++) {
            const termFactors = [...children]
            termFactors[i] = childrenPrime[i]
            terms.push(Mult.fromList(termFactors))
        }
        return simplify(AddMinus.addFromList(terms))
    }

    if (node instanceof Function) {
        const child = node.child
        const childPrime = derivate(child)
        if (node.name === '(+)') {
            return childPrime
        }
        if (node.name === '(-)') {
            return simplify(new Function('(-)', childPrime))
        }
        if (node.name === 'sqrt') {
            const numerator = childPrime
            const denominator = Mult.mult(new Scalar(2), node)
            return simplify(Div.div(numerator, denominator))
        }
        if (node.name === 'ln') {
            const numerator = childPrime
            const denominator = child
            return simplify(Div.div(numerator, denominator))
        }
        if (node.name === 'log') {
            const numerator = childPrime
            const denominator = Mult.mult(child, new Function('ln', new Scalar(10)))
            return simplify(Div.div(numerator, denominator))
        }
        if (node.name === 'exp') {
            return simplify(Mult.mult(childPrime, node))
        }
        if (node.name === 'inverse') {
            const numerator = Mult.mult(Scalar.MINUS_ONE, childPrime)
            const denominator = new Power(child, new Scalar(2))
            return simplify(Div.div(numerator, denominator))
        }
        if (node.name === 'sin') {
            return simplify(Mult.mult(childPrime, new Function('cos', child)))
        }
        if (node.name === 'cos') {
            const minusSin = new Function('(-)', new Function('sin', child))
            return simplify(Mult.mult(childPrime, minusSin))
        }
        
        throw new Error(`Dérivée non implémentée pour la fonction ${node.name}`)
    }

    if (node instanceof Power) {
        const base = node.base
        const exponent = node.exposant
        const basePrime = derivate(base)
        const exponentPrime = derivate(exponent)
        const factor = AddMinus.add(
            Mult.mult(exponentPrime, new Function('ln', base)),
            Div.div(Mult.mult(exponent, basePrime), base)
        )
        return simplify(Mult.mult(factor, node))
    }
    throw new Error(`Dérivée non implémentée pour le type ${node.constructor.name}`)
}

export { derivate }
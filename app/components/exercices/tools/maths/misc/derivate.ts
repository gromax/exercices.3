import { AddMinus } from '../number/add'
import { Mult } from '../number/mult'
import { Div } from '../number/div'
import { Exponential } from '../number/exponential'
import { Power } from '../number/power'
import { Scalar } from '../number/scalar'
import { Constant } from '../number/constant'
import { Symbol } from '../number/symbol'
import { Base } from '../number/base'
import { Function } from '../number/function'
import { Collection } from '../number/collection'
import { simplify } from './simplify'

/**
 * fonction de simplification
 * @param {Base} node 
 * @param {string} varName
 * @returns {Base}
 */
function derivate(node:Base, varName:string):Base {
    if (node instanceof Scalar
        || (node instanceof Constant)
        ) {
        return Scalar.ZERO
    }

    if (node instanceof Symbol) {
        return String(node) == varName
            ? Scalar.ONE
            : Scalar.ZERO
    }


    if (node instanceof AddMinus) {
        return simplify(
            new Collection(
                node.children.map(
                    item => derivate(item, varName)
                )
            )
        )
    }

    if (node instanceof AddMinus) {
        return simplify(
            AddMinus.fromList(
                node.children.map(
                    item => derivate(item, varName)
                ),
                node.positive
            )
        )
    }

    if (node instanceof Div) {
        const u = node.left
        const v = node.right
        const uPrime = derivate(u, varName)
        const vPrime = derivate(v, varName)
        const numerator = AddMinus.minus(
            Mult.mult(uPrime, v),
            Mult.mult(u, vPrime)
        )
        const denominator = Power.make(v, 2)
        return simplify(Div.div(numerator, denominator))
    }

    if (node instanceof Mult) {
        const children = node.children
        const childrenPrime = children.map(function(item) { return derivate(item, varName) })
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
        const childPrime = derivate(child, varName)
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
            const denominator = Power.make(child, 2)
            return simplify(Div.div(numerator, denominator))
        }
        if (node.name === 'sin') {
            return simplify(Mult.mult(childPrime, new Function('cos', child)))
        }
        if (node.name === 'cos') {
            const minusSin = new Function('(-)', new Function('sin', child))
            return simplify(Mult.mult(childPrime, minusSin))
        }
        if (node.name === 'tan') {
            const cos2 = Power.make(new Function('cos', child), 2)
            return simplify(Div.div(childPrime, cos2))
        }
        if (node.name === 'atan') {
            const numerator = childPrime
            const denominator = AddMinus.add(Scalar.ONE, Power.make(child, 2))
            return simplify(Div.div(numerator, denominator))
        }
        
        throw new Error(`Dérivée non implémentée pour la fonction ${node.name}`)
    }

    if (node instanceof Power) {
        const base = node.base
        const exponent = node.exposant
        const basePrime = derivate(base, varName)
        return Mult.fromList([
            new Scalar(exponent),
            basePrime,
            Power.make(base, exponent.minus(1))
        ])
    }

    if (node instanceof Exponential) {
        const base = node.base
        const exponent = node.exposant
        const basePrime = derivate(base, varName)
        const exponentPrime = derivate(exponent, varName)
        const factor = AddMinus.add(
            Mult.mult(exponentPrime, new Function('ln', base)),
            Div.div(Mult.mult(exponent, basePrime), base)
        )
        return simplify(Mult.mult(factor, node))
    }
    throw new Error(`Dérivée non implémentée pour le type ${node.constructor.name}`)
}

export { derivate }
import { Mult } from '../number/mult'
import { Div } from '../number/div'
import { Scalar } from '../number/scalar'
import { Base } from '../number/base'
import { Function } from '../number/function'
import { Complex } from '../number/complex'
import { I } from '../number/constant'

function scalarFactor(node: Base|Base[]): Complex|Scalar {
    if (Array.isArray(node)) {
        const factors = node.map( f => scalarFactor(f))
        return factors.reduce( (acc, val) => Complex.mult(acc, val), Scalar.ONE )
    }
    if (node instanceof Scalar || node instanceof Complex) {
        return node
    }

    if (node instanceof Div) {
        return Complex.div(
            scalarFactor(node.numerator),
            scalarFactor(node.denominator)
        )
    }
    if (node instanceof Mult) {
        const factors = node.children.map( f => scalarFactor(f))
        return factors.reduce( (acc, val) => Complex.mult(acc, val), Scalar.ONE )
    }
    if (node instanceof Function) {
        if (node.name === '(+)') {
            return scalarFactor(node.child)
        }
        if (node.name === '(-)') {
            return scalarFactor(node.child).opposite()
        }
        return Scalar.ONE
    }

    if (node === I) {
        return Complex.I
    }
    return Scalar.ONE
}

function nonScalars(node:Base|Base[]):Base[] {
    if (Array.isArray(node)) {
        const factors = node.map( f => nonScalars(f))
        return factors.flat()
    }
    if (node instanceof Scalar || node instanceof Complex) {
        return []
    }
    if (node instanceof Div) {
        const num = nonScalars(node.numerator)
        const den = nonScalars(node.denominator)
        const d = Div.div(
            num.length==0 ? Scalar.ONE : num[0],
            den.length==0 ? Scalar.ONE : den[0],
        )
        return [d]
    }
    if (node instanceof Mult) {
        return node.children.map(c => nonScalars(c)).flat()
    }
    if (node instanceof Function) {
        if (node.name === '(+)') {
            return nonScalars(node.child)
        }
        if (node.name === '(-)') {
            const factors = nonScalars(node.child)
            factors.unshift(Scalar.MINUS_ONE)
            return factors
        }
        return []
    }

    if (node === I) {
        return []
    }
    return [node]
}

export { scalarFactor, nonScalars }
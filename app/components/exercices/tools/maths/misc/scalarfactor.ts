import { Mult } from '../number/mult'
import { Div } from '../number/div'
import { Scalar } from '../number/scalar'
import { Base } from '../number/base'
import { Function } from '../number/function'
import { Complex } from '../number/complex'

function scalarFactor(node: Base): Complex|Scalar {
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
    return Scalar.ONE
}

export { scalarFactor }
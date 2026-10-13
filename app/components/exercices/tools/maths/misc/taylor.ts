import { Base } from '../number/base'
import { Div } from '../number/div'
import { Scalar } from '../number/scalar'
import { Symbol } from '../number/symbol'
import { Power } from '../number/power'
import { Mult } from '../number/mult'
import { AddMinus } from '../number/add'
import { simplify } from './simplify'

function taylor(expression:Base, varName:string, order:number):Base {
    if (Math.trunc(order)!=order || order < 0) {
        throw new Error(`<ordre:${order}> Développement de Taylor : l'ordre doit être un entier non négatif`)
    }
    if (order>5) {
        throw new Error(`<ordre:${order}> Développement de Taylor : l'ordre est trop grand(>5)`)
    }
    const s = Symbol.fromString(varName)
    if (s === null) {
        throw new Error(`<variable:${varName}> Développement de Taylor : variable invalide`)
    }
    const f0 = expression.substituteVariable(varName, 0)
    const coeffs = [f0]
    let expr = expression
    for (let n = 1; n <= order; n++) {
        const sn = new Scalar(n)
        expr = new Div(expr.derivate(varName), sn)
        const fn0 = expr.substituteVariable(varName, 0)
        const xn = Power.make(s, n)
        const monome = Mult.fromList([fn0, xn])
        coeffs.push(monome)
    }
    const taylorSum = AddMinus.addFromList(coeffs)
    return simplify(taylorSum)
}

export { taylor }
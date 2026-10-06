import { Base } from './base'
import { Div } from './div'
import { Scalar } from './scalar'
import { Symbol } from './symbol'
import { Power } from './power'
import { Mult } from './mult'
import { AddMinus } from './add'
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
        const xn = new Power(s, sn)
        const monome = Mult.fromList([fn0, xn])
        coeffs.push(monome)
    }
    const taylorSum = AddMinus.addFromList(coeffs)
    return simplify(taylorSum)
}

export { taylor }
import { Base } from "../number/base"
import { Scalar } from "../number/scalar"
import { Function } from "../number/function"
import { AddMinus } from "../number/add"
import { Mult } from '../number/mult'
import { Div } from '../number/div'
import { Exponential } from '../number/exponential'
import { Constant } from "../number/constant"
import { Symbol } from "../number/symbol"
import { Collection } from "../number/collection"

import { Ensemble } from "../number/ensemblesitems/parent"
import { EnsembleCalculator } from "../number/ensemble"

import { Token } from './tokens/token'
import { TNumber } from './tokens/number'
import { TEnsemble } from './tokens/ensemble'

/**
 * Construit un objet Base représentant un nombre
 * @param {Array<Token>} rpn 
 * @param {boolean} withComplex 
 * @returns {Base}
 */
function build(rpn:Array<Token>, withComplex:boolean = false):Base {
    let stack:Array<Base> = [];
    for (let item of rpn) {
        const sItem = String(item)
        if (item.arity == 1) {
            // devrait correspondre à une fonction ou un opérateur unaire
            if (stack.length == 0) {
                throw new Error(`${item} n'a pas d'opérande à dépiler.`)
            }
            const child = stack.pop()
            stack.push(new Function(sItem, child))
            continue
        }
        if (item.arity == 2) {
            if (stack.length <2) {
                throw new Error(`${item} n'a pas assez d'opérandes à dépiler.`);
            }
            const right = stack.pop()
            const left = stack.pop()
            if (sItem == "+") {
                stack.push(AddMinus.add(left, right))
            } else if (sItem == "-") {
                stack.push(AddMinus.minus(left, right))
            } else if (sItem == "*") {
                stack.push(Mult.mult(left, right))
            } else if (sItem == "/") {
                stack.push(new Div(left, right))
            } else if (sItem == "^") {
                stack.push(Exponential.make(left, right))
            } else if (sItem == ";") {
                stack.push(new Collection([left, right]))
            } else if (sItem == "∪") {
                throw new Error(`Union d'intervalles non encor supportée.`)
            } else if (sItem == "∩") {
                throw new Error(`Intersection d'intervalles non encore supportée.`)
            } else {
                throw new Error(`Opérateur binaire ${item} non reconnu.`)
            }
            continue
        }
        if (sItem === "i") {
            // selon le mode, i est reconnu comme nombre complexe ou symbole
            if (withComplex) {
                stack.push(Constant.fromString("i"))
            } else {
                stack.push(Symbol.fromString("i"))
            }
            continue
        }
        if (Constant.isConstant(sItem)) {
            stack.push(Constant.fromString(sItem))
            continue
        }
        if (Symbol.isSymbol(sItem)) {
            stack.push(Symbol.fromString(sItem))
            continue
        }
        if (item instanceof TNumber) {
            stack.push(new Scalar(sItem))
            continue
        }
        if (item instanceof TEnsemble) {
            throw new Error(`Ensemble pas encore pris en charge par le builder.`)
        }
        throw new Error(`token ${item} n'a pas été reconnu.`)
    }
    if (stack.length != 1) {
        throw new Error(`La pile devrait contenir un seul item à la fin et pas ${stack.length}.`)
    }
    const result = stack.pop()
    return result
}

function buildEnsemble(rpn:Array<TEnsemble>):Ensemble {
    let stack:Array<Ensemble> = [];
    for (let item of rpn) {
        const sItem = String(item)
        if (item.arity == 1) {
            // devrait correspondre à une fonction ou un opérateur unaire
            if (stack.length == 0) {
                throw new Error(`${item} n'a pas d'opérande à dépiler.`)
            }
            throw new Error(`${item} n'existe pas pour un ensemble.`)
        }
        if (item.arity == 2) {
            if (stack.length <2) {
                throw new Error(`${item} n'a pas assez d'opérandes à dépiler.`);
            }
            const right = stack.pop()
            const left = stack.pop()
            if (sItem == "∪") {
                stack.push(EnsembleCalculator.makeUnion(left, right))
                continue
            } else if (sItem == "∩") {
                stack.push(EnsembleCalculator.makeIntersection(left, right))
                continue
            } else {
                throw new Error(`Opérateur binaire ${item} non reconnu.`)
            }
        }
        if (item.isEmptySet()) {
            stack.push(EnsembleCalculator.emptySet())
            continue
        }
        if ((item instanceof TEnsemble) && item.isInterval) {
            // L'objet contient des enfants qu'il faut analyser pour produire un nombre
            const child:Base = build(item.subTokenList, false)
            const sBornes = item.toString()
            const interval = EnsembleCalculator.makeInterval(
                sBornes[0], child, sBornes[1]
            )
            stack.push(interval)
            continue
        }
        throw new Error(`token ${item} n'a pas été reconnu.`)
    }
    if (stack.length != 1) {
        throw new Error(`La pile devrait contenir un seul item à la fin et pas ${stack.length}.`)
    }
    const result = stack.pop()
    return result
}

export { build, buildEnsemble }
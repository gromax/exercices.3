import { AddMinus } from '../number/add'
import { Mult } from '../number/mult'
import { Div } from '../number/div'
import { Power } from '../number/power'
import { Exponential } from '../number/exponential'
import { Scalar } from '../number/scalar'
import { Constant, NAN, I, PI } from '../number/constant'
import { Symbol } from '../number/symbol'
import { Base } from '../number/base'
import { Function } from '../number/function'
import { Collection } from '../number/collection'
import { pifrac } from './functions'



/**
 * renvoie le complexe conjugué d'un nombre
 * @param {Base} node 
 * @returns {Base} le complexe conjugué du nombre fourni
 */
function conjugaison(node:Base):Base {
    if (node === I) {
        return Mult.mult(Scalar.MINUS_ONE, I)
    }
    if ((node instanceof Constant) || (node instanceof Scalar)) {
        return node
    }
    if (node instanceof Symbol) {
        return NAN // impossible de faire le calcul sans savoir le contenu
    }
    if (node instanceof Mult) {
        const conjs = node.children.map(conjugaison)
        if (conjs.some((conj,index) => conj !== node.children[index])) {
            return Mult.fromList(conjs)
        }
        return node
    }
    if (node instanceof Div) {
        const num = conjugaison(node.numerator)
        const denom = conjugaison(node.denominator)
        if (num !== node.numerator || denom !== node.denominator) {
            return new Div(num, denom)
        }
        return node
    }
    if (node instanceof Power) {
        const base = conjugaison(node.base)
        if (base !== node.base) {
            return Power.make(base, node.exposant)
        }
        return node
    }
    if (node instanceof Exponential) {
        const expo = conjugaison(node.exposant)
        const base = conjugaison(node.base)
        if (expo !== node.exposant || base !== node.base) {
            return new Exponential(base, expo)
        }
        return node
    }
    if (node instanceof AddMinus) {
        const conjs = node.children.map(conjugaison)
        if (conjs.some((conj,index) => conj !== node.children[index])) {
            return AddMinus.fromList(conjs, node.positive)
        }
        return node
    }
    if (node instanceof Collection) {
        const conjs = node.children.map(conjugaison)
        if (conjs.some((conj,index) => conj !== node.children[index])) {
            return Collection.fromList(conjs)
        }
        return node
    }
    if (node instanceof Function) {
        const child = conjugaison(node.child)
        if (child !== node.child) {
            return new Function(node.name, child)
        }
        return node
    }
    console.warn(`Conjugaison: type de noeud non pris en charge: ${node.constructor.name}`)
    return NAN
}

function real(node:Base):Base {
    const sum = AddMinus.add(node, conjugaison(node))
    const demi = Scalar.div(1,2)
    return Mult.mult(demi, sum)
}

function imaginaire(node:Base):Base {
    const diff = AddMinus.minus(node, conjugaison(node))
    const demi = Scalar.div(1,2)
    return Mult.mult(demi, diff)
}

function abs(node:Base):Base {
    return Mult.mult(node, conjugaison(node))
}

function arg(node:Base):Base {
    // L'argument d'un nombre complexe peut être calculé comme suit :
    const z = node.toComplexDecimal(undefined)
    if (z.isZero()) {
        return NAN
    }
    const angle = z.arg()
    // Je vais chercher si cela tombe sur un une fraction connue.
    const res = pifrac(angle)
    if (res !== false) {
        const factor = new Scalar(res[0], res[1])
        return Mult.mult(factor, PI)
    }
    const realPart = real(node)
    const module = abs(node)
    const ratio = Div.div(realPart, module)
    const acos = new Function('acos', ratio)
    if (z.imag.gte(0)) {
        return acos
    }
    return new Function('(-)', acos)
}

/**
 * Je veut renvoyer false si je m'éloigne d'une forme algébrique :
 * i dans une fonction ou au dénominateur
 * @param {Base} node
 * @returns {boolean} true s'il n'y a que des i au numérateur
 */
function isAlgebraic(node:Base):boolean {
    if (node instanceof Div) {
        if (node.denominator.hasI()) {
            return false
        }
        return isAlgebraic(node.numerator)
    }
    if (node instanceof Mult || node instanceof AddMinus || node instanceof Collection) {
        return node.children.every(c => isAlgebraic(c))
    }
    if (node instanceof Function) {
        if (node.name === '(+)' || node.name === '(-)') {
            return isAlgebraic(node.child)
        }
        return !node.child.hasI()
    }
    if (node instanceof Power) {
        if (node.exposant.gte(0)) {
            return isAlgebraic(node.base)
        }
        return !node.base.hasI()
    }
    if (node instanceof Exponential) {
        return !node.hasI()
    }
    return true
}


export { conjugaison, real, imaginaire, abs, arg, isAlgebraic }

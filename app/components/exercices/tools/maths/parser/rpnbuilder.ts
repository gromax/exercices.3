import { Base } from "../number/base"
import { Scalar } from "../number/scalar"
import { Function } from "../number/function"
import { AddMinus } from "../number/add"
import { Mult } from '../number/mult'
import { Div } from '../number/div'
import { Power } from '../number/power'
import { Constant } from "../number/constant"
import { Symbol } from "../number/symbol"


function build(rpn:Array<string>):Base {
    let stack:Array<Base> = [];
    for (let item of rpn) {
        if (Function.isFunction(item)) {
            if (stack.length == 0) {
                throw new Error(`La fonction ${item} n'a pas d'opérande à dépiler.`)
            }
            let child = stack.pop()
            stack.push(new Function(item, child))
            continue
        }
        if (item == "+") {
            if (stack.length <2) {
                throw new Error(`L'addition n'a pas assez d'opérandes à dépiler.`);
            }
            let right = stack.pop()
            let left = stack.pop()
            stack.push(AddMinus.add(left, right))
            continue;
        }
        if (item == "-") {
            if (stack.length <2) {
                throw new Error(`La soustraction n'a pas assez d'opérandes à dépiler.`)
            }
            let right = stack.pop()
            let left = stack.pop()
            stack.push(AddMinus.minus(left, right))
            continue
        }
        if (item == "*") {
            if (stack.length <2) {
                throw new Error(`La multiplication n'a pas assez d'opérandes à dépiler.`)
            }
            let right = stack.pop()
            let left = stack.pop()
            stack.push(Mult.mult(left, right))
            continue;
        }
        if (item == "/") {
            if (stack.length <2) {
                throw new Error(`La division n'a pas assez d'opérandes à dépiler.`);
            }
            let right = stack.pop();
            let left = stack.pop();
            stack.push(new Div(left, right))
            continue;
        }
        if (item == "^") {
            if (stack.length <2) {
                throw new Error(`L'exponentiation n'a pas assez d'opérandes à dépiler.`)
            }
            let exposant = stack.pop()
            let base = stack.pop()
            stack.push(new Power(base, exposant))
            continue
        }
        if (Constant.isConstant(item)) {
            stack.push(Constant.fromString(item))
            continue
        }
        if (Symbol.isSymbol(item)) {
            stack.push(Symbol.fromString(item))
            continue
        }
        if (Scalar.isScalar(item)) {
            stack.push(new Scalar(item))
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

export { build }
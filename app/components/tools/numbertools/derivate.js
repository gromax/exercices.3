import { Base } from "../number/base";
import { Add, Minus } from "../number/add";
import { Mult, Div } from '../number//mult';
import { Power } from "../number/power";
import { Scalar } from "../number/scalar";
import { Symbol } from "../number/symbol";
import { Function } from "../number/function";
import { E } from "../number/constant";



/**
 * renvoie le noeud dérivé
 * @param {Base} node
 * @param {string} name
 * @returns {Base}
 */
function derivate(node, name){
    if ((node instanceof Add) || (node instanceof Minus)) {
        return new node.constructor(
            derivate(node.left, name),
            derivate(node.right, name)
        )
    }
    if (node instanceof Mult) {
        return new Add(
            new Mult(
                derivate(node.left, name),
                node.right
            ),
            new Mult(
                node.left,
                derivate(node.right, name)
            )
        )
    }
    if (node instanceof Div) {
        return new Div(
            new Minus(
                new Mult(
                    derivate(node.left, name),
                    node.right
                ),
                new Mult(
                    node.left,
                    derivate(node.right, name)
                )
            ),
            new Power(node.right, new Scalar(2))
        )
    }
    if (node instanceof Power){
        if (!node.base.isFunctionOf(name)) {
            if (!node.exposant.isFunctionOf(name)) {
                return Scalar.ZERO;
            }
            if (node.base == E) {
                return new Mult(
                    derivate(node.exposant, name),
                    node
                )
            }
            return Mult.fromList([
                derivate(node.exposant, name),
                new Function("ln", node.base),
                node
            ])
        }
        if (!node.exposant.isFunctionOf(name)) {
            return Mult.fromList([
                node.exposant, Scalar.ONE,
                derivate(node.base, name),
                new Power(
                    node.base,
                    new Minus(node.exposant, Scalar.ONE)
                )
            ]);
        }
        return new Add(
            Mult.fromList([
                derivate(node.exposant, name),
                new Function("ln", node.base),
                node
            ]),
            Mult.fromList([
                node.exposant,
                derivate(node.base, name),
                new Power(
                    node.base,
                    new Minus(node.exposant, Scalar.ONE)
                )
            ])
        );

    }
    if (node instanceof Function) {
        if (node.name == "ln") {
            return new Div(
                derivate(node.child, name),
                node.child
            )
        } else if (node.name == "exp") {
            return new Mult(
                derivate(node.child, name),
                node
            )
        } else if (node.name =="cos") {
            return Mult.fromList([
                Scalar.MINUS_ONE,
                derivate(node.child, name),
                new Function("sin", node.child)
            ]);
        } else if (node.name == "sin") {
            return new Mult(
                derivate(node.child, name),
                new Function("cos", node.child)
            );
        } else if (node.name == "(+)") {
            return derivate(node.child, name);
        } else if (node.name == "(-)") {
            return new Function(
                "(-)",
                derivate(node.child, name)
            );
        } else if (node.name == "inverse") {
            return new Function("(-)",
                new Div(
                    derivate(node.child, name),
                    new Power(node.child, new Scalar(2))
                )
            );
        } else if (node.name == "sqrt") {
            return new Div(
                derivate(node.child, name),
                new Mult(
                    new Scalar(2),
                    node
                )
            );
        } else {
            throw new Error(`Fonction ${node.name} non pris en charge.`);
        }
    }
    if (node instanceof Symbol){
        return node.name == name? Scalar.ONE:Scalar.ZERO;
    }
    return Scalar.ZERO;
}

export { derivate }
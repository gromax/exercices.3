import SimpleCondition from "./simplecondition"
import BinaryLogicalOperator from "./binarylogicaloperator"
import UnaryLogicalOperator from "./unarylogicoperator"
import LogicalNode from "./logicalnode"

function isLogicalToken(token:string):boolean {
    return BinaryLogicalOperator.SYMBOLS.includes(token) || UnaryLogicalOperator.SYMBOLS.includes(token) || token === '{' || token === '}'
}

function parseExpression(expr:string):LogicalNode {
    expr = expr.trim()
    const regex = /[^\s{}]+|\{|\}/g
    const tokens = expr.match(regex)
    // recoller les tokens qui ne font pas partie de and, or, {, }
    for (let i = 0; i < tokens.length - 1; i++) {
        if (isLogicalToken(tokens[i]) || isLogicalToken(tokens[i + 1])) {
            continue
        }
        tokens[i] = tokens[i] + ' ' + tokens[i + 1]
        tokens.splice(i + 1, 1)
        i--
    }
    const stack = []
    const opStack = []
    let level = 0
    for (const token of tokens) {
        if (token === '{') {
            level++
            continue
        }
        if (token === '}') {
            level--
            if (level < 0) {
                throw new Error(`Erreur de syntaxe : accolades non équilibrées : ${expr}`)
            }
            continue
        }
        if (isLogicalToken(token)) {
            const operator:UnaryLogicalOperator|BinaryLogicalOperator = UnaryLogicalOperator.SYMBOLS.includes(token)
                ? new UnaryLogicalOperator(token, level)
                : new BinaryLogicalOperator(token, level)
            if ((opStack.length > 0) && (opStack[opStack.length - 1].priority >= operator.priority)) {
                const op = opStack.pop()
                op.getCondFromStack(stack)
            }
            opStack.push(operator)
            continue
        }
        // c'est une condition simple
        const condition = SimpleCondition.parse(token)
        if (!condition) {
            throw new Error(`Erreur de syntaxe dans l'expression : ${expr}`)
        }
        stack.push(condition)
    }
    if (level !== 0) {
        throw new Error(`Erreur de syntaxe : accolades non équilibrées : ${expr}`)
    }
    while (opStack.length > 0) {
        const op = opStack.pop()
        op.getCondFromStack(stack)
    }
    if (stack.length !== 1) {
        throw new Error(`Erreur de syntaxe dans l'expression conditionnelle : ${expr}`)
    }
    return stack.pop()
}

export default parseExpression
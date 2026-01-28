import Bloc from './bloc'
import MyMath from '../maths/mymath'
import Affectation from './affectation'
import { substituteParams } from '../maths/misc/substitution'

class UnaryLogicalOperator {
    static SYMBOLS = ['some', 'all'];
    constructor(symbol, priority) {
        if (!UnaryLogicalOperator.SYMBOLS.includes(symbol)) {
            throw new Error(`Opérateur inconnu : ${symbol}`);
        }
        this.symbol = symbol;
        this.priority = priority+0.7;
        this._operand = null;
    }
    getCondFromStack(stack) {
        if (stack.length < 1) {
            throw new Error("Erreur de syntaxe dans l'expression conditionnelle");
        }
        this._operand = stack.pop();
        if (!(this._operand instanceof SimpleCondition || this._operand instanceof BinaryLogicalOperator)) {
            throw new Error("Erreur de syntaxe dans l'expression conditionnelle");
        }
        stack.push(this);
    }
    evaluate(params) {
        if (this._operand === null) {
            throw new Error("Erreur d'évaluation de l'expression conditionnelle");
        }
        const result = this._operand.evaluate(params);
        if (!Array.isArray(result)) {
            return result;
        }
        if (this.symbol === 'some') {
            return result.some(v => v);
        } else {
            return result.every(v => v);
        }
    }
    toString() {
        return `${this.symbol} (${this._operand.toString()})`;
    }
}


class BinaryLogicalOperator {
    static SYMBOLS = ['and', 'or'];
    constructor(symbol, priority) {
        if (!BinaryLogicalOperator.SYMBOLS.includes(symbol)) {
            throw new Error(`Opérateur inconnu : ${symbol}`);
        }
        this.symbol = symbol;
        this.priority = priority;
        if (symbol === 'and') {
            this.priority += .5;
        }
        this._left = null;
        this._right = null;
    }

    getCondFromStack(stack) {
        if (stack.length < 2) {
            throw new Error("Erreur de syntaxe dans l'expression conditionnelle");
        }
        this._right = stack.pop();
        this._left = stack.pop();
        stack.push(this);
    }

    evaluate(params) {
        if (this._left === null || this._right === null) {
            throw new Error("Erreur d'évaluation de l'expression conditionnelle");
        }
        const left = this._left.evaluate(params);
        const right = this._right.evaluate(params);
        if (Array.isArray(left)) {
            if (Array.isArray(right)) {
                if (left.length !== right.length) {
                    throw new Error("Erreur d'évaluation de l'expression conditionnelle : tailles incompatibles");
                }
                if (this.symbol === 'and') {
                    return left.map((v, i) => v && right[i]);
                } else {
                    return left.map((v, i) => v || right[i]);
                }
            } else {
                if (this.symbol === 'and') {
                    return left.map(v => v && right);
                } else {
                    return left.map(v => v || right);
                }
            }
        } else if (Array.isArray(right)) {
            if (this.symbol === 'and') {
                return right.map(v => left && v);
            } else {
                return right.map(v => left || v);
            }
        }
        if (this.symbol === 'and') {
            return left && right;
        } else {
            return left || right;
        }
    }

    toString() {
        return `(${this._left.toString()} ${this.symbol} ${this._right.toString()})`;
    }
}

class SimpleCondition {
    static parse(expr) {
        const regex = /^(.*)(==|<=?|>=?|!=|exists)(.*)$/;
        const m = expr.match(regex);
        if (!m) {
            return null;
        }
        const [,left, operator, right] = m;
        return new SimpleCondition(left, operator, right);
    }

    constructor(left, operator, right) {
        this.left = left.trim()
        this.operator = operator
        this.right = right.trim()
        if (this.operator === 'exists') {
            if (this.right !== '') {
                throw new Error(`L'opérateur 'exists' ne doit pas avoir d'opérande à droite (${this.right}).`);
            }
            if (!/^@\w*$/.test(this.left)) {
                throw new Error(`L'opérateur 'exists' doit être précédé d'un paramètre de forme @name valide (${this.left}).`);
            }
        }
    }

    evaluate(params) {
        if (this.operator === 'exists') {
            const paramName = this.left.substring(1);
            return params.hasOwnProperty(paramName);
        }
        const left = substituteParams(this.left, params)
        const right = substituteParams(this.right, params)
        if (Array.isArray(left)) {
            if (Array.isArray(right)) {
                if (left.length !== right.length) {
                    throw new Error("Erreur d'évaluation de l'expression conditionnelle : tailles incompatibles");
                }
                return left.map((v, i) => MyMath.compare(v, right[i], this.operator));
            } else {
                return left.map(v => MyMath.compare(v, right, this.operator));
            }
        }
        if (Array.isArray(right)) {
            return right.map(v => MyMath.compare(left, v, this.operator));
        }
        
        return MyMath.compare(left, right, this.operator)
    }

    toString() {
        return `${this.left} ${this.operator} ${this.right}`;
    }
}

class CondBloc {
    static tryParse(line) {
        const regex = /^<(if|elif|needed|until)(\s+.*)?>$/;
        const m = line.match(regex);
        if (!m) {
            return null;
        }
        const [, tag, paramsString] = m;
        if (tag === 'needed') {
            return new Needed(tag, paramsString);
        }
        if (tag === 'until') {
            return new Until(tag, paramsString);
        }
        return new IfBloc(tag, paramsString);
    }

    static isElse(line) {
        return /^<\s*else\s*>$/.test(line);
    }

    static isNeeded(item) {
        return (item !== null && item instanceof Needed);
    }

    static isUntil(item) {
        return (item !== null && item instanceof Until);
    }

    static _isLogicalToken(token) {
        return BinaryLogicalOperator.SYMBOLS.includes(token) || UnaryLogicalOperator.SYMBOLS.includes(token) || token === '{' || token === '}';
    }

    static parseExpression(expr) {
        expr = expr.trim();
        const regex = /[^\s{}]+|\{|\}/g;
        const tokens = expr.match(regex)
        // recoller les tokens qui ne font pas partie de and, or, {, }
        for (let i = 0; i < tokens.length - 1; i++) {
            if (CondBloc._isLogicalToken(tokens[i]) || CondBloc._isLogicalToken(tokens[i + 1])) {
                continue;
            }
            tokens[i] = tokens[i] + ' ' + tokens[i + 1];
            tokens.splice(i + 1, 1);
            i--;
        }
        const stack = [];
        const opStack = [];
        let level = 0;
        for (const token of tokens) {
            if (token === '{') {
                level++;
                continue;
            }
            if (token === '}') {
                level--;
                if (level < 0) {
                    throw new Error(`Erreur de syntaxe : accolades non équilibrées : ${expr}`);
                }
                continue;
            }
            if (CondBloc._isLogicalToken(token)) {
                const operator = UnaryLogicalOperator.SYMBOLS.includes(token)
                    ? new UnaryLogicalOperator(token, level)
                    : new BinaryLogicalOperator(token, level);
                if ((opStack.length > 0) && (opStack[opStack.length - 1].priority >= operator.priority)) {
                    const op = opStack.pop();
                    op.getCondFromStack(stack);
                }
                opStack.push(operator);
                continue;
            }
            // c'est une condition simple
            const condition = SimpleCondition.parse(token);
            if (!condition) {
                throw new Error(`Erreur de syntaxe dans l'expression : ${expr}`);
            }
            stack.push(condition);
        }
        if (level !== 0) {
            throw new Error(`Erreur de syntaxe : accolades non équilibrées : ${expr}`);
        }
        while (opStack.length > 0) {
            const op = opStack.pop();
            op.getCondFromStack(stack);
        }
        if (stack.length !== 1) {
            throw new Error(`Erreur de syntaxe dans l'expression conditionnelle : ${expr}`);
        }
        return stack.pop();
    }
}

class Until extends Bloc {
    static MAXITERATIONS = 100
    #counter
    constructor(tag, paramsString) {
        super(tag, paramsString, false)
        this.#counter = 0
        this._expression = CondBloc.parseExpression(paramsString);
    }
    
    toString() {
        return `<until ${this._expression.toString()} ${this.closed ? '' : '*'}>`;
    }

    push(child) {
        if (this.closed) {
            throw new Error("Impossible d'ajouter un enfant à un bloc fermé");
        }
        // until ne peut avoir que des affectations comme enfants
        if (!(child instanceof Affectation) && !(child instanceof IfBloc)) {
            throw new Error("Un bloc <until> ne peut contenir que des affectations et des If.");
        }
        this._children.push(child);
    }

    run(params, caller) {
        // renvoie les enfants et le until ensuite en incrémentant le compteur
        this.#counter += 1
        if (this.#counter > Until.MAXITERATIONS) {
            throw new Error(`<until> MAXITERATIONS = ${Until.MAXITERATIONS} dépassé.`)
        }
        if (this._expression.evaluate(params)) {
            return []
        }
        const children = [...this._children]
        children.push(this)
        return children
    }

    /*doAffectations(params, options) {
        let iterations = 0;
        do {
            for (const child of this._children) {
                child.doAffectation(params, options);
            }
            iterations++;
        } while (! && (iterations < this.MAXITERATIONS));
        return iterations < this.MAXITERATIONS;
    }*/
}


class Needed extends Bloc {
    constructor(tag, paramsString) {
        super(tag, paramsString, true);
        this._expression = CondBloc.parseExpression(paramsString);
    }
    toString() {
        return `<needed ${this._expression.toString()}>`;
    }

    run(params, caller) {
        return this._expression.evaluate(params) ? [] : null;
    }
}

class IfBloc extends Bloc {
    static END = '<endif>'
    static ENDIF = 'endif'
    static IF = 'if'
    static ELIF = 'elif'

    _ifClosed = false;
    _elseChildren = [];
    _expression = null;

    constructor(tag, paramsString) {
        super(tag, paramsString, false);
        this._expression = paramsString?CondBloc.parseExpression(paramsString):null;
    }

    closeIfBranch() {
        if (this.tag !== IfBloc.IF && this.tag !== IfBloc.ELIF) {
            throw new Error("Seuls les blocs if et elif peuvent être fermés avec une branche else");
        }
        if (this._ifClosed) {
            throw new Error("La branche if est déjà fermée. Vérifiez l'enchaînement de vos if, elif, else.");
        }
        this._ifClosed = true;
    }

    _evaluateCondition(params) {
        if (!this._expression) {
            return true;
        }
        return this._expression.evaluate(params);
    }

    push(child) {
        if (this.closed) {
            throw new Error("Impossible d'ajouter un enfant à un bloc fermé");
        }
        if (this._ifClosed) {
            this._elseChildren.push(child);
        } else {
            this._children.push(child);
        }
    }

    toString() {
        let out = `<${this.tag} ${this._expression?this._expression.toString():''} ${this.closed ? '' : '*'}>`;
        for (const child of this._children) {
            out += `\n  ${child.toString().replace(/\n/g, '\n  ')}`;
        }
        if (this._elseChildren.length > 0) {
            out += `\n<else>`;
            for (const child of this._elseChildren) {
                out += `\n  ${child.toString().replace(/\n/g, '\n  ')}`;
            }
        }
        out += `\n${IfBloc.END}`;
        return out;
    }

    run(params, caller) {
        const result = this._evaluateCondition(params);
        const ifChildren = result ? this._children : this._elseChildren;
        return ifChildren;
    }
}

export { IfBloc, CondBloc};
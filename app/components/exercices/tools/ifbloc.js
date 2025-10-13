import { substituteLabels } from './misc.js';
import Bloc from './bloc.js';
import MyMath from '@tools/mymath.js';

class Operator {
    constructor(symbol, priority) {
        if (symbol !== 'and' && symbol !== 'or') {
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
        const regex = /^([\w@]+)\s*([=!]=)\s*([\w@]+)$/;
        const m = expr.match(regex);
        if (!m) {
            return null;
        }
        const [,left, operator, right] = m;
        return new SimpleCondition(left, operator, right);
    }

    constructor(left, operator, right) {
        this.left = left;
        this.operator = operator;
        this.right = right;
    }

    evaluate(params) {
        const left = MyMath.evaluate(substituteLabels(this.left, params));
        const right = MyMath.evaluate(substituteLabels(this.right, params));
        return (left === right) === (this.operator === '==');
    }

    toString() {
        return `${this.left} ${this.operator} ${this.right}`;
    }
}

class IfBloc extends Bloc {
    static END = '<endif>'
    static ENDIF = 'endif'
    static ELSE = 'else'
    static ELIF = 'elif'
    static NEEDED = 'needed'

    _ifClosed = false;
    _elseChildren = [];
    _expression = null;

    static parse(line) {
        const regex = /^<(if|elif|else|needed)\s*(\s[^>]+)?>$/;
        const m = line.match(regex);
        if (!m) {
            return null;
        }
        const [, tag, paramsString] = m;
        return new IfBloc(tag, paramsString);
    }

    static parseExpression(expr) {
        expr = expr.trim();
        const regex = /[^\s{}]+|\{|\}/g;
        const tokens = expr.match(regex)
        // recoller les tokens qui ne sont pas des bouts de end
        for (let i = 0; i < tokens.length - 1; i++) {
            if (tokens[i] == 'and' || tokens[i] == 'or' || tokens[i] == '{' || tokens[i] == '}') {
                continue;
            }
            if (tokens[i + 1] == 'and' || tokens[i + 1] == 'or' || tokens[i + 1] == '{' || tokens[i + 1] == '}') {
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
            if ((token == "and") || (token == "or")) {
                const operator = new Operator(token, level);
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

    /** Fonction qui teste une condition sur un ensemble de paramètres
     * @param {object} condition  { left: string, right: string, operator:string }
     * @param {object} params 
     * @returns {boolean}
     */
    static testSingleCondition(condition, params) {
        const left = MyMath.evaluate(substituteLabels(condition.left, params));
        const right = MyMath.evaluate(substituteLabels(condition.right, params));
        return (left === right) === (condition.operator === '==');
    }

    constructor(tag, paramsString) {
        super(tag, paramsString, false);
        if (this.tag === IfBloc.ELSE && paramsString) {
            throw new Error("Erreur de syntaxe : else ne doit pas avoir de condition");
        }
        if (this.tag == IfBloc.NEEDED) {
            this.close();
        }
        this._expression = paramsString?IfBloc.parseExpression(paramsString):null;
    }

    closeIfBranch() {
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
        if (this.tag === IfBloc.NEEDED && !result) {
            return null;
        }
        const ifChildren = result ? this._children : this._elseChildren;
        return ifChildren;
    }
}

export default IfBloc;
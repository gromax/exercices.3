import BlocParent from './blocparent.js';
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
        const left = MyMath.evaluate(BlocParent.substituteLabels(this.left, params));
        const right = MyMath.evaluate(BlocParent.substituteLabels(this.right, params));
        return (left === right) === (this.operator === '==');
    }

    toString() {
        return `${this.left} ${this.operator} ${this.right}`;
    }
}

class IfBloc extends BlocParent {
    static END = '<endif>'
    closed = false;

    static parse(line) {
        const regex = /^<(if|elif|else|needed)\s*(\s[^>]+)?>$/;
        const m = line.match(regex);
        if (!m) {
            return null;
        }
        const [, type, paramsString] = m;
        return new IfBloc(type, paramsString);
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
        const left = MyMath.evaluate(BlocParent.substituteLabels(condition.left, params));
        const right = MyMath.evaluate(BlocParent.substituteLabels(condition.right, params));
        return (left === right) === (condition.operator === '==');
    }

    constructor(type, paramsString) {
        super();
        this.type = type;
        if (this.type === 'else' && paramsString) {
            throw new Error("Erreur de syntaxe : else ne doit pas avoir de condition");
        }
        if (this.type == 'needed') {
            this.closed = true;
        }
        this.expression = paramsString?IfBloc.parseExpression(paramsString):null;
        this.elseChildren = [];
    }

    /**
     * ajoute un bloc elif ou else en tant que else d'un bloc parent
     * @param {IfBloc|null} elseCondition 
     */
    pushElse(elseCondition) {
        if (elseCondition === null) {
            return;
        }
        if ((elseCondition.type !== 'elif') && (elseCondition.type !== 'else')) {
            throw new Error("Erreur de syntaxe : doit être else ou elif");
        }
        if (this.closed) {
            throw new Error("Erreur de syntaxe : une condition fermée ne peut pas avoir de else");
        }
        this.closed = true;
        if (this.type === 'else') {
            throw new Error("Erreur de syntaxe : else ne peut pas avoir de else");
        }
        if (elseCondition.type === 'else') {
            this.elseChildren = elseCondition.children;
            return;
        }
        // c'était un elif
        elseCondition.type = 'if';
        this.elseChildren.push(elseCondition);
    }

    evaluateCondition(params, options) {
        if (!this.expression) {
            return true;
        }
        return this.expression.evaluate({...params, ...options});
    }

    toString() {
        let out = `<${this.type} ${this.expression?this.expression.toString():''} ${this.closed ? '' : '*'}>`;
        for (const child of this.children) {
            out += `\n  ${child.toString().replace(/\n/g, '\n  ')}`;
        }
        if (this.elseChildren.length > 0) {
            out += `\n<else>`;
            for (const child of this.elseChildren) {
                out += `\n  ${child.toString().replace(/\n/g, '\n  ')}`;
            }
        }
        out += `\n${IfBloc.END}`;
        return out;
    }

    run(params, options) {
        const result = this.evaluateCondition(params, options);
        if (this.type == 'needed' && !result) {
            throw Error("Condition 'needed' non satisfaite");
        }
        const ifChildren = result ? this.children : this.elseChildren;
        return ifChildren;
    }
}

export default IfBloc;
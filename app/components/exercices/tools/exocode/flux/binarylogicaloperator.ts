import LogicalNode from "./logicalnode"
import { InputType } from "@types"

class BinaryLogicalOperator extends LogicalNode {
    private symbol:string
    private _priority:number
    private _left?:LogicalNode
    private _right?:LogicalNode

    static readonly SYMBOLS = ['and', 'or'];
    constructor(symbol:string, priority:number) {
        super()
        if (!BinaryLogicalOperator.SYMBOLS.includes(symbol)) {
            throw new Error(`Opérateur inconnu : ${symbol}`);
        }
        this.symbol = symbol;
        this._priority = priority;
        if (symbol === 'and') {
            this._priority += .5;
        }
    }

    getCondFromStack(stack:Array<LogicalNode>) {
        if (stack.length < 2) {
            throw new Error("Erreur de syntaxe dans l'expression conditionnelle");
        }
        this._right = stack.pop();
        this._left = stack.pop();
        stack.push(this);
    }

    evaluate(params:Record<string,InputType>):boolean|Array<boolean> {
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

    get priority():number {
        return this._priority
    }

    toString():string {
        return `(${this._left.toString()} ${this.symbol} ${this._right.toString()})`;
    }
}

export default BinaryLogicalOperator

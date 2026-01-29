import SimpleCondition from "./simplecondition"
import BinaryLogicalOperator from "./binarylogicaloperator"
import { InputType } from "@types"
import LogicalNode from "./logicalnode"

class UnaryLogicalOperator extends LogicalNode {
    static readonly SYMBOLS = ['some', 'all']
    private symbol:string
    private _priority:number
    private _operand?:SimpleCondition|BinaryLogicalOperator

    constructor(symbol:string, _priority:number) {
        super()
        if (!UnaryLogicalOperator.SYMBOLS.includes(symbol)) {
            throw new Error(`Opérateur inconnu : ${symbol}`);
        }
        this.symbol = symbol;
        this._priority = _priority+0.7;
        this._operand = null;
    }

    get priority():number {
        return this._priority
    }

    getCondFromStack(stack:Array<any>):void {
        if (stack.length < 1) {
            throw new Error("Erreur de syntaxe dans l'expression conditionnelle");
        }
        this._operand = stack.pop();
        if (!(this._operand instanceof SimpleCondition || this._operand instanceof BinaryLogicalOperator)) {
            throw new Error("Erreur de syntaxe dans l'expression conditionnelle");
        }
        stack.push(this);
    }

    evaluate(params:Record<string,InputType>):boolean {
        if (typeof this._operand === "undefined") {
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

    toString():string {
        return `${this.symbol} (${this._operand.toString()})`;
    }
}

export default UnaryLogicalOperator
import parseExpression from "./logicalparser"
import LogicalNode from "./logicalnode"
import Bloc from "../blocs/bloc"
import { InputType } from "@types"
import Node from "../node"

class Needed extends Bloc {
    private _expression:LogicalNode

    constructor(tag:string, paramsString:string) {
        super(tag, paramsString, true);
        this._expression = parseExpression(paramsString);
    }
    toString():string {
        return `<needed ${this._expression.toString()}>`;
    }

    run(params:Record<string,InputType>, caller:any):Array<Node>|null {
        return this._expression.evaluate(params) ? [] : null;
    }
}

export default Needed
import parseExpression from "./logicalparser"
import LogicalNode from "./logicalnode"
import Bloc from "../blocs/bloc"
import { TParams } from "@types"
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

    run(params:TParams, caller:any):Array<Node>|null {
        const success = this._expression.evaluate(params)
        if (Array.isArray(success)) {
            throw new Error("<needed> : La condition ne devrait pas renvoyer un tableau")
        }
        return success ? [] : null;
    }
}

export default Needed
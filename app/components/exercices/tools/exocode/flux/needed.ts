import parseExpression from "./logicalparser"
import LogicalNode from "./logicalnode"
import { TParams } from "@types"
import { SimpleNode } from "../node"

class Needed extends SimpleNode {
    private _expression:LogicalNode

    constructor(tag:string, paramsString:string) {
        super(tag)
        this._expression = parseExpression(paramsString)
    }
    toString():string {
        return `<needed ${this._expression.toString()}>`
    }

    runSimple(params:TParams):"nothing"|"halt" {
        const success = this._expression.evaluate(params)
        if (Array.isArray(success)) {
            throw new Error("<needed> : La condition ne devrait pas renvoyer un tableau")
        }
        return success ? "nothing" : "halt"
    }
}

export default Needed
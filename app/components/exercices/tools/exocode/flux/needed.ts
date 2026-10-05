import parseExpression from "./logicalparser"
import LogicalNode from "./logicalnode"
import { TParams } from "@types"
import { FluxNode } from "../node"

class Needed extends FluxNode {
    private _expression:LogicalNode

    constructor(tag:string, paramsString:string) {
        super(tag)
        this._expression = parseExpression(paramsString)
    }
    toString():string {
        return `<needed ${this._expression.toString()}>`
    }

    goOn(params:TParams):boolean {
        const success = this._expression.evaluate(params)
        if (Array.isArray(success)) {
            throw new Error("<needed> : La condition ne devrait pas renvoyer un tableau")
        }
        return success
    }
}

export default Needed
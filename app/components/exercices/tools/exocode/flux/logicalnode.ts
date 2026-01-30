import { TParams, NestedArray } from "@types"

abstract class LogicalNode {
    abstract evaluate(params:TParams):NestedArray<boolean>
    abstract toString():string
}

export default LogicalNode
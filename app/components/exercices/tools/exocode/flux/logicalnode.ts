import { InputType } from "@types"

abstract class LogicalNode {
    abstract evaluate(params:Record<string,InputType>):boolean|Array<boolean>
    abstract toString():string
}

export default LogicalNode
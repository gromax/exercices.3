import type { TParams } from "@types"
import { Node } from "../node"

abstract class FluxNode extends Node {
    abstract goOn(params:TParams):boolean
}

export { FluxNode }
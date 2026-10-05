import _ from 'underscore'
import { FluxBloc } from '../blocs/bloc'
import type { Node } from "../node"
import { TParams } from "@types"

    
class ShuffleBloc extends FluxBloc {
    constructor(tag:string, paramsString:string) {
        super(tag, paramsString, false)
    }

    getFlux(params:TParams):Array<Node> {
        return _.shuffle(this._children)
    }
}

export { ShuffleBloc }

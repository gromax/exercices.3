import _ from 'underscore'
import { FluxBloc } from './fluxbloc'
import type { Node } from "../node"
import { TParams } from "@types"

    
class ShuffleBloc extends FluxBloc {
    getFlux(params:TParams):Array<Node> {
        return _.shuffle(this._children)
    }
}

export { ShuffleBloc }

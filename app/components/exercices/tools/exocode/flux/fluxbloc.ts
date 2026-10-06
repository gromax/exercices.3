import { Bloc } from '../blocs/bloc'
import type { Node } from '../node'
import { TParams } from '@types'

abstract class FluxBloc extends Bloc {
    abstract getFlux(params:TParams):Array<Node>
}

export { FluxBloc }
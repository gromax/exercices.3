import { Node } from '../node'
import { TParams } from '@types'

abstract class SimpleNode extends Node {
    abstract runSimple(params:TParams):SimpleNode|null
}

export { SimpleNode }
import { InputType } from "@mathstools/misc/check"
import Bloc from "./blocs/bloc"

abstract class Node {
    protected _tag: string
    protected _runned:boolean

    constructor(tag:string) {
        this._tag = tag
        this._runned = false
    }

    get tag():string {
        return this._tag
    }

    abstract run(params:Record<string, InputType>, caller:any):null|Node|Array<Node>
}

export default Node
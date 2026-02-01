import { getValue } from '../maths/misc/substitution.js'
import MyMath from '@mathstools/mymath'
import { TParams, NestedInput } from "@types"
import { Node, TRunResult } from "./node"

class Parameter extends Node {
    private _param:string
    static readonly REGEX = /^<(\w+(?:\[\])?)\s*:(.*)\/>$/
    static parse(line:string):Parameter|null {
        const m = line.match(Parameter.REGEX)
        if (m) {
            return new Parameter(m[1], m[2])
        } else {
            return null
        }
    }

    constructor(tag:string, paramsString:string) {
        super(tag)
        this._param = paramsString.trim()
    }

    getParam(params:TParams):NestedInput {
        return getValue(this._param, params) ?? MyMath.substituteExpressions(this._param, params)
    }

    run(params:TParams):TRunResult {
        return "nothing"
    }

    toString():string {
        return `<${this._tag} : ${this._param} />`
    }
}

export default Parameter
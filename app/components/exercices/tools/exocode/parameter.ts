import { getValue } from '../maths/misc/substitution'
import MyMath from '@mathstools/mymath'
import { TParams, NestedInput } from "@types"
import { SimpleNode } from "./node"

class Parameter extends SimpleNode {
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

    runSimple(params:TParams):null {
        return null
    }

    toString():string {
        return `<${this._tag} : ${this._param} />`
    }
}

export default Parameter
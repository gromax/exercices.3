import { getValue } from '../maths/misc/substitution.js';
import MyMath from '@mathstools/mymath';
import Bloc from './blocs/bloc.js'
import { TParams } from "@types"

class Parameter {
    private _tag:string
    private _param:string
    static readonly REGEX = /^<(\w+(?:\[\])?)\s*:(.*)\/>$/;
    static parse(line:string):Parameter|null {
        const m = line.match(Parameter.REGEX);
        if (m) {
            return new Parameter(m[1], m[2]);
        } else {
            return null;
        }
    }

    constructor(tag:string, paramsString:string) {
        this._tag = tag;
        this._param = paramsString.trim();
    }

    run(params:TParams, caller:Bloc):null {
        if (caller instanceof Bloc) {
            this._param = getValue(this._param, params) ?? MyMath.substituteExpressions(this._param, params);
            caller.setParam(this._tag, this._param);
        }
        return null;
    }

    toString():string {
        return `<${this._tag} : ${this._param} />`;
    }
}

export default Parameter;
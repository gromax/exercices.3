import { getValue } from '@mathstools/misc/substitution'
import MyMath from '@mathstools/mymath'
import { Node, TRunResult } from './node'
import { TParams } from "@types"

class Option extends Node{
    private _key:string
    private _value:string

    static readonly REGEX = /^(@?[\w]+)\s*=>(.*)/;
    static parse(line:string):Option|null {
        const m = line.match(Option.REGEX);
        if (m) {
            return new Option(m[1], m[2]);
        } else {
            return null;
        }
    }

    private constructor(key:string, value:string) {
        super("option")
        this._key = key;
        this._value = value.trim();
    }

    get key():string {
        return this._key;
    }
    
    get value():string {
        return this._value;
    }

    getValue(params:TParams):[string,string] {
        const key = this._key.startsWith('@')
            ? getValue(this._key, params)
            : this._key
        if (Array.isArray(key)) {
            throw new Error(`${this.toString()} : Une clé d'option ne peut être un tableau`)
        }
        const value = MyMath.substituteExpressions(this._value, params);
        return [String(key), value]
    }

    run(params:TParams):TRunResult {
        return "nothing"
    }

    toString():string {
        return `${this._key} => ${this._value}`;
    }
}

export default Option;
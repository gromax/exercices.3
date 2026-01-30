import { getValue } from '@mathstools/misc/substitution'
import Bloc from './blocs/bloc'
import MyMath from '@mathstools/mymath'
import Node from './node'
import { InputType, TParams } from "@types"

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

    run(params:TParams, caller:Bloc):null {
        const key = this._key.startsWith('@')
            ? getValue(this._key, params)
            : this._key;
        const value = MyMath.substituteExpressions(this._value, params);
        if (!caller) {
            throw new Error("L'option doit être exécutée dans le contexte d'un bloc appelant.")
        }
        caller.setOption(key, value);
        return null;
    }

    toString():string {
        return `${this._key} => ${this._value}`;
    }
}

export default Option;
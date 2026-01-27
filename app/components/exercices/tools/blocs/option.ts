import { getValue } from '@mathstools/misc/substitution'
import Bloc from './bloc'
import MyMath from '@mathstools/mymath'

class Option {
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
        this._key = key;
        this._value = value.trim();
    }

    get key():string {
        return this._key;
    }
    
    get value():string {
        return this._value;
    }

    run(params:Record<string, any>, caller:Bloc):null {
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

    toString() {
        return `${this._key} => ${this._value}`;
    }
}

export default Option;
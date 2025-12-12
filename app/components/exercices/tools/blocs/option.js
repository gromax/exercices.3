import { getValue } from '@mathstools/misc/substitution'
import MyMath from '@mathstools/mymath'

class Option {
    static REGEX = /^(@?[\w]+)\s*=>(.*)/;
    static parse(line) {
        const m = line.match(Option.REGEX);
        if (m) {
            return new Option(m[1], m[2]);
        } else {
            return null;
        }
    }

    constructor(key, value) {
        this._key = key;
        this._value = value.trim();
    }

    get key() {
        return this._key;
    }
    
    get value() {
        return this._value;
    }

    run(params, caller) {
        const key = this._key.startsWith('@')
            ? getValue(this._key, params)
            : this._key;
        const value = MyMath.substituteExpressions(this._value, params);
        if (caller && typeof caller.setOption === 'function') {
            caller.setOption(key, value);
        }
        return null;
    }

    toString() {
        return `${this._key} => ${this._value}`;
    }
}

export default Option;
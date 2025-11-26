import { substituteLabels } from '../maths/misc/substitution.js';
import MyNerd from '../maths/mynerd.js';

class Option {
    static REGEX = /^([\w]+)\s*=>(.*)/;
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
        const value = MyNerd.substituteExpressions(this._value, params);
        if (caller && typeof caller.setOption === 'function') {
            caller.setOption(this._key, value);
        }
        return null;
    }

    toString() {
        return `${this._key} => ${this._value}`;
    }
}

export default Option;
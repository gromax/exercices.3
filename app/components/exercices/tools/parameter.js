import { substituteLabels } from './misc.js';

class Parameter {
    static REGEX = /^<(\w+)\s*:([^>/]+)\/>$/;
    static parse(line) {
        const m = line.match(Parameter.REGEX);
        if (m) {
            return new Parameter(m[1], m[2]);
        } else {
            return null;
        }
    }

    constructor(tag, param) {
        this._tag = tag;
        this._param = param.trim();
        this._parent = null;
    }

    run(params, caller) {
        if (caller && typeof caller.setParam === 'function') {
            this._param = substituteLabels(this._param, params);
            caller.setParam(this._tag, this._param);
        }
        return null;
    }

    toString() {
        return `<${this._tag} : ${this._param} />`;
    }
}

export default Parameter;
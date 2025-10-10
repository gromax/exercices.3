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

    setParent(node) {
        if (node) {
            this._parent = node;
        }
    }

    run(params) {
        if (this._parent) {
            this._parent.setParam(this._tag, this._param);
        }
        return null;
    }

    toString() {
        return `<${this._tag} : ${this._param} />`;
    }
}

export default Parameter;
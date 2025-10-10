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

    setParent(node) {
        if (node) {
            this._parent = node;
        }
    }

    run(params) {
        if (this._parent) {
            this._parent.setParam(this._key, this._value);
        }
        return null;
    }

    toString() {
        return `${this._key} => ${this._value}`;
    }
}

export default Option;
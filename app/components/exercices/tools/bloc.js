import BlocParent from './blocparent.js';

class Bloc extends BlocParent {
    closed = false;

    static parse(line) {
        const regex = /^<(\w+)\s*(\s[^>]+)?>$/;
        const m = line.match(regex);
        if (m=== null) {
            return null;
        }
        const label = m[1];
        let paramsString = m[2] ? m[2] : '';
        let ended = false;
        if (paramsString.endsWith('/')) {
            ended = true;
            paramsString = paramsString.slice(0, -1);
        }
        paramsString = paramsString.trim();
        return new Bloc(line, label, paramsString, ended);
    }

    constructor(label, paramsString, closed) {
        super();
        this.label = label;
        this.params = paramsString;
        this.closed = closed;
    }


}

export default Bloc;
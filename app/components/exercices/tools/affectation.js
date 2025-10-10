import { substituteLabels } from './misc.js';
import MyMath from '@tools/mymath.js';

class Affectation {
    static parse(line) {
        const regex = /^@([a-zA-Z_][a-zA-Z0-9_]*)\s*(:?=)\s*(.+)$/;
        const m = line.match(regex);
        if (!m) {
            return null;
        }
        const [, tag, operator, value] = m;
        return new Affectation(tag, operator, value);
    }

    constructor(tag, operator, value) {
        this._tag = tag;
        this._operator = operator;
        this._value = value;
    }

    doAffectation(params, protectedParams) {
        if (!(this._tag in params) && (this._operator === '=')) {
            throw new Error(`Vous devez utiliser = pour un paramètre déjà défini : ${this._tag}`);
        }
        if (this._tag in protectedParams) {
            throw new Error(`Le paramètre ${this._tag} est protégé et ne peut pas être redéfini.`);
        }
        if ((this._tag in params) && (this._operator === ':=')) {
            return; // ne fait rien si le paramètre existe déjà
        }
        const substituted = substituteLabels(this._value, { ...params, ...protectedParams });
        params[this._tag] = MyMath.evaluate(substituted);
    }

    toString() {
        return `@${this._tag} ${this._operator} ${this._value}`;
    }

    run(params) {
        this.doAffectation(params, {});
        return null;
    }
}

export default Affectation;
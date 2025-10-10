import { substituteLabels } from './misc.js';
import MyMath from '@tools/mymath.js';

class Affectation {
    static parse(line) {
        const regex = /^@([a-zA-Z_][a-zA-Z0-9_]*)\s*(:?=)\s*(.+)$/;
        const m = line.match(regex);
        if (!m) {
            return null;
        }
        const [, label, operator, value] = m;
        return new Affectation(label, operator, value);
    }

    constructor(label, operator, value) {
        this.label = label;
        this.operator = operator;
        this.value = value;
    }

    doAffectation(params, protectedParams) {
        if (!(this.label in params) && (this.operator === '=')) {
            throw new Error(`Vous devez utiliser = pour un paramètre déjà défini : ${this.label}`);
        }
        if (this.label in protectedParams) {
            throw new Error(`Le paramètre ${this.label} est protégé et ne peut pas être redéfini.`);
        }
        if ((this.label in params) && (this.operator === ':=')) {
            return; // ne fait rien si le paramètre existe déjà
        }
        const substituted = substituteLabels(this.value, { ...params, ...protectedParams });
        params[this.label] = MyMath.evaluate(substituted);
    }

    toString() {
        return `@${this.label} ${this.operator} ${this.value}`;
    }

    run(params) {
        this.doAffectation(params, {});
        return null;
    }
}

export default Affectation;
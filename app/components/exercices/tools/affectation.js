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

    /**
     * Réalise l'affectation dans params
     * protectedParams sont des paramètres protégés qui ne peuvent pas être modifiés
     * saved est un tableau des paramètres précédemment définis
     * il peuvent donc être écrasés seulement si on le force avec :=
     * @param {object} params 
     * @param {object} protectedParams 
     * @param {array} saved 
     */
    doAffectation(params, protectedParams, saved = []) {
        if (saved.includes(this._tag) && (this._operator === '=')) {
            // fonctionnement normal, on ignore l'affectation si déjà défini
            // ignoré si déjà défini et opérateur =
            return;
        }
        if (this._tag in protectedParams) {
            // situation anormale, on ne peut pas écraser un paramètre protégé
            throw new Error(`Le paramètre ${this._tag} est protégé et ne peut pas être redéfini.`);
        }
        params[this._tag] = MyMath.evaluate(this._value, { ...params, ...protectedParams });
    }

    toString() {
        return `@${this._tag} ${this._operator} ${this._value}`;
    }

    run(params, caller) {
        this.doAffectation(params, {});
        return null;
    }
}

export default Affectation;
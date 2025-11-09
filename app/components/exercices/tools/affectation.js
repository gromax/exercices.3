import MyMath from '@tools/mymath.js';

class Affectation {
    static parse(line) {
        const regex = /^@([a-zA-Z_][a-zA-Z0-9_]*)\s*(<:(.+)>)?=\s*(.+)$/;
        const m = line.match(regex);
        if (!m) {
            return null;
        }
        const [, tag, , repeater, value] = m;
        return new Affectation(tag, repeater, value);
    }

    constructor(tag, repeater, value) {
        this._tag = tag;
        this._value = value;
        this._repeater = repeater;
    }

    /**
     * Réalise l'affectation dans params
     * protectedParams sont des paramètres protégés qui ne peuvent pas être modifiés
     * @param {object} params 
     * @param {object} protectedParams 
     */
    doAffectation(params, protectedParams) {
        if (this._tag in protectedParams) {
            // situation anormale, on ne peut pas écraser un paramètre protégé
            throw new Error(`Le paramètre ${this._tag} est protégé et ne peut pas être redéfini.`);
        }
        if (this._tag.startsWith('__')) {
            // situation anormale, on ne peut pas définir un paramètre réservé
            throw new Error(`Le paramètre ${this._tag} est interdit (commence par __).`);
        }
        if (this._repeater === undefined) {
            params[this._tag] = MyMath.evaluate(this._value, { ...params, ...protectedParams });
            return;
        }
        const n = Number(MyMath.evaluate(this._repeater, { ...params, ...protectedParams }));
        if (!Number.isInteger(n) || n < 0) {
            throw new Error(`La valeur de répétition pour le paramètre ${this._tag} doit être un entier positif.`);
        }
        const arr = [];
        for (let i = 0; i < n; i++) {
            arr.push(MyMath.evaluate(this._value, { ...params, ...protectedParams, __i: i }));
        }
        params[this._tag] = arr;
    }

    toString() {
        if (this._repeater!==undefined) {
            return `@${this._tag} <:${this._repeater}> = ${this._value}`;
        }
        return `@${this._tag} = ${this._value}`;
    }

    run(params, caller) {
        this.doAffectation(params, {});
        return null;
    }
}

export default Affectation;
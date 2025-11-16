import MyMath from '../mathstools/mymath.js';

class Affectation {
    static parse(line) {
        const regex = /^@([a-zA-Z_][a-zA-Z0-9_]*)(\[\])?\s*(?:<:(.+)>)?=\s*(.+)$/;
        const m = line.match(regex);
        if (!m) {
            return null;
        }
        const [, tag, brackets, repeater, value] = m;
        const isArray = brackets !== undefined;
        return new Affectation(tag, repeater, value, isArray);
    }

    constructor(tag, repeater, value, isArray) {
        this._tag = tag;
        this._value = value;
        this._repeater = repeater;
        this._isArray = isArray;
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
        if (this._isArray && params[this._tag] !== undefined && !Array.isArray(params[this._tag])) {
            throw new Error(`Le paramètre ${this._tag} doit être un tableau.`);
        }
        if (this._isArray && params[this._tag] !== undefined) {
            params[this._tag] = [];
        }
        if (this._repeater === undefined) {
            const value = MyMath.evaluate(this._value, { ...params, ...protectedParams });
            if (this._isArray) {
                params[this._tag].push(value);
            } else {
                params[this._tag] = value;
            }
            return;
        }
        const r = MyMath.getValue(this._repeater, { ...params, ...protectedParams }) ?? this._repeater;
        const arr = [];
        if (Array.isArray(r)) {
            // cas d'un répéteur tableau
            for (let i = 0; i < r.length; i++) {
                arr.push(MyMath.evaluate(this._value, { ...params, ...protectedParams, __v: r[i], __i: i }));
            }
        } else {
            // cas d'un répéteur entier
            const n = Number(r);
            if (!Number.isInteger(n) || n < 0) {
                throw new Error(`La valeur de répétition pour le paramètre ${this._tag} doit être un entier positif ou un tableau.`);
            }
            for (let i = 0; i < n; i++) {
                arr.push(MyMath.evaluate(this._value, { ...params, ...protectedParams, __i: i }));
            }

        }
        if (this._isArray) {
            params[this._tag].push(arr);
        } else {
            params[this._tag] = arr;
        }
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
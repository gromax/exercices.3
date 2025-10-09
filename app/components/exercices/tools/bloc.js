/**
 * L'objectif de cette classe est de gérer des blocs
 * de rendu identifiés par une balise de type <label param1 param2 ...>
 */

import Parent from './parent.js';
import TextNode from './textnode.js';
import { UnknownView } from '../run/views.js';

class Bloc extends Parent {
    constructor(label, paramsString, closed) {
        super(closed);
        this._label = label;
        this._paramsString = paramsString;
        this._isParameter = (closed === true) && (paramsString !== "");
        this._params = { header:paramsString };
    }

    setParam(label, value) {
        this._params[label] = value;
    }

    get params() {
        return this._params;
    }

    get isParameter() {
        return this._isParameter;
    }

    get label() {
        return this._label;
    }

    /**
     * Exécute les morceaux de code du bloc
     * et effectue les substitutions de texte nécessaire
     * de façon à obtenir un bloc de texte final qui pourra
     * être rendu.
     * @param {Object} params 
     */
    run(params, options) {
        if (this.isParameter) {
            return null;
        }
        let program = [...this.children];
        let i = 0;
        while (i<program.length) {
            let item = program[i];
            if ((item instanceof Bloc) && item.isParameter) {
                this.setParam(item.label, item.params);
                program.splice(i, 1);
                continue;
            }
            const runned = item.run(params, options);
            if (runned === null) {
                program.splice(i, 1);
            } else if (Array.isArray(runned)) {
                program.splice(i, 1, ...runned);
                continue
            } else {
                program[i] = runned;
                i++;
            }
        }
        return {
            label: this.label,
            params: this.params,
            content: program
        }
    }

    toView(params, options) {
        if (this.isParameter) {
            throw new Error("Un bloc de paramètre ne peut pas être converti en vue");
        }
        return new UnknownView({ name:this.label, code: this.toString() });
    }

    parseOption() {
        if (this.label !== 'option') {
            throw new Error("Seul un bloc <option> peut être analysé par cette méthode");
        }
        if (this._paramsString === '') {
            throw new Error("Un bloc <option> doit pas avoir une étiquette <option:étiquette>");
        }
        if (this.children.length === 0) {
            throw new Error("Un bloc <option> doit contenir au moins une ligne");
        }
        let defaultValue = null;
        const values = {};
        for (const line of this.children) {
            if (!(line instanceof TextNode)) {
                throw new Error("Un bloc <option> ne peut contenir que du texte");
            }
            const text = line.text;
            if (text === '') {
                continue;
            }
            const m = text.match(/^([0-9]+)\s*=>\s*(.*)/);
            if (!m) {
                throw new Error("Format de ligne invalide dans un bloc <option>");
            }
            const key = m[1];
            if (defaultValue === null) {
                defaultValue = key;
            }
            const value = m[2];
            if (values.hasOwnProperty(key)) {
                throw new Error("Clé dupliquée dans un bloc <option> : " + key);
            }
            values[key] = value;
        }
        return [this._paramsString, defaultValue, values];
    }

    toString() {
        let out = `<${this.label}>`;
        for (const child of this.children) {
            out += `\n  ${child.toString().replace(/\n/g, '\n  ')}`;
        }
        out += `\n</${this.label}>`;
        return out;
    }

}

export default Bloc;
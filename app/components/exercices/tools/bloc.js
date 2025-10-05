/**
 * L'objectif de cette classe est de gérer des blocs
 * de rendu identifiés par une balise de type <label param1 param2 ...>
 */

import BlocParent from './blocparent.js';
import Affectation from './affectation.js';
import IfBloc from './ifbloc.js';

class Bloc extends BlocParent {
    static parse(line) {
        const regex = /^<(\w+)\s*(:\s+[^>]+)?(\/)?>$/;
        const m = line.match(regex);
        if (m=== null) {
            return null;
        }
        const label = m[1];
        const closed = (m[3] !== undefined);
        const paramsString = m[2] ? m[2].slice(1,0).trim() : '';
        return new Bloc(label, paramsString, closed);
    }

    constructor(label, paramsString, closed) {
        super(closed);
        this.label = label;
        this._paramsString = paramsString;
        this._isParameter = (closed === true) && (paramsString !== "");
        this._evaluationResult = null;
    }

    /**
     * Exécute les morceaux de code du bloc
     * et effectue les substitutions de texte nécessaire
     * de façon à obtenir un bloc de texte final qui pourra
     * être rendu.
     * @param {Object} params 
     */
    evaluate(params, options) {
        let program = [...this.children];
        let i = 0;
        while (i<program.length) {
            let item = program[i];
            if (typeof item === 'string') {
                program[i] = BlocParent.substituteLabels(item, {...params, ...options});
                i++;
                continue;
            }
            if (item instanceof Affectation) {
                item.doAffectation(params, ...options);
                program.splice(i, 1);
                continue;
            }
            if ((item instanceof IfBloc) && (item.type === 'needed')) {
                const result = item.evaluate(params, options);
                if (!result) {
                    throw Error("Condition 'needed' non satisfaite");
                }
                program.splice(i, 1);
                continue;
            }
            if (item instanceof IfBloc) {
                const result = item.evaluate(params, options);
                const ifChildren = result ? item.children : item.elseChildren;
                program.splice(i + 1, 0, ...ifChildren);
                program.splice(i, 1);
                continue;
            }

            if (!(item instanceof Bloc)) {
                throw new Error("Instruction inconnue dans un bloc : " + item);
            }

            if (item.isParameter) {
                this.setParam(item.label, item.params);
                program.splice(i, 1);
                continue;
            }
            item.evaluate(params, options);
            i++;
        }
        this._evaluationResult = program;
    }

    parseOption() {
        if (this.label !== 'option') {
            throw new Error("Seul un bloc <option> peut être analysé par cette méthode");
        }
        if (this._paramsString !== '') {
            throw new Error("Un bloc <option> ne doit pas avoir de paramètres");
        }
        if (this._paramsString === 'defaults') {
            throw new Error("Une option ne peut avoir l'étiquette 'defaults'");
        }
        if (this.children.length === 0) {
            throw new Error("Un bloc <option> doit contenir au moins une ligne");
        }
        let defaultValue = null;
        const values = {};
        for (const line of this.children) {
            if (typeof line !== 'string') {
                throw new Error("Un bloc <option> ne peut contenir que du texte");
            }
            const m = line.match(/^([0-9]+)\s*=>\s*(.*)/);
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
}

export default Bloc;
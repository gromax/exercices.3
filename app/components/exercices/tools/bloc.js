/**
 * L'objectif de cette classe est de gérer des blocs
 * de rendu identifiés par une balise de type <label param1 param2 ...>
 */

import BlocParent from './blocparent.js';
import Affectation from './affectation.js';
import IfBloc from './ifbloc.js';

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
        this.evaluationResult = null;
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
            if (item instanceof IfBloc) {
                const result = item.evaluate(params, options);
                if (item.type === 'needed') {
                    if (!result) {
                        throw Error("Condition 'needed' non satisfaite");
                    }
                    program.splice(i, 1);
                    continue;
                }
                const ifChildren = result ? item.children : item.elseChildren;
                program.splice(i + 1, 0, ...ifChildren);
                program.splice(i, 1);
                continue;
            }
            if (item instanceof Bloc) {
                item.evaluate(params, options);
                i++;
                continue;
            }
            throw new Error("Instruction inconnue dans un bloc : " + item);
        }
        this.evaluationResult = program;
    }


}

export default Bloc;
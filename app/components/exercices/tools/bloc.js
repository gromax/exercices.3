/**
 * L'objectif de cette classe est de gérer des blocs
 * de rendu identifiés par une balise de type <tag param1 param2 ...>
 */

import { UnknownView } from '../run/views.js';

class Bloc {
    constructor(tag, paramsString, closed) {
        this._children = [];
        this._closed = closed || false;
        this._paramsString = paramsString;
        this._params = { header:paramsString };
        this._runned = false;
        this._tag = tag;
        this._category = tag;
    }

    setParam(key, value) {
        this._params[key] = value;
    }

    get header() {
        return this._paramsString || '';
    }

    get params() {
        return this._params;
    }

    get category() {
        return this._category;
    }

    get tag() {
        return this._tag;
    }

    get children() {
        return this._children;
    }

    close() {
        this._closed = true;
    }

    get closed() {
        return this._closed;
    }

    push(child) {
        if (this.closed) {
            throw new Error("Impossible d'ajouter un enfant à un bloc fermé");
        }
        this._children.push(child);
    }

    /**
     * Exécute les morceaux de code du bloc
     * et effectue les substitutions de texte nécessaire
     * de façon à obtenir un bloc de texte final qui pourra
     * être rendu.
     * @param {Object} params
     * @param {Bloc|null} caller le bloc appelant
     */
    run(params, caller) {
        if (this._runned) {
            throw new Error(`Le bloc <${this.tag}> a déjà été exécuté.`);
        }
        this._runned = true;
        const pile = [...this._children].reverse();
        this._children = [];
        while (pile.length > 0) {
            let item = pile.pop();
            const runned = item.run(params, this);
            if (runned === null) {
                continue;
            }
            if (Array.isArray(runned)) {
                pile.push(...runned.reverse());
            } else {
                this._children.push(runned);
            }
        }
        return this;
    }

    view(entity) {
        if (!this._runned) {
            throw new Error("Le bloc doit être exécuté avant de pouvoir générer des vues.");
        }
        if (typeof this._customView === 'function') {
            return this._customView(entity);
        }
        return new UnknownView({ name:this.tag, code: this.toString() });
    }

    parseOption() {
        if (this.category !== 'option') {
            throw new Error("Seul un bloc <option> peut être analysé par cette méthode");
        }
        if (this._paramsString === '') {
            throw new Error("Un bloc <option> doit avoir une étiquette <option:étiquette>");
        }
        this.run({});
        return [this._paramsString, this._defaultOption, this._options];
    }

    setOption(key, value) {
        if (this._defaultOption === undefined) {
            this._defaultOption = key;
        }
        if (this._options === undefined) {
            this._options = {};
        }
        this._options[key] = value;
    }

    toString() {
        let out = `<${this.tag}>`;
        for (const child of this._children) {
            out += `\n  ${child.toString().replace(/\n/g, '\n  ')}`;
        }
        out += `\n</${this.tag}>`;
        return out;
    }

}

export default Bloc;
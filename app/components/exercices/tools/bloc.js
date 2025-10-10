/**
 * L'objectif de cette classe est de gérer des blocs
 * de rendu identifiés par une balise de type <label param1 param2 ...>
 */

import TextNode from './textnode.js';
import { UnknownView } from '../run/views.js';

class Bloc {
    constructor(label, paramsString, closed) {
        this._children = [];
        this._closed = closed || false;
        this._label = label;
        this._paramsString = paramsString;
        this._isParameter = (closed === true) && (paramsString !== "");
        this._params = { header:paramsString };
        this._executionChildren = null;
        this._parent = null;
    }

    reset() {
        this._executionChildren = null;
        this._params = { header:this._paramsString };
    }

    setParent(parent) {
        this._parent = parent;
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
        if (child instanceof Bloc) {
            child.setParent(this);
        }
        this._children.push(child);
    }

    stopRun() {
        return false;
    }

    /**
     * Exécute les morceaux de code du bloc
     * et effectue les substitutions de texte nécessaire
     * de façon à obtenir un bloc de texte final qui pourra
     * être rendu.
     * @param {Object} params 
     */
    run(params) {
        if (this._executionChildren) {
            // déjà exécuté
            return this;
        }
        if (this.isParameter) {
            if (this._parent) {
                this._parent.setParam(this.label, this._paramsString);
            }
            return null;
        }
        const pile = [...this._children].reverse();
        this._executionChildren = [];
        while (pile.length > 0) {
            let item = pile.pop();
            const runned = item.run(params);
            if (runned === null) {
                continue;
            }
            if (Array.isArray(runned)) {
                pile.push(...runned.reverse());
            } else {
                this._executionChildren.push(runned);
            }
        }
        return this;
    }

    toView(params) {
        if (this.isParameter) {
            return this.run(params);
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
        if (this._children.length === 0) {
            throw new Error("Un bloc <option> doit contenir au moins une ligne");
        }
        let defaultValue = null;
        const values = {};
        for (const line of this._children) {
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
        for (const child of this._children) {
            out += `\n  ${child.toString().replace(/\n/g, '\n  ')}`;
        }
        out += `\n</${this.label}>`;
        return out;
    }

}

export default Bloc;
/**
 * L'objectif de cette classe est de gérer des blocs
 * de rendu identifiés par une balise de type <tag param1 param2 ...>
 */

import TextNode from './textnode.js';
import Option from './option.js';
import { UnknownView } from '../run/views.js';

class Bloc {
    constructor(tag, paramsString, closed) {
        this._children = [];
        this._closed = closed || false;
        this._paramsString = paramsString;
        this._params = { header:paramsString };
        this._executionChildren = null;
        this._parent = null;
        this._tag = tag;
        this._category = tag;
    }

    reset() {
        this._executionChildren = null;
        this._params = { header:this._paramsString };
    }

    setParent(parent) {
        this._parent = parent;
    }

    setParam(key, value) {
        this._params[key] = value;
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
        if (typeof child.setParent === 'function') {
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
        return new UnknownView({ name:this.tag, code: this.toString() });
    }

    parseOption() {
        if (this.category !== 'option') {
            throw new Error("Seul un bloc <option> peut être analysé par cette méthode");
        }
        if (this._paramsString === '') {
            throw new Error("Un bloc <option> doit pas avoir une étiquette <option:étiquette>");
        }
        
        let defaultValue = null;
        const values = {};
        const items = this._children.filter(item => item instanceof Option);
        if (items.length === 0) {
            throw new Error("Un bloc <option> doit contenir au moins une ligne key => value");
        }
        for (const item of items) {
            const key = item.key;
            if (defaultValue === null) {
                defaultValue = key;
            }
            const value = item.value;
            if (values.hasOwnProperty(key)) {
                throw new Error("Clé dupliquée dans un bloc <option> : " + key);
            }
            values[key] = value;
        }
        return [this._paramsString, defaultValue, values];
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
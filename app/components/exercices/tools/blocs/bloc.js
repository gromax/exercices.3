/**
 * L'objectif de cette classe est de gérer des blocs
 * de rendu identifiés par une balise de type <tag param1 param2 ...>
 */
import UnknownView from '../blocsviews/unknownview.js';
import TableView from '../blocsviews/tableview.js';

class Bloc {
    constructor(tag, paramsString, closed) {
        this._children = [];
        this._closed = closed || false;
        this._paramsString = paramsString;
        this._params = { header:paramsString };
        this._runned = false;
        this._tag = tag;
    }

    /**
     * Ajoute un paramètre au bloc
     * Si ce paramètre existe déjà, le paramètre devient un tableau
     * [] n'est donc requis que si on veut forcer  un tableau
     * avec une seule valeur
     * @param {string} key 
     * @param {*} value 
     */
    setParam(key, value) {
        const realKey = key.endsWith('[]')
            ? key.slice(0, -2)
            : key;
        if (this._params[realKey] !== undefined) {
            if (!Array.isArray(this._params[realKey])) {
                this._params[realKey] = [this._params[realKey], value];
            } else {
                this._params[realKey].push(value);
            }
            return;
        }
        if (key.endsWith('[]')) {
            // bien que ce soit la première valeur, on l'a met en tableau
            this._params[realKey] = [value];
        } else {
            this._params[realKey] = value
        }
    }

    get header() {
        return this._paramsString || '';
    }

    get params() {
        return this._params;
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
        if (this.tag ==="shuffle") {
            // on mélange les enfants
            return _.shuffle(this._children);
        }
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

    view(answers) {
        if (!this._runned) {
            throw new Error("Le bloc doit être exécuté avant de pouvoir générer des vues.");
        }
        if (typeof this._customView === 'function') {
            return this._customView(answers);
        }
        if (this._tag === 'table') {
            return new TableView({
                rows: this._params.rows || [],
                rowheaders: this._params.rowheaders || null,
                colheaders: this._params.colheaders || null
            });
        }
        return new UnknownView({ name:this.tag, code: this.toString() });
    }

    parseOption() {
        if (this._tag !== 'option') {
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

    nombrePts() {
        let count = 0;
        for (const item of this._children){
            if (typeof item.nombrePts === 'function') {
                count += item.nombrePts();
            }
        }
        return count;
    }

}

export default Bloc;
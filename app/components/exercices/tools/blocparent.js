class BlocParent {
    /**
     * remplace les labels @label dans une expression par leur valeur
     * @param {string} expr une expression
     * @param {object} params les paramètres connus
     * @returns {string} une chaîne où les paramètres connus ont été remplacés par leur valeur
     */
    static substituteLabels(expr, params) {
        return expr.replace(/@(\w+)/g, (match, label) => {
            if (!params.hasOwnProperty(label)) {
                return `@${label}`; // ne remplace pas si le paramètre n'existe pas
            }
            return String(params[label]);
        });
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
        this.children.push(child);
    }

    constructor(closed) {
        this.children = [];
        this._closed = closed || false;
    }

    setParam(label, value) {
        if (this.params === undefined) {
            this.params = {};
        }
        this.params[label] = value;
    }

    toString() {
        let out = `<BlocParent>`;
        for (const child of this.children) {
            out += `\n  ${child.toString().replace(/\n/g, '\n  ')}`;
        }
        out += `\n</BlocParent>`;
        return out;
    }
}

export default BlocParent;
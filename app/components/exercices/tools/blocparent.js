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

    push(child) {
        if (child instanceof BlocParent) {
            this.children.push(child);
            return;
        }
        if (typeof child !== 'string') {
            throw new Error("Un bloc ne peut contenir que des blocs ou du texte");
        }
        let lastChild = this.children[this.children.length - 1];
        if (typeof lastChild === 'string') {
            this.children[this.children.length - 1] = lastChild + '\n' + child;
            return;
        }
        this.children.push(child);
    }

    constructor() {
        this.children = [];
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
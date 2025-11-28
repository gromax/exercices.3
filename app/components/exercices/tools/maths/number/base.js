import Decimal from 'decimal.js';
Decimal.set({ precision: 50, rounding: Decimal.ROUND_HALF_UP });

class Base {
    /**
     * transtypage vers string
     * @returns {string}
     */
    toString() {
        return "(?)";
    }

    /**
     * priorité
     */
    get priority() {
        return 0;
    }

    /**
     * si un nom est précisé, renvoie true si le nœud dépend de la variable,
     * sinon renvoie la liste des variables dont dépend le noeud
     * @param {string|undefined} name 
     * @returns {boolean|Array}
     */
    isFunctionOf(name){
        if (typeof name == 'undefined') {
            return [];
        }
        return false;
    }

    /**
     * Test simple qui vérifie qu'au moins les calcul type
     * nombre + nombre ou nombre * nombre son développés
     * @returns {boolean}
     */
    isExpanded() {
        return true;
    }

    /**
     * renvoie une représentation tex
     * @returns {string}
     */
    toTex() {
        return "(?)"
    }

    /**
     * evaluation numérique en decimal
     * @param {object|undefined} values
     * @returns {Decimal}
     */
    toDecimal(values) {
        return Decimal(NaN);
    }

    /**
     * renvoie une signature représentant le contenu symbolique d'un noeud
     * @returns {Array<string>}
     */
    signature() {
        return [`(${this.toString()})`];
    }
}

export { Base };
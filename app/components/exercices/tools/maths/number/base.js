import Decimal from 'decimal.js';
Decimal.set({ precision: 50, rounding: Decimal.ROUND_HALF_UP });

class Base {
    _canBeDistributed = false // pour test sur la distributivité
    _isNumber = false         // pour test si le noeud est un nombre

    /**
     * transtypage vers string
     * @returns {string}
     */
    toString() {
        return "(?)";
    }

    /**
     * transtypage vers string version anglaise
     */
    toStringEn() {
        return this.toString();
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
            return []
        }
        return false
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
     * simplification symbolique
     * pour des simplifications simples
     * @returns {Base}
     */
    simplify() {
        return this;
    }

    /**
     * renvoie une signature représentant le contenu symbolique d'un noeud
     * @returns {Array<string>}
     */
    signature() {
        return [`(${this.toString()})`];
    }

    /**
     * prédicat : le noeud est-il nul ?
     * @returns {boolean}
     */
    isZero() {
        return false;
    }

    /**
     * prédicat : le noeud est-il égal à 1 ?
     * @returns {boolean}
     */
    isOne() {
        return false;
    }

    /**
     * crée un clone avec la variable substituée par la valeur donnée
     * @param {string} varName 
     * @param {Base|number} value 
     * @returns {Base}
     */
    substituteVariable(varName, value) {
        return this;
    }

    /**
     * substitue d'un coup plusieurs variables
     * @param {object} substitutions de forme {varName: Base|number, ...}
     * @returns {Base}
     */
    substituteVariables(substitutions) {
        return this;
    }

    /**
     * construit une fonction à partir du noeud
     * @param {Array<string>} order ordre des variables
     * @returns {Function}
     */
    buildFunction(order) {
        if (typeof order === 'undefined') {
            order = this.isFunctionOf()
        }
        const self = this
        return function(...args) {
            let values = {}
            for (let i = 0; i < order.length; i++) {
                values[order[i]] = args[i];
            }
            return self.substituteVariables(values).toDecimal(values).toNumber()
        }
    }

    /**
     * Renvoie une version où les calculs numériques sont effectués en Decimal
     * par exemple 4/5 * x devient 0.8 * x
     */
    Decimalize() {
        return this
    }

    /**
     * Transforme to les décimaux en une version fixée à n chiffres
     * @param {*} n 
     * @returns 
     */
    toFixed(n) {
        return this
    }
}

export { Base };
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
     * scalaire pouvant être factorisé
     */
    scalar(){
        throw new Error("Base.scalars Pas implémentée !");
    }

    /**
     * renvoie la partie du noeud sans les scalaires pouvant être factorisés
     * @returns {Base}
     */
    noScalar() {
        return this;
    }

    /**
     * renvoie la chaîne dépourvue de scalaires pour identifier un groupe dans une somme
     * @returns {string}
     */
    noScalarString() {
        return String(this.noScalar());
    }

    /**
     * renvoie la chaîne sous une forme standardisée, avec le scalaire
     * @returns {Base}
     */
    withScalarString() {
        let signature = this.noScalarString();
        let scalarString = String(this.scalar());
        if (signature == "1") {
            return scalarString;
        }
        if (scalarString =="1") {
            return signature;
        }
        return scalarString + signature;
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
     * renvoie une représentation tex
     * @returns {string}
     */
    tex() {
        return "(?)"
    }
}

export { Base };
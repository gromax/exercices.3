class TSymbol {
    /** @type {string} */
    #name;
  
    /**
     * constructeur
     * @param {string} name 
     */
    constructor (name) {
        this.#name = name;
    }
    
    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        return this.#name;
    }

    static sREGEX = "[∞πa-zA-Z_\\x7f-\\xff][a-zA-Z0-9_\\x7f-\\xff]*";
    static REGEX = new RegExp("[∞πa-zA-Z_\\x7f-\\xff][a-zA-Z0-9_\\x7f-\\xff]*", 'i');

    /**
     * renvoie le niveau de priorité
     * @type {number}
     */
    get priority() {
        return 0;
    }

    /**
     * prédicat : peut-il y avoir un opérateur binaire sur la gauche ?
     * @returns {boolean}
     */
    acceptOperOnLeft() {
        return true;
    }

    /**
     * prédicat : peut-il y avoir un opérateur binaire sur la droite ?
     * @returns {boolean}
     */
    acceptOperOnRight() {
        return true;
    }

    /**
     * prédicat : Le token agit-il sur sa gauche ?
     * @returns {boolean}
     */
    operateOnLeft() {
        return false;
    }

    /**
     * prédicat : Le token agit-il sur sa droite ?
     * @returns {boolean}
     */
    operateOnRight() {
        return false;
    }

}

export { TSymbol }
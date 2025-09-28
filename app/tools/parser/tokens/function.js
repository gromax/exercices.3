class TFunction {
    /** @type {string} */
    #name;
    constructor(name) {
        if (name == 'racine') {
            name = 'sqrt';
        }
        this.#name = name;
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        return this.#name;
    }

    static sREGEX = "sqrt|racine|cos|sin|ln|exp|frac";
    static REGEX = new RegExp("sqrt|racine|cos|sin|ln|exp|frac", 'i');
  
    /**
     * renvoie le niveau de priorité
     * @type {number}
     */
    get priority() {
        return 10;
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
        return false;
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
        return true;
    }

}

export { TFunction }
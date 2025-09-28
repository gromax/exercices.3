
/* Noter que le token doit mémoriser aussi bien la valeur nombre que la façon dont il est écrit */

class TNumber {
    /** @type{string} */
    #saisie;

    /**
     * constructeur
     * @param {string} chaine 
     */
    constructor(chaine) {
        this.#saisie = chaine;
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        return this.#saisie;
    }

    static sREGEX = '\\d+[.,]?\\d*(E-?\\d+)?%?';
    static REGEX = new RegExp('\\d+[.,]?\\d*(E-?\\d+)?%?', 'i');

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

export { TNumber }
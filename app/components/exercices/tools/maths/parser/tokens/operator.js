class TOperator {
    /** @type {string} */
    #opType;
    
    /** constructeur
     * @param {string} opType
     */
    constructor(opType) {
        if (opType === "cdot" || opType === "×" || opType === "⋅") {
            this.#opType = "*";
        } else if (opType === "÷") {
            this.#opType = "/";
        } else {
            this.#opType = opType;
        }
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        return this.#opType;
    }

    static sREGEX = "[*×⋅\\+\\-\\/\\^÷;]|cdot";
    static REGEX = new RegExp("[*×⋅\\+\\-\\/\\^÷;]|cdot", 'i');

    /**
     * renvoie le niveau de priorité
     * @type {number}
     */
    get priority() {
        switch (this.#opType) {
            case "^":
                return 9;
            case "(-)":
                return 8;
            case "(+)":
                return 8;
            case "*":
                return 7;
            case "/":
                return 7;
            case "+":
                return 6;
            case "-":
                return 6;
            default:
                return 1;
        }
    }

    /**
     * prédicat : peut-il y avoir un opérateur binaire sur la gauche ?
     * @returns {boolean}
     */
    acceptOperOnLeft() {
        return (this.#opType == "(-)") || (this.#opType =="(+)");
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
        return !((this.#opType == "(-)") || (this.#opType == "(+)"));
    }

    /**
     * prédicat : Le token agit-il sur sa droite ?
     * @returns {boolean}
     */
    operateOnRight() {
        return true;
    }

    /**
     * essaie de changer l'opérateur binaire en une version unaire
     * @returns {boolean}
     */
    changeToArityOne() {
        if (this.#opType == '-') {
            this.#opType = '(-)';
            return true;
        } else if (this.#opType == '+') {
            this.#opType = "(+)";
            return true;
        }
        return false;
    }
}

export { TOperator };
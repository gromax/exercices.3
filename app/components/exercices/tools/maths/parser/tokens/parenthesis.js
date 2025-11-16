class TParenthesis {
    /** @type {boolean} */
    #ouvrant;
    /** @type {string} */
    #symbol; 

    /**
     * constructeur
     * @param {string} token 
     */
    constructor (token) {
        this.#ouvrant = ((token == "(") || (token == "{") || (token == "["));
        this.#symbol = token;
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString() {
        if (this.#ouvrant) {
            return "(";
        }
        return ")";
    }

    static sREGEX = "[\\(\\{\\}\\)\\[\\]]";
    static REGEX = new RegExp("[\\(\\{\\}\\)]" ,'i');

    /**
     * renvoie le symbole
     * @type {string}
     */
    get symbol() {
        return this.#symbol;
    }    

    /**
     * prédicat : peut-il y a voir un opérateur binaire sur la gauche ?
     * @returns {boolean}
     */
    acceptOperOnLeft() {
        return this.#ouvrant;
    }

    /**
     * prédicat : peut-il y avoir un opérateur binaire sur la droite ?
     * @returns {boolean}
     */
    acceptOperOnRight() {
        return ! this.#ouvrant;
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

    /**
     * accesseur
     * @type {boolean}
     */
    get ouvrant() {
        return this.#ouvrant;
    }

    /**
     * accesseur
     * @type {boolean}
     */
    get fermant() {
        return !this.#ouvrant;
    }

    /**
     * accesseur
     * @type {boolean}
     */
    get jumeau() {
        if (this.#symbol == "}") {
            return "{";
        }
        if (this.#symbol == ")") {
            return "(";
        }
        if (this.#symbol == "]") {
            return "[";
        }
        if (this.#symbol == "{") {
            return "}";
        }
        if (this.#symbol == "(") {
            return ")";
        }
        if (this.#symbol == "[") {
            return "]";
        }

        throw new Error(`Parenthèse invalide : ${this.#symbol}`);
    }
}

export { TParenthesis }
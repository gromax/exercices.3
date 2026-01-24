import { Token } from "./token"

class TParenthesis extends Token {
    /** @type {boolean} */
    private _ouvrant:boolean
    /** @type {string} */
    private _symbol:string

    /**
     * constructeur
     * @param {string} token 
     */
    constructor (token:string) {
        super()
        this._ouvrant = ((token == "(") || (token == "{") || (token == "["))
        this._symbol = token
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString():string {
        if (this._ouvrant) {
            return "("
        }
        return ")"
    }

    static readonly sREGEX = "[\\(\\{\\}\\)\\[\\]]"
    static readonly REGEX = new RegExp("[\\(\\{\\}\\)]" ,'i')

    /**
     * renvoie le symbole
     * @type {string}
     */
    get symbol():string {
        return this._symbol
    }    

    /**
     * prédicat : peut-il y a voir un opérateur binaire sur la gauche ?
     * @returns {boolean}
     */
    acceptOperOnLeft(): boolean {
        return this._ouvrant
    }

    /**
     * prédicat : peut-il y avoir un opérateur binaire sur la droite ?
     * @returns {boolean}
     */
    acceptOperOnRight(): boolean {
        return ! this._ouvrant
    }

    /**
     * renvoie le niveau de priorité
     * @type {number}
     */
    get priority():number {
        return -1 // priorité la plus basse
    }

    /**
     * prédicat : Le token agit-il sur sa gauche ?
     * @returns {boolean}
     */
    operateOnLeft(): boolean {
        return false
    }

    /**
     * prédicat : Le token agit-il sur sa droite ?
     * @returns {boolean}
     */
    operateOnRight(): boolean {
        return false
    }

    /**
     * accesseur
     * @type {boolean}
     */
    get ouvrant(): boolean {
        return this._ouvrant
    }

    /**
     * accesseur
     * @type {boolean}
     */
    get fermant(): boolean {
        return !this._ouvrant
    }

    /**
     * accesseur
     * @type {string}
     */
    get jumeau() {
        if (this._symbol == "}") {
            return "{"
        }
        if (this._symbol == ")") {
            return "(";
        }
        if (this._symbol == "]") {
            return "[";
        }
        if (this._symbol == "{") {
            return "}";
        }
        if (this._symbol == "(") {
            return ")";
        }
        if (this._symbol == "[") {
            return "]";
        }

        throw new Error(`Parenthèse invalide : ${this._symbol}`);
    }
}

export { TParenthesis }
import { Token } from "./token"

/**
 * Représente les tokens utiles pour la gestion d'un ensemble
 */

class TEnsemble extends Token {
    /** @type {string} */
    private _symbol:string

    /** @type {Array<Token>} */
    private _subTokensList?:Array<Token>

    /**
     * constructeur
     * @param {string} token 
     */
    constructor (token:string) {
        super()
        this._symbol = token
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString():string {
        return this._symbol
    }

    static readonly sREGEX = "[\\[\\]∩∪∅]"
    static readonly REGEX = new RegExp("[\\[\\]∩∪∅]" ,'i')

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
        return this.isInterval || this._symbol == "∅"
    }

    /**
     * prédicat : peut-il y avoir un opérateur binaire sur la droite ?
     * @returns {boolean}
     */
    acceptOperOnRight(): boolean {
        return this.isInterval || this._symbol == "∅"
    }

    /**
     * renvoie le niveau de priorité
     * @type {number}
     */
    get priority():number {
        switch (this._symbol) {
            case "∩": return 7
            case "∪": return 6
            case "∅": return 0
            case "[]": return 0
            case "[[": return 0
            case "]]": return 0
            case "][": return 0
            default: return -1
        }
    }

    get isInterval(): boolean {
        return this._symbol === "[]" || this._symbol === "[[" || this._symbol === "]]" || this._symbol === "]["
    }

    get isBracket(): boolean {
        return this._symbol === "[" || this._symbol === "]"
    }

    /**
     * prédicat : Le token agit-il sur sa gauche ?
     * @returns {boolean}
     */
    operateOnLeft(): boolean {
        return this._symbol === "∪" || this._symbol === "∩"
    }

    /**
     * prédicat : Le token agit-il sur sa droite ?
     * @returns {boolean}
     */
    operateOnRight(): boolean {
        return this._symbol === "∪" || this._symbol === "∩"
    }

    /**
     * Assigne la liste de sous-tokens à l'intervalle
     * @param {Array<Token>} subTokensList La liste de sous-tokens à assigner
     * @returns {void}
     */
    setSubTokensList(subTokensList:Array<Token>): void {
        if (!this.isInterval) {
            throw new Error("Impossible d'assigner des sous-tokens à un token qui n'est pas un intervalle.")
        }
        this._subTokensList = subTokensList
    }

    /**
     * Récupère la liste de sous-tokens de l'intervalle
     * @type {Array<Token>}
     */
    get subTokenList(): Array<Token>  {
        if (!this.isInterval) {
            throw new Error("Impossible de récupérer les sous-tokens d'un token qui n'est pas un intervalle.")
        }
        return this._subTokensList || []
    }

    /**
     * renvoie l'arité du token (0 si non applicable, 1 pour unaire, 2 pour binaire)
     * @returns {0|1|2}
     */
    get arity():0|1|2 {
        if (this._symbol === "∪" || this._symbol === "∩") {
            return 2
        }
        return 0
    }

    isEmptySet(): boolean {
        return this._symbol === "∅"
    }
}

export { TEnsemble }
import { Token } from "./token"

class TNumber extends Token {
    /** @type{string} */
    private saisie:string

    /**
     * constructeur
     * @param {string} chaine 
     */
    constructor(chaine:string) {
        super()
        this.saisie = chaine
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString():string {
        return this.saisie;
    }

    static readonly sREGEX = '\\d+[.,]?\\d*(E-?\\d+)?%?'
    static readonly REGEX = new RegExp('\\d+[.,]?\\d*(E-?\\d+)?%?', 'i')

    /**
     * renvoie le niveau de priorité
     * @type {number}
     */
    get priority():number {
        return 0
    }

    /**
     * prédicat : peut-il y avoir un opérateur binaire sur la gauche ?
     * @returns {boolean}
     */
    acceptOperOnLeft(): boolean {
        return true
    }

    /**
     * prédicat : peut-il y avoir un opérateur binaire sur la droite ?
     * @returns {boolean}
     */
    acceptOperOnRight(): boolean {
        return true
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
}

export { TNumber }
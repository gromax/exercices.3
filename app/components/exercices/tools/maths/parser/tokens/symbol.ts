import { Token } from "./token"

class TSymbol extends Token {
    /** @type {string} */
    private _name
  
    /**
     * constructeur
     * @param {string} name 
     */
    constructor (name:string) {
        super()
        this._name = name
    }
    
    /**
     * transtypage -> string
     * @returns {string}
     */
    toString():string {
        return this._name
    }

    static readonly sREGEX = "[∞πa-zA-Z_][a-zA-Z0-9_]*"
    static readonly REGEX = new RegExp("[∞πa-zA-Z_][a-zA-Z0-9_]*", 'i')

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

export { TSymbol }
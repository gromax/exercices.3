import { Token } from './token';

class TFunction extends Token {
    /** @type {string} */
    private name:string

    constructor(name:string) {
        super()
        if (name == 'racine') {
            name = 'sqrt';
        }
        this.name = name;
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString():string {
        return this.name
    }

    static readonly sREGEX = "sqrt|racine|cos|sin|ln|log|exp|frac|sign";
    static readonly REGEX = new RegExp("sqrt|racine|cos|sin|ln|log|exp|frac|sign", 'i');
  
    /**
     * renvoie le niveau de priorité
     * @type {number}
     */
    get priority():number {
        return 10
    }

    /**
     * prédicat : peut-il y avoir un opérateur binaire sur la gauche ?
     * @returns {boolean}
     */
    acceptOperOnLeft():boolean {
        return true
    }

    /**
     * prédicat : peut-il y avoir un opérateur binaire sur la droite ?
     * @returns {boolean}
     */
    acceptOperOnRight():boolean {
        return false
    }

    /**
     * prédicat : Le token agit-il sur sa gauche ?
     * @returns {boolean}
     */
    operateOnLeft():boolean {
        return false
    }

    /**
     * prédicat : Le token agit-il sur sa droite ?
     * @returns {boolean}
     */
    operateOnRight():boolean {
        return true
    }
}

export { TFunction }
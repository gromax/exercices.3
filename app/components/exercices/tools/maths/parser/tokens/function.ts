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

    static readonly sREGEX = "sqrt|racine|cos|sin|tan|atan|ln|log|exp|frac|sign|mod|div|diff|pgcd|ppcm|max|min|abs";
    static readonly REGEX = new RegExp("sqrt|racine|cos|sin|tan|atan|ln|log|exp|frac|sign|mod|div|diff|pgcd|ppcm|max|min|abs", 'i');
  
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

    /**
     * renvoie l'arité du token (0 si non applicable, 1 pour unaire, 2 pour binaire)
     * @returns {0|1|2}
     */
    get arity():0|1|2 {
        return 1
    }
}

export { TFunction }
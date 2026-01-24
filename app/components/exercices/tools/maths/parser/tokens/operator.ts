import { Token } from "./token";

class TOperator extends Token {
    /** @type {string} */
    private opType:string
    
    /** constructeur
     * @param {string} opType
     */
    constructor(opType:string) {
        super()
        if (opType === "cdot" || opType === "×" || opType === "⋅") {
            this.opType = "*";
        } else if (opType === "÷") {
            this.opType = "/";
        } else {
            this.opType = opType;
        }
    }

    /**
     * transtypage -> string
     * @returns {string}
     */
    toString():string {
        return this.opType;
    }

    static readonly sREGEX = "[*×⋅\\+\\-\\/\\^÷;]|cdot"
    static readonly REGEX = new RegExp("[*×⋅\\+\\-\\/\\^÷;]|cdot", 'i')

    /**
     * renvoie le niveau de priorité
     * @type {number}
     */
    get priority():number {
        switch (this.opType) {
            case "^":
                return 9
            case "(-)":
                return 8
            case "(+)":
                return 8
            case "*":
                return 7
            case "/":
                return 7
            case "+":
                return 6
            case "-":
                return 6
            default:
                return 1
        }
    }

    /**
     * prédicat : peut-il y avoir un opérateur binaire sur la gauche ?
     * @returns {boolean}
     */
    acceptOperOnLeft():boolean {
        return (this.opType == "(-)") || (this.opType =="(+)")
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
        return !((this.opType == "(-)") || (this.opType == "(+)"))
    }

    /**
     * prédicat : Le token agit-il sur sa droite ?
     * @returns {boolean}
     */
    operateOnRight():boolean {
        return true
    }

    /**
     * essaie de changer l'opérateur binaire en une version unaire
     * @returns {boolean}
     */
    changeToArityOne():boolean {
        if (this.opType == '-') {
            this.opType = '(-)';
            return true;
        } else if (this.opType == '+') {
            this.opType = "(+)";
            return true;
        }
        return false;
    }
}

export { TOperator }
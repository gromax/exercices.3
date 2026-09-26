abstract class Token {
    static readonly REGEX: RegExp
    static readonly sREGEX: string

    /**
     * transtypage -> string
     * @returns {string}
     */
    abstract toString(): string;
  
    /**
     * renvoie le niveau de priorité
     * @type {number}
     */
    abstract get priority(): number;

    /**
     * prédicat : peut-il y avoir un opérateur binaire sur la gauche ?
     * @returns {boolean}
     */
    abstract acceptOperOnLeft(): boolean

    /**
     * prédicat : peut-il y avoir un opérateur binaire sur la droite ?
     * @returns {boolean}
     */
    abstract acceptOperOnRight(): boolean

    /**
     * prédicat : Le token agit-il sur sa gauche ?
     * @returns {boolean}
     */
    abstract operateOnLeft(): boolean

    /**
     * prédicat : Le token agit-il sur sa droite ?
     * @returns {boolean}
     */
    abstract operateOnRight(): boolean

    /**
     * prédicat : test la chaîne afin de savoir si elle est valide pour le token demandé
     * @returns {boolean}
     */
    static test(tokenString: string): boolean {
        return this.REGEX.test(tokenString);
    }

    /**
     * renvoie la chaîne représentant le regex associé au token
     * @returns {string} La chaîne représentant le regex
     */
    static getRegexString(): string {
        return this.sREGEX
    }

    /**
     * renvoie l'arité du token (0 si non applicable, 1 pour unaire, 2 pour binaire)
     * @returns {0|1|2}
     */
    get arity():0|1|2 {
        return 0
    }

}

export { Token }
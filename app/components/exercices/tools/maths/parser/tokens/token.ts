abstract class Token {
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
    abstract acceptOperOnLeft(): boolean;

    /**
     * prédicat : peut-il y avoir un opérateur binaire sur la droite ?
     * @returns {boolean}
     */
    abstract acceptOperOnRight(): boolean;

    /**
     * prédicat : Le token agit-il sur sa gauche ?
     * @returns {boolean}
     */
    abstract operateOnLeft(): boolean;

    /**
     * prédicat : Le token agit-il sur sa droite ?
     * @returns {boolean}
     */
    abstract operateOnRight(): boolean;

}

export { Token }
abstract class Ensemble {
    /**
     * Représente un ensemble de nombres.
     */

    /**
     * Retourne la représentation TeX de l'ensemble.
     * @returns {string} La chaîne TeX représentant l'ensemble.
     */
    abstract toTex(): string

    /**
     * simplifie les bornes
     * @returns {Ensemble} l'ensemble simplifié
     */
    abstract simplifyBornes(): Ensemble

    /**
     * Renvoie la représentation sous forme de chaîne de l'ensemble.
     * @returns {string} La chaîne représentant l'ensemble.
     */
    abstract toString(): string

    /**
     * Retourne la priorité de l'ensemble.
     * @returns {number} La priorité de l'ensemble.
     */
    get priority(): number {
        return 3
    }

    /**
     * Prédicat : true si invalide, false sinon.
     * @returns {boolean} true si l'ensemble est invalide, false sinon.
     */
    abstract isInvalid(): boolean

    /**
     * Prédicat : true si l'ensemble est simplifié, false sinon.
     * @returns {boolean} true si l'ensemble est simplifié, false sinon.
     */
    abstract isSimplified(): boolean
}

abstract class EnsemblePrimitif extends Ensemble {
    /**
     * Vérifie si deux ensembles primitifs sont égaux.
     * @param {EnsemblePrimitif} other L'ensemble avec lequel comparer.
     * @returns {boolean} true si les ensembles sont égaux, false sinon.
     */
    abstract equals(other: EnsemblePrimitif): boolean
}

export { Ensemble, EnsemblePrimitif }
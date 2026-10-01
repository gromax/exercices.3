import { EnsemblePrimitif } from "./parent"

class EmptySet extends EnsemblePrimitif {
    /**
     * Représente l'ensemble vide.
     */

    static readonly TEX = "\\varnothing"
    static readonly STRING = "∅"

    toTex(): string {
        return EmptySet.TEX
    }

    equals(other: EnsemblePrimitif): boolean {
        return other instanceof EmptySet
    }

    simplifyBornes(): EmptySet {
        return this
    }

    toString(): string {
        return EmptySet.STRING
    }

    isInvalid(): boolean {
        return false
    }
}

const EMPTY_SET = new EmptySet() // objet unique

export { EmptySet, EMPTY_SET }
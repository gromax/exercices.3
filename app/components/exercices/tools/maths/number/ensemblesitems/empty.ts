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

    equals(other: EnsemblePrimitif, digits:number|undefined): boolean {
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

    isSimplified(): boolean {
        return true
    }

    toTexDecimal(n: number): string {
        return EmptySet.TEX
    }
}

const EMPTY_SET = new EmptySet() // objet unique

export { EmptySet, EMPTY_SET }
import { EnsemblePrimitif } from "./parent"

class InvalidSet extends EnsemblePrimitif {
    /**
     * Représente un ensemble invalide.
     * @extends EnsemblePrimitif
     */

    static readonly TEX = "\\text{Invalid Set}"
    static readonly STRING = "Invalid Set"

    toTex(): string {
        return InvalidSet.TEX
    }

    equals(other: EnsemblePrimitif, digits:number|undefined): boolean {
        return false
    }

    simplifyBornes(): InvalidSet {
        return this
    }

    toString(): string {
        return InvalidSet.STRING
    }
    
    isInvalid(): boolean {
        return true
    }

    isSimplified(): boolean {
        return true
    }

    toTexDecimal(n: number): string {
        return InvalidSet.TEX
    }
}

const INVALID_SET = new InvalidSet() // objet unique

export { InvalidSet, INVALID_SET }

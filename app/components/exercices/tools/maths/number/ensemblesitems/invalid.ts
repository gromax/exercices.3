import { EnsemblePrimitif } from "./parent"

class InvalidSet extends EnsemblePrimitif {
    /**
     * Représente un ensemble invalide.
     * @extends EnsemblePrimitif
     */

    toTex(): string {
        return "\\text{Invalid Set}"
    }

    equals(other: EnsemblePrimitif): boolean {
        return other instanceof InvalidSet
    }

    simplifyBornes(): InvalidSet {
        return this
    }

    toString(): string {
        return "Invalid Set"
    }
    
    isInvalid(): boolean {
        return true
    }
}

const INVALID_SET = new InvalidSet() // objet unique

export { InvalidSet, INVALID_SET }

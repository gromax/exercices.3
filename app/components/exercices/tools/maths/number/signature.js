/**
 * @class Signature
 * @description Represents the signature of a mathematical expression.
 */
class Signature {
    #nodes /** @type{{text: number}} */
    constructor(nodes = {}) {
        this.#nodes = nodes
        for (let key in this.#nodes) {
            if (this.#nodes[key] === 0) {
                delete this.#nodes[key]
            }
        }
    }

    /**
     * multiplie par une signature ou un noeud {text:number}
     * @param {Signature|{text: number}} signature 
     * @returns {Signature}
     */
    mult(signature) {
        const nodes = {... this.#nodes}
        const multNode = signature instanceof Signature
            ? signature.#nodes
            : signature
        for (let key in multNode) {
            if (nodes[key]) {
                nodes[key] += multNode[key]
            } else {
                nodes[key] = multNode[key]
            }
        }
        return new Signature(nodes)
    }

    /**
     * divise par une signature ou un noeud {text:number}
     * @param {Signature|{text: number}} signature 
     * @returns {Signature}
     */
    div(signature) {
        const nodes = {... this.#nodes}
        const divNode = signature instanceof Signature
            ? signature.#nodes
            : signature
        for (let key in divNode) {
            if (nodes[key]) {
                nodes[key] -= divNode[key]
            } else {
                nodes[key] = -divNode[key]
            }
        }
        return new Signature(nodes)
    }


    power(exponent) {
        const nodes = {... this.#nodes}
        for (let key in nodes) {
            nodes[key] *= exponent
        }
        return new Signature(nodes)
    }

    /**
     * renvoie une représentation string
     * standardisée pour permettre les comparaisons
     * @returns {string}
     */
    toString() {
        const parts = []
        const keys = Object.keys(this.#nodes).sort()
        for (let key of keys) {
            const exponent = this.#nodes[key]
            parts.push(`(${key})^${exponent}`)
        }
        return parts.join('*')
    }
}

export { Signature }
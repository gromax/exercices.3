import { Ensemble } from "./parent"
import { EmptySet } from "./empty"

class Operator extends Ensemble {
    private _name: "union" | "intersection"
    private _operands: Ensemble[]
    
    constructor(name: "union" | "intersection", operands: Ensemble[]) {
        super()
        if (operands.length < 2) {
            throw new Error("Un opérateur doit avoir au moins deux opérandes")
        }
        this._name = name
        const flattenOperands:Ensemble[] = []
        for (const op of operands) {
            if (op instanceof Operator && op._name === name) {
                flattenOperands.push(...op._operands)
            } else {
                flattenOperands.push(op)
            }
        }
        this._operands = flattenOperands
    }

    get priority(): number {
        return this._name === "union" ? 1 : 2
    }

    toTex(): string {
        const operatorTex = this.isUnion
            ? "\\cup"
            : "\\cap"
        const mypriority = this.priority
        return this._operands.map(
            operand => {
                if (operand.priority < mypriority) {
                    return `\\left(${operand.toTex()}\\right)`
                }
                return operand.toTex()
            }
        ).join(` ${operatorTex} `)
    }

    toTexDecimal(n: number): string {
        const operatorTex = this.isUnion
            ? "\\cup"
            : "\\cap"
        const mypriority = this.priority
        return this._operands.map(
            operand => {
                if (operand.priority < mypriority) {
                    return `\\left(${operand.toTexDecimal(n)}\\right)`
                }
                return operand.toTexDecimal(n)
            }
        ).join(` ${operatorTex} `)
    }


    toString(): string {
        const operatorString = this.isUnion
            ? " ∪ "
            : " ∩ "
        const mypriority = this.priority
        return this._operands.map(
            operand => {
                if (operand.priority < mypriority) {
                    return `(${operand.toString()})`
                }
                return operand.toString()
            }
        ).join(operatorString)
    }

    simplifyBornes(): Ensemble {
        const sOperands = this._operands.map(operand => operand.simplifyBornes())
        if (sOperands.some((operand, i) => operand !== this._operands[i])) {
            return new Operator(this._name, sOperands)
        }
        return this
    }

    equals(other: Ensemble): boolean {
        throw new Error("Method not implemented.")
    }
    
    isInvalid(): boolean {
        return this._operands.some(operand => operand.isInvalid())
    }

    get isUnion(): boolean {
        return this._name === "union"
    }
    
    get isIntersection(): boolean {
        return this._name === "intersection"
    }

    /**
     * accesseur des enfants de l'opérateur.
     * @returns {Ensemble[]} copie de la liste des enfants de l'opérateur.
     */
    children(): Ensemble[] {
        return [...this._operands]
    }
    
    isSimplified(): boolean {
        if (this._operands.some(operand => !operand.isSimplified())) {
            return false
        }
        if (this._operands.some(operand => operand instanceof EmptySet)) {
            return false
        }
        return true
    }
}

export { Operator }

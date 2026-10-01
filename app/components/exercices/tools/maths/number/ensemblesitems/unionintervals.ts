import { EnsemblePrimitif } from "./parent"
import { Interval } from "./interval"
import { EMPTY_SET } from "./empty"


class UnionIntervals extends EnsemblePrimitif {
    /**
     * Représente une union disjointe d'intervalles
     */

    /** @type {Interval[]} */
    private _intervals: Interval[]

    /**
     * 
     * @param intervals 
     */
    static makeFromIntervals(intervals: Interval[]): EnsemblePrimitif {
        if (intervals.length === 0) {
            return EMPTY_SET
        }
        // il faut fusionner 2 à 2
        const merged: Interval[] = []
        const toMerge = [...intervals]
        while (toMerge.length > 0) {
            const inter = toMerge.pop()
            if (merged.length === 0) {
                merged.push(inter)
                continue
            }
            let fusionDone = false
            for (const mergedInter of merged) {
                const union = Interval.union(mergedInter, inter)
                if (union.length === 2) {
                    // pas de jonction possible
                    continue
                }
                // si on arrive ici, c'est qu'il n'y a pas eu de fusion possible
                // il faut extraire mergedInter
                merged.splice(merged.indexOf(mergedInter), 1)
                toMerge.push(union[0])
                fusionDone = true
                break
            }
            if (!fusionDone) {
                merged.push(inter)
            }
        }
        if (merged.length === 1) {
            // interval unique
            return merged[0]
        }

        if (merged.length === 0) {
            return EMPTY_SET
        }
        return new UnionIntervals(merged)
    }

    constructor(intervals: Interval[]) {
        super()
        // Il faut les trier. Comme il sont censément disjoints et non chevauchants
        // on trie les intervalles par leur début
        intervals.sort((a, b) => a.borneInfDecimal.greaterThan(b.borneInfDecimal) ? 1 : -1)
        this._intervals = intervals
    }

    get intervals(): Interval[] {
        return [...this._intervals]
    }

    toTex(): string {
        return this._intervals.map(interval => interval.toTex()).join(" \\cup ")
    }

    /**
     * Vérifie si deux ensembles d'intervalles sont égaux.
     * @param {EnsemblePrimitif} other L'ensemble avec lequel comparer
     * @param {number|undefined} digits Le nombre de chiffres à considérer pour la comparaison des bornes des intervalles.
     * @returns {boolean} true si les ensembles sont égaux, false sinon
     */
    equals(other: EnsemblePrimitif, digits:number|undefined): boolean {
        if (!(other instanceof UnionIntervals)) {
            return false
        }
        if (this._intervals.length !== other._intervals.length) {
            return false
        }
        for (let i = 0; i < this._intervals.length; i++) {
            if (!this._intervals[i].equals(other._intervals[i], digits)) {
                return false
            }
        }
        return true
    }

    simplifyBornes(): UnionIntervals {
        const simplifiedIntervals = this._intervals.map(interval => interval.simplifyBornes())
        for (let i = 0; i < simplifiedIntervals.length; i++) {
            if (simplifiedIntervals[i] != this._intervals[i]) {
                return new UnionIntervals(simplifiedIntervals as Interval[])
            }
        }
        return this
    }

    toString(): string {
        return this._intervals.map(interval => interval.toString()).join(" ∪ ")
    }

    get priority(): number {
        return 1
    }
    
    isInvalid(): boolean {
        return false
    }

    get length(): number {
        return this._intervals.length
    }

    isSimplified(): boolean {
        return this._intervals.every(interval => interval.isSimplified())
    }

    toTexDecimal(n: number): string {
        return this._intervals.map(interval => interval.toTexDecimal(n)).join(" \\cup ")
    }
}

export { UnionIntervals }
import type{ Base } from "./base"
import { Collection } from "./collection"
import Decimal from "decimal.js"
import { simplify } from "./simplify"

const DEC_P_INFINITY = new Decimal(Infinity)
const DEC_M_INFINITY = new Decimal(-Infinity)

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
     * Vérifie si deux ensembles sont égaux.
     * @param {Ensemble} other L'ensemble avec lequel comparer.
     * @returns {boolean} true si les ensembles sont égaux, false sinon.
     */
    abstract equals(other: Ensemble): boolean

    /**
     * simplifie les bornes
     * @returns {Ensemble} l'ensemble simplifié
     */
    abstract simplify(): Ensemble

    /**
     * Renvoie la représentation sous forme de chaîne de l'ensemble.
     * @returns {string} La chaîne représentant l'ensemble.
     */
    abstract toString(): string
}

class InvalidSet extends Ensemble {
    /**
     * Représente un ensemble invalide.
     */

    toTex(): string {
        return "\\text{Invalid Set}"
    }

    equals(other: InvalidSet): boolean {
        return other instanceof InvalidSet
    }

    simplify(): Ensemble {
        return this
    }

    toString(): string {
        return "Invalid Set"
    }
}

class EmptySet extends Ensemble {
    /**
     * Représente l'ensemble vide.
     */

    toTex(): string {
        return "\\varnothing"
    }

    equals(other: EmptySet): boolean {
        return other instanceof EmptySet
    }

    simplify(): Ensemble {
        return this
    }

    toString(): string {
        return "∅"
    }
}

const EMPTY_SET = new EmptySet() // objet unique
const INVALID_SET = new InvalidSet() // objet unique

class Interval extends Ensemble {
    /** @type {Base} */
    private _start: Base

    /** @type {Decimal} */
    private _startDecimal: Decimal

    /** @type {Base} */
    private _end: Base

    /** @type {Decimal} */
    private _endDecimal: Decimal

    /** @type {boolean} true pour [, (fermé) false sinon. */
    private _opening: boolean

    /** @type {boolean} true pour [, (ouvert) false sinon. */
    private _closing: boolean

    /**
     * @param {string|boolean} opening Le crochet d'ouverture de l'intervalle.
     * @param {Base} start La borne inférieure de l'intervalle.
     * @param {Base} end La borne supérieure de l'intervalle.
     * @param {string|boolean} closing Le crochet de fermeture de l'intervalle.
     */
    constructor(opening: string|boolean, start: Base, end: Base, closing: string|boolean) {
        super()
        this._opening = this._verifyBracket(opening)
        this._closing = this._verifyBracket(closing)
        this._start = start
        this._startDecimal = start.toDecimal({})
        this._end = end
        this._endDecimal = end.toDecimal({})
        if (this._startDecimal.isNaN() || this._endDecimal.isNaN()) {
            throw new Error(`<${opening}${start} , ${end}${closing}> Les valeurs de début et de fin d'un intervalle doivent être des nombres valides.`)
        }
        if (this._startDecimal.greaterThan(this._endDecimal)) {
            throw new Error(`<${opening}${start} , ${end}${closing}> L'intervalle ne peut pas avoir un début supérieur à la fin.`)
        }
        if (this._startDecimal.equals(this._endDecimal) && (!this._opening || this._closing)) {
            throw new Error(`<${opening}${start} , ${end}${closing}> L'intervalle ne peut être vide.`)
        }
        if (this._startDecimal.equals(DEC_M_INFINITY) && this._opening) {
            throw new Error(`<${opening}${start} , ${end}${closing}> L'intervalle ne peut pas commencer à -∞ avec un crochet ouvert.`)
        }
        if (this._endDecimal.equals(DEC_P_INFINITY) && !this._closing) {
            throw new Error(`<${opening}${start} , ${end}${closing}> L'intervalle ne peut pas se terminer à +∞ avec un crochet ouvert.`)
        }
    }

    /**
     * Vérfie que le crochet est bien [ ou ] et renvoie la valeur booléenne correspondante.
     * @param {string} bracket Le crochet à vérifier.
     * @returns {boolean} true si le crochet est [ ou ], false sinon.
     */
    private _verifyBracket(bracket: string|boolean): boolean {
        if (typeof bracket === "boolean") {
            return bracket
        } else if (bracket == "[") {
            return true
        } else if (bracket == "]") {
            return true
        }
        throw new Error(`<${bracket}> Caractère invalide pour un crochet d'intervalle.`)
    }

    get borneSupDecimal(): Decimal {
        return this._endDecimal
    }

    get borneInfDecimal(): Decimal {
        return this._startDecimal
    }

    get opening(): boolean {
        return this._opening
    }

    get closing(): boolean {
        return this._closing
    }


    equals(other: Ensemble): boolean {
        if (!(other instanceof Interval)) {
            return false
        }
        return this._startDecimal.equals(other.borneInfDecimal) &&
               this._endDecimal.equals(other.borneSupDecimal) &&
               this._opening === other.opening &&
               this._closing === other.closing
    }

    /**
     * Retourne les intervalles de l'union.
     * @returns {Interval[]} Les intervalles de l'union.
     */
    static union(inter1:Interval, inter2:Interval): Interval[] {
        if (inter1.borneSupDecimal.lessThan(inter2.borneInfDecimal) ||
            inter1.borneSupDecimal.equals(inter2.borneInfDecimal) && (inter1.closing && !inter2.opening)) {
            return [inter1, inter2]
        }
        if (inter2.borneSupDecimal.lessThan(inter1.borneInfDecimal) ||
            inter2.borneSupDecimal.equals(inter1.borneInfDecimal) && (inter2.closing && !inter1.opening)) {
            return [inter2, inter1]
        }

        // on a des intervalles qui se chevauchent
        const startIndex = inter1.borneInfDecimal.lessThan(inter2.borneInfDecimal) || 
            inter1.borneInfDecimal.equals(inter2.borneInfDecimal) && inter1.opening
            ? 0
            : 1
        const closeIndex = inter1.borneSupDecimal.greaterThan(inter2.borneSupDecimal) || 
            inter1.borneSupDecimal.equals(inter2.borneSupDecimal) && !inter1.closing
            ? 0
            : 1
        if (startIndex === 0 && closeIndex === 0) {
            return [ inter1 ]
        }
        if (startIndex === 1 && closeIndex === 1) {
            return [ inter2 ]
        }
        const inters = [inter1, inter2]
        const interval = new Interval(
            inters[startIndex]._opening, inters[startIndex]._start,
            inters[closeIndex]._end, inters[closeIndex]._closing
        )
        if (interval.equals(inter2)) {
            return [inter2]
        }
        return [interval]
    }

    /**
     * Retourne les intervalles de l'intersection.
     * @returns {Interval[]} Les intervalles de l'intersection.
     */
    static intersection(inter1:Interval, inter2:Interval): Interval[] {
        if (inter1.borneSupDecimal.lessThan(inter2.borneInfDecimal) ||
            inter1.borneSupDecimal.equals(inter2.borneInfDecimal) && (inter1.closing && !inter2.opening)) {
            return []
        }
        if (inter2.borneSupDecimal.lessThan(inter1.borneInfDecimal) ||
            inter2.borneSupDecimal.equals(inter1.borneInfDecimal) && (inter2.closing && !inter1.opening)) {
            return []
        }

        // on a des intervalles qui se chevauchent
        const startIndex = inter1.borneInfDecimal.lessThan(inter2.borneInfDecimal) || 
            inter1.borneInfDecimal.equals(inter2.borneInfDecimal) && inter1.opening
            ? 1
            : 0
        const closeIndex = inter1.borneSupDecimal.greaterThan(inter2.borneSupDecimal) || 
            inter1.borneSupDecimal.equals(inter2.borneSupDecimal) && !inter1.closing
            ? 1
            : 0
        if (startIndex === 0 && closeIndex === 0) {
            return [ inter1 ]
        }
        if (startIndex === 1 && closeIndex === 1) {
            return [ inter2 ]
        }
        const inters = [inter1, inter2]
        const interval = new Interval(
            inters[startIndex]._opening, inters[startIndex]._start,
            inters[closeIndex]._end, inters[closeIndex]._closing
        )
        if (interval.equals(inter1)) {
            return [inter1]
        }
        return [interval]
    }



    _boolToBracket(value: boolean): string {
        return value ? "[" : "("
    }

    toTex(): string {
        return `\\left${this._boolToBracket(this._opening)} ${this._start.toTex()} \\,; ${this._end.toTex()}\\right${this._boolToBracket(this._closing)}`
    }

    simplify(): Ensemble {
        const left = simplify(this._start)
        const right = simplify(this._end)
        if (left == this._start && right == this._end) {
            return this
        }
        return new Interval(this._opening, left, right, this._closing)
    }

    toString(): string {
        return `${this._boolToBracket(this._opening)}${this._start.toString()} ; ${this._end.toString()}${this._boolToBracket(this._closing)}`
    }
}

class UnionIntervals extends Ensemble {
    /**
     * Représente une union disjointe d'intervalles
     */

    /** @type {Interval[]} */
    private _intervals: Interval[]

    /**
     * 
     * @param intervals 
     */
    static makeFromIntervals(intervals: Interval[]): Ensemble {
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
     * @param other L'ensemble avec lequel comparer
     * @returns {boolean} true si les ensembles sont égaux, false sinon
     */
    equals(other: Ensemble): boolean {
        if (!(other instanceof UnionIntervals)) {
            return false
        }
        if (this._intervals.length !== other._intervals.length) {
            return false
        }
        for (let i = 0; i < this._intervals.length; i++) {
            if (!this._intervals[i].equals(other._intervals[i])) {
                return false
            }
        }
        return true
    }

    simplify(): Ensemble {
        const simplifiedIntervals = this._intervals.map(interval => interval.simplify())
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
}

class EnsembleCalculator {
    /**
     * union d'ensembles
     * @param {Ensemble} ensemble1
     * @param {Ensemble} ensemble2
     * @returns {Ensemble} L'union des deux ensembles
     */
    static union(ensemble1: Ensemble, ensemble2: Ensemble): Ensemble {
        if (ensemble1 instanceof InvalidSet || ensemble2 instanceof InvalidSet) {
            return INVALID_SET
        }
        if (ensemble1 instanceof EmptySet || ensemble2 instanceof EmptySet) {
            return EMPTY_SET
        }
        const inters1 = ensemble1 instanceof Interval
            ? [ensemble1]
            : ensemble1 instanceof UnionIntervals
                ? ensemble1.intervals
                : []
        if (inters1.length == 0) {
            throw new Error("L'ensemble1 n'a pas d'intervalles")
        }
        const inters2 = ensemble2 instanceof Interval
            ? [ensemble2]
            : ensemble2 instanceof UnionIntervals
                ? ensemble2.intervals
                : []
        if (inters2.length == 0) {
            throw new Error("L'ensemble2 n'a pas d'intervalles")
        }
        return UnionIntervals.makeFromIntervals([...inters1, ...inters2])
    }

    /**
     * intersection d'ensembles
     * @param {Ensemble} ensemble1
     * @param {Ensemble} ensemble2
     * @returns {Ensemble} L'intersection des deux ensembles
     */
    static intersection(ensemble1: Ensemble, ensemble2: Ensemble): Ensemble {
        if (ensemble1 instanceof InvalidSet || ensemble2 instanceof InvalidSet) {
            return INVALID_SET
        }
        if (ensemble1 instanceof EmptySet || ensemble2 instanceof EmptySet) {
            return EMPTY_SET
        }
        const inters1 = ensemble1 instanceof Interval
            ? [ensemble1]
            : ensemble1 instanceof UnionIntervals
                ? ensemble1.intervals
                : []
        if (inters1.length == 0) {
            throw new Error("L'ensemble1 n'a pas d'intervalles")
        }
        const inters2 = ensemble2 instanceof Interval
            ? [ensemble2]
            : ensemble2 instanceof UnionIntervals
                ? ensemble2.intervals
                : []
        if (inters2.length == 0) {
            throw new Error("L'ensemble2 n'a pas d'intervalles")
        }
        // Il faut calculer tous les produits.
        const products: Interval[] = []
        for (const inter1 of inters1) {
            for (const inter2 of inters2) {
                const intersection = Interval.intersection(inter1, inter2)
                if (intersection.length == 0) {
                    continue
                }
                products.push(intersection[0])
            }
        }
        // les produits obtenus sont forcément disjoints et non vides
        if (products.length == 0) {
            return EMPTY_SET
        } else if (products.length == 1) {
            return products[0]
        } else {
            return new UnionIntervals(products)
        }
    }

    /**
     * @param {string|boolean} opening Le crochet d'ouverture de l'intervalle.
     * @param {[Base,Base]|Base} bornes les bornes ouvrante et fermante
     * @param {string|boolean} closing Le crochet de fermeture de l'intervalle.
     */
    static makeInterval(opening: string|boolean, bornes: [Base,Base]|Base, closing: string|boolean): Interval {
        if (!(Array.isArray(bornes) && bornes.length == 2)
            && !((bornes instanceof Collection) && bornes.length == 2) ) {
            throw new Error("Les bornes doivent être un tableau de deux éléments ou une instance de Collection de deux éléments")
        }
        const _bornes = Array.isArray(bornes)
            ? bornes
            : (bornes as Collection).children
        const start = _bornes[0]
        const end = _bornes[1]
        return new Interval(opening, start, end, closing)
    }

    static emptySet(): Ensemble {
        return EMPTY_SET
    }

    static invalidSet(): Ensemble {
        return INVALID_SET
    }
}

export {
    Ensemble,
    EnsembleCalculator
}
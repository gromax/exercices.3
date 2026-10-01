import type { Base } from "../base"
import Decimal from "decimal.js"
import { EnsemblePrimitif } from "./parent"
import { simplify } from "../simplify"

const DEC_P_INFINITY = new Decimal(Infinity)
const DEC_M_INFINITY = new Decimal(-Infinity)

class Interval extends EnsemblePrimitif {
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
            throw new Error(`<${opening}${start} , ${end}${closing}> L'intervalle ne peut pas commencer à -∞ avec un crochet fermé.`)
        }
        if (this._endDecimal.equals(DEC_P_INFINITY) && !this._closing) {
            throw new Error(`<${opening}${start} , ${end}${closing}> L'intervalle ne peut pas se terminer à +∞ avec un crochet fermé.`)
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
            return false
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


    equals(other: EnsemblePrimitif, digits:number|undefined): boolean {
        if (!(other instanceof Interval)) {
            return false
        }
        if (typeof digits !== "undefined") {
            return this._startDecimal.toFixed(digits) == other._startDecimal.toFixed(digits) &&
                   this._endDecimal.toFixed(digits) == other._endDecimal.toFixed(digits) &&
                   this._opening === other.opening &&
                   this._closing === other.closing
        } else {
            return this._startDecimal.equals(other._startDecimal) &&
                   this._endDecimal.equals(other._endDecimal) &&
                   this._opening === other.opening &&
                   this._closing === other.closing
        }
    }

    /**
     * Retourne les intervalles de l'union.
     * @returns {Interval[]} Les intervalles résultant de l'union.
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
        if (interval.equals(inter2, undefined)) {
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
        if (interval.equals(inter1, undefined)) {
            return [inter1]
        }
        return [interval]
    }

    _boolToBracket(value: boolean): string {
        return value ? "[" : "]"
    }

    toTex(): string {
        const texStart = this._start.toTex()
        const texEnd = this._end.isPlusInfinity({})
            ? "+\\infty"
            : this._end.toTex()
        return `\\left${this._boolToBracket(this._opening)} ${texStart} \\,; ${texEnd}\\right${this._boolToBracket(this._closing)}`
    }

    simplifyBornes(): Interval {
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
    
    isInvalid(): boolean {
        return false
    }

    /**
     * Prédicat : true si l'intervalle est simplifié, false sinon.
     * @returns {boolean} true si l'intervalle est simplifié, false sinon.
     */
    isSimplified(): boolean {
        return this._start.isSimplified() && this._end.isSimplified()
    }

    toTexDecimal(n: number): string {
        const texStart = this._start.isMinusInfinity({})
            ? "-\\infty"
            : this._startDecimal.toFixed(n).replace('.', ',')
        const texEnd = this._end.isPlusInfinity({})
            ? "+\\infty"
            : this._endDecimal.toFixed(n).replace('.', ',')
        return `\\left${this._boolToBracket(this._opening)} ${texStart} \\,; ${texEnd}\\right${this._boolToBracket(this._closing)}`
    }
}

export { Interval }
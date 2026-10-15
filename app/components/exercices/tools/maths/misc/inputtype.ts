import type { InputType } from "@components/types"
import MyMath from "../mymath"
import Decimal from "decimal.js"

function toInteger(value: InputType, raiseError:boolean=true):number {
    const n = toNumber(value)
    if (!isNaN(n) && n == Math.trunc(n)) {
        return n
    }
    if (raiseError) {
        throw new Error(`La valeur ${value} ne peut pas être convertie en entier.`)
    }
    return NaN
}

function toNumber(value: InputType): number {
    if (typeof value === 'string') {
        value = value.trim()
        if (/^[+-]?\s?inf(?:inity|ty|ini)?$/.test(value)) {
            return value.startsWith('-') ? -Infinity : Infinity
        }
        return parseFloat(value.replace(',', '.'))
    }
    if (typeof value === 'number') {
        return value
    }
    if (value instanceof MyMath) {
        return value.toFloat()
    }
    if (value instanceof Decimal) {
        return value.toNumber()
    }
    return NaN
}

function toDecimal(value: InputType): Decimal {
    if (typeof value === 'string') {
        value = value.trim()
        if (/^[+-]?\s?inf(?:inity|ty|ini)?$/.test(value)) {
            return value.startsWith('-')
                ? new Decimal(-Infinity)
                : new Decimal (Infinity)
        }
        return new Decimal(value.replace(',', '.'))
    }
    if (typeof value === 'number') {
        return new Decimal(value)
    }
    if (value instanceof MyMath) {
        return value.toDecimal()
    }
    if (value instanceof Decimal) {
        return value
    }
    return new Decimal(NaN)
}

function toBoolean(value: InputType): boolean {
    if (typeof value === 'string') {
        const val = value.toLocaleLowerCase()
        return val === 'true' || val === '1'
    }
    if (typeof value === 'number') {
        return value !== 0
    }
    if (value instanceof MyMath) {
        return value.toFloat() !== 0
    }
    if (value instanceof Decimal) {
        return !value.eq(0)
    }
    return false
}

function toString(value: InputType): string {
    if (typeof value === 'string') {
        return value
    }
    if (typeof value === 'number') {
        return value.toString()
    }
    if (value instanceof MyMath) {
        return value.toString()
    }
    return String(value)
}



export { toNumber, toBoolean, toString, toInteger, toDecimal }
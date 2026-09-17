/**
 * Fichier contenant des fonctions utilitaires diverses pour l'application.
 */

import type { NestedInput, TParams } from '@types'
import MyMath from "@components/exercices/tools/maths/mymath"

function getStringOption(
    options: TParams,
    key: string|Array<string>,
    defaultValue: string
): any {
    if (Array.isArray(key)) {
        for (const k of key) {
            if (options.hasOwnProperty(k)) {
                return inputTypeToString(options[k])
            }
        }
        return defaultValue
    } else {
        return options.hasOwnProperty(key)
            ? inputTypeToString(options[key])
            : defaultValue
    }
}

function getNumberOption(
    options: TParams,
    key: string|Array<string>,
    defaultValue: number
): number {
    if (!Array.isArray(key)) {
        return options.hasOwnProperty(key)
            ? Number(inputTypeToString(options[key]).replace(',', '.'))
            : defaultValue
    }
    for (const k of key) {
        if (options.hasOwnProperty(k)) {
            return Number(inputTypeToString(options[k]).replace(',', '.'))
        }
    }
    return defaultValue
}

function _itemToBoolean(value: string): boolean {
    const val = value.toLocaleLowerCase()
    return val === 'true' || val === '1'
}

function getBooleanOption(
    options: TParams,
    key: string|Array<string>,
    defaultValue: boolean
): boolean {
    if (!Array.isArray(key)) {
        return options.hasOwnProperty(key)
            ? _itemToBoolean(inputTypeToString(options[key]))
            : defaultValue
    }
    for (const k of key) {
        if (options.hasOwnProperty(k)) {
            return _itemToBoolean(inputTypeToString(options[k]))
        }
    }
    return defaultValue
}

function inputTypeToString(value: NestedInput): string {
    if (Array.isArray(value)) {
        throw new Error(`${value} est un tableau. Interdit ici.`)
    }
    if (typeof value === 'string') {
        return value
    }
    if (typeof value === 'number') {
        return value.toString()
    }
    if (value instanceof MyMath) {
        if (value.isText()) {
            // Si c'est un texte, on enlève les guillemets
            return value.toString().slice(1, -1)
        }
        return value.toFloat().toString()
    }
    return String(value)
}


export { getStringOption, getNumberOption, getBooleanOption, inputTypeToString }
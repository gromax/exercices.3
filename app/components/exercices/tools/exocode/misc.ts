/**
 * Fichier contenant des fonctions utilitaires diverses pour l'application.
 */

import type { NestedInput, TParams } from '@types'
import MyMath from "@components/exercices/tools/maths/mymath"

/**
 * Récupère une option de type chaîne de caractères à partir d'un objet d'options.
 * @param {TParams} options L'objet contenant les options.
 * @param {string|Array<string>} key La clé ou les clés à rechercher dans les options.
 * @param {string} defaultValue La valeur par défaut à retourner si la clé n'est pas trouvée.
 * @returns {string} La valeur de l'option sous forme de chaîne de caractères.
 */
function getStringOption(
    options: TParams,
    key: string|Array<string>,
    defaultValue: string
): string {
    if (Array.isArray(key)) {
        for (const k of key) {
            if (options.hasOwnProperty(k)) {
                return _inputTypeToString(options[k])
            }
        }
        return defaultValue
    } else {
        return options.hasOwnProperty(key)
            ? _inputTypeToString(options[key])
            : defaultValue
    }
}

/**
 * Lit une option de type nombre à partir d'un objet d'options.
 * @param {TParams} options L'objet contenant les options.
 * @param {string|Array<string>} key La clé ou les clés à rechercher dans les options.
 * @param {number} defaultValue La valeur par défaut à retourner si la clé n'est pas trouvée.
 * @returns {number} La valeur numérique correspondant à l'option.
 */
function getNumberOption(
    options: TParams,
    key: string|Array<string>,
    defaultValue: number
): number {
    if (!Array.isArray(key)) {
        return options.hasOwnProperty(key)
            ? _inputTypeToNumber(options[key])
            : defaultValue
    }
    for (const k of key) {
        if (options.hasOwnProperty(k)) {
            return _inputTypeToNumber(options[k])
        }
    }
    return defaultValue
}



/**
 * Récupère une option de type booléen à partir d'un objet d'options.
 * @param {TParams} options L'objet contenant les options.
 * @param {string|Array<string>} key La clé ou les clés à rechercher dans les options.
 * @param {boolean} defaultValue La valeur par défaut à retourner si la clé n'est pas trouvée.
 * @returns {boolean} La valeur booléenne correspondant à l'option.
 */
function getBooleanOption(
    options: TParams,
    key: string|Array<string>,
    defaultValue: boolean
): boolean {
    if (!Array.isArray(key)) {
        return options.hasOwnProperty(key)
            ? _inputTypeToBoolean(options[key])
            : defaultValue
    }
    for (const k of key) {
        if (options.hasOwnProperty(k)) {
            return _inputTypeToBoolean(options[k])
        }
    }
    return defaultValue
}

function _inputTypeToString(value: NestedInput): string {
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
        return value.toString()
    }
    return String(value)
}


function _inputTypeToNumber(value: NestedInput): number {
    if (Array.isArray(value)) {
        throw new Error(`${value} est un tableau. Interdit ici.`)
    }
    if (typeof value === 'string') {
        return parseFloat(value.replace(',', '.'))
    }
    if (typeof value === 'number') {
        return value
    }
    if (value instanceof MyMath) {
        return value.toFloat()
    }
    return NaN
}

function _inputTypeToBoolean(value: NestedInput): boolean {
    if (Array.isArray(value)) {
        throw new Error(`${value} est un tableau. Interdit ici.`)
    }
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
    return false
}


export { getStringOption, getNumberOption, getBooleanOption }
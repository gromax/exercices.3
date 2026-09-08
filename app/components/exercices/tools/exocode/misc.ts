/**
 * Fichier contenant des fonctions utilitaires diverses pour l'application.
 */

function getOption(
    options: Record<string, any>,
    key: string,
    defaultValue: any = null
): any {
    return options.hasOwnProperty(key) ? options[key] : defaultValue
}

function getNumberOption(
    options: Record<string, any>,
    key: string|Array<string>,
    defaultValue: number
): number {
    if (!Array.isArray(key)) {
        return options.hasOwnProperty(key) ? Number(options[key].replace(',', '.')) : defaultValue
    }
    for (const k of key) {
        if (options.hasOwnProperty(k)) {
            return Number(options[k].replace(',', '.'))
        }
    }
    return defaultValue
}

function _itemToBoolean(value: any): boolean {
    if (typeof value === 'string') {
        const val = value.toLocaleLowerCase()
        return val === 'true' || val === '1'
    } else if (typeof value === 'number') {
        return value !== 0
    } else if (typeof value === 'boolean') {
        return value
    }
    return Boolean(value)
}

function getBooleanOption(
    options: Record<string, any>,
    key: string|Array<string>,
    defaultValue: boolean
): boolean {
    if (!Array.isArray(key)) {
        return options.hasOwnProperty(key) ? _itemToBoolean(options[key]) : defaultValue
    }
    for (const k of key) {
        if (options.hasOwnProperty(k)) {
            return _itemToBoolean(options[k])
        }
    }
    return defaultValue
}

export { getOption, getNumberOption, getBooleanOption }
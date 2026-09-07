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
    defaultValue: number = 0
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

export { getOption, getNumberOption }
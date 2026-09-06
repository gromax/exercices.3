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
    key: string,
    defaultValue: number = 0
): number {
    return options.hasOwnProperty(key) ? Number(options[key]) : defaultValue
}

export { getOption, getNumberOption }
import MyMath from '@mathstools/mymath'

import {
    formatsToCheckers,
    NON_OPTIONAL_CHECKERS,
    OPTIONAL_CHECKERS
} from '../checkers/check'

/**
 * recherche, parmi les formats demandés, celui qui convient à la valeur attendue
 * @param {string|Array} value 
 * @param {string|Array} format 
 * @returns {string} le format choisi
 */
function formatValue(value:any|Array<any>, format:string|Array<string> = "none"):string|Array<string> {
    // format peut être un tableau ou non
    // il faudrait voir les cas empty, infini qui sont à part et peuvent être en plus
    // puis les autres qui devraient être uniques
    if (Array.isArray(value)) {
        return value.map(val => formatValue(val, format) as string)
    }
    const str_value = String(value)

    const optCheckers = formatsToCheckers(str_value, format, OPTIONAL_CHECKERS)
    for (const c of optCheckers) {
        if (c.formatIsValid) {
            return c.toFormat()
        }
    }
    const checkers = formatsToCheckers(str_value, format, NON_OPTIONAL_CHECKERS)
    if (checkers.length > 1) {
        const names = checkers.map(item => item.name)
        throw new Error("Le format choisi contient des types incompatibles : " + names.join(', ') + ".")
    }
    if (checkers.length == 0) {
        // on considère que c'est <none>
        return `$${MyMath.latex(str_value)}$`
    }
    const checker = checkers.pop()
    return checker.toFormat()
}

export {
    formatValue
}
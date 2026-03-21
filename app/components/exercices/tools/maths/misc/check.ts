/**
 * Check if the userValue matches the expected format.
 */

import MyMath from '@mathstools/mymath'
import { InputType } from '@types'

import { InfiniteCheck } from '../checkers/infinitecheck'
import { EmptyCheck } from '../checkers/emptycheck'
import { EquationCheck } from '../checkers/equationcheck'
import { NumericCheck } from '../checkers/numeric_check'
import { VarsCheck } from '../checkers/varscheck'
import { RoundCheck } from '../checkers/roundcheck'
import { ErreurCheck } from '../checkers/erreurcheck'
import { ExpandCheck } from '../checkers/expandcheck'
import { AbsChecker } from '../checkers/abscheck'

// infini et empty peuvent être mis avec
// un des autres, mais cela n'aurait pas de sens que
// de mettre par ex Equation avec Round
const OPTIONAL_CHECKERS:Array<any> = [
    EmptyCheck,
    InfiniteCheck
]

const CHECKERS:Array<any> = [
    EmptyCheck,
    InfiniteCheck,
    EquationCheck,
    NumericCheck,
    VarsCheck,
    RoundCheck,
    ErreurCheck,
    ExpandCheck
]

const NON_OPTIONAL_CHECKERS:Array<any> = CHECKERS.filter(item => !OPTIONAL_CHECKERS.includes(item))

/**
 * test if expr matches the expected format
 * @param {string} expr 
 * @param {Array|string} format 
 * @returns {boolean|string} true if format is correct, error message otherwise
 */
function checkFormat(expr:string, format:string|Array<string> = 'none'): boolean|string {
    // format peut être un tableau de formats acceptés
    expr = expr.trim()
    if (expr === '') {
        return "Vous devez fournir une réponse."
    }

    const checkers = formatsToCheckers(expr, format, CHECKERS)
    if (checkers.some(item => item.formatIsValid)) {
        return true
    }
    if (checkers.length > 0) {
        // il n'y a donc que des invalides
        return checkers.map(item => item.message).join(' OU ')
    }

    // aucun format
    if (format !== 'none') {
        // format inconnu
        console.warn(`Format inconnu : ${format}`)
    }
    // autres formats à ajouter ici
    // il faut vérifier que le parse passe bien
    const mm = MyMath.make(expr)
    if (mm.invalid) {
        return `Expression invalide`
    }
    return true
}

function formatsToCheckers(value:string, formats:string|Array<string>, checkersList:Array<any>):Array<AbsChecker> {
    if (typeof formats == "string") {
        formats = [formats]
    }
    const checkers:Array<AbsChecker> = []
    for (const f of formats) {
        const C:any = checkersList.find(C => (C as any).testFormat(f))
        if (typeof C == "undefined") {
            // pas d'erreur. Il est normal que les formats non optionnels
            // par exemple ne soient pas reconnus
            continue
        }
        checkers.push(new C(value, f))
    }
    return checkers
}


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
    if (
        (format === "infini") || (Array.isArray(format) && format.includes("infini"))
        && (new InfiniteCheck("infini", str_value)).formatIsValid
       ) {
        return str_value[0] === '-' ? '$-\\infty$' : '$+\\infty$'
    }
    if (
        (format === "empty") || (Array.isArray(format) && format.includes("empty"))
        && (new EmptyCheck("empty", str_value)).formatIsValid
       ) {
        return '$\\emptyset$'
    }
    const checkers:Array<AbsChecker> = formatsToCheckers(str_value, format, NON_OPTIONAL_CHECKERS)
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

/**
 * vérifie la valeur donnée par l'utilisateur
 * @param {string} userValue 
 * @param {string|MyMath} expectedValue 
 * @param {string|Array<string>} format 
 * @returns {boolean} true si la valeur est correcte
 */
function checkValue(userValue:string, expectedValue:InputType, format:string|Array<string> = "none"):boolean {
    const checkFormatResult = checkFormat(userValue, format)
    if (checkFormatResult !== true) {
        return false
    }
    // je traite d'abord les cas particuliers
    if (new EmptyCheck(String(expectedValue)).formatIsValid) {
        return (new EmptyCheck(userValue)).valueIsGood(expectedValue)
    }
    const parsedExpected = MyMath.make(expectedValue)
    if (parsedExpected.isInfinity()) {
        return (new InfiniteCheck(userValue)).valueIsGood(parsedExpected)
    }
    const checkers = formatsToCheckers(userValue, format, NON_OPTIONAL_CHECKERS)
    if (checkers.length ==0) {
        console.warn(`Aucun format pour valider ${userValue}`)
    }
    return checkers.some(c => c.valueIsGood(parsedExpected))
}

export {
    checkFormat,
    checkValue,
    formatValue
}
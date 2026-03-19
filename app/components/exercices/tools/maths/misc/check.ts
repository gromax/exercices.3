/**
 * Check if the userValue matches the expected format.
 */

import Parser from '../parser/parser'
import MyMath from '@mathstools/mymath'
import { InputType } from '@types'

import { InfiniteCheck } from '../checkers/infinitecheck'
import { EmptyCheck } from '../checkers/emptycheck'
import { EquationCheck } from '../checkers/equationcheck'
import { NumericCheck } from '../checkers/numeric_check'
import { VarsCheck } from '../checkers/varscheck'
import { RoundCheck } from '../checkers/roundcheck'
import { ErreurCheck } from '../checkers/erreurcheck'

const CHECKERS = [
    EmptyCheck,
    InfiniteCheck,
    EquationCheck,
    NumericCheck,
    VarsCheck,
    RoundCheck,
    ErreurCheck
]

/* Teste si l'expression est développée */
function checkIfExpand(expr:string): string|boolean {
    try {
        const objMath = Parser.build(expr)
        return objMath.isExpanded()
            ? true
            : "Vous devez développer et simplifier."
    } catch (e) {
        // parsing error => pas numérique
        return "Expression invalide."
    }
}

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

    if (Array.isArray(format)) {
        const reponses = format.map(f => checkFormat(expr, f))
        if (reponses.includes(true)) {
            return true
        }
        return reponses.join(' OU ')
    }

    for (const C of CHECKERS) {
        if (!C.testFormat(format)) {
            continue
        }
        const checker = new C(expr, format)
        return checker.formatIsValid
            ? true
            : checker.message
    }

    if (format === 'expand') {
        return checkIfExpand(expr)
    }

    if (format !== 'none') {
        // format inconnu
        console.warn(`Format inconnu : ${format}`)
    }
    // autres formats à ajouter ici
    // il faut vérifier que le parse passe bien
    try {
        Parser.build(expr)
        return true
    } catch (e) {
        return `Expression invalide : ${e.message}`
    }
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
    if (Array.isArray(format)) {
        // premier cas, format était un tableau. Il faut donc chercher le format non empty et non infini
        const formatChoisi = format.filter(f => f !== 'empty' && f !== 'infini')
        if (formatChoisi.length > 1) {
            console.warn("Le format choisi contient des types incompatibles : " + formatChoisi.join(', ') + ".")
        }
        format = formatChoisi.length === 1 ? formatChoisi[0] : 'none'
    }
    // il pourrait arriver que le format n'était pas un tableau
    // et soit "empty" ou "infini" et qu'il
    // n'ait pas convenu pour la valeur attendue. Ce cas revient à none
    if (format === 'empty' || format === 'infini') {
        format = 'none'
    }
    if (/^round:[0-9]+$/.test(format)) {
        const n = Number(format.split(':')[1])
        return MyMath.toFormat(str_value, `${n}f`)
    }
    if (/^erreur:(?:[0-9]+(?:\.[0-9]+)?)|(?:\.[0-9]+)$/.test(format)) {
        const err = Number(format.split(':')[1])
        const n = Math.ceil(Math.log10(1 / err))
        return `${MyMath.toFormat(str_value, `${n+1}f`)} ± ${String(err).replace('.', ',')}`
    }
    if (format.startsWith("equation:")) {
        // ajout d'un = 0 par défaut
        return str_value.includes("=")
            ? "$" + str_value.split("=").map(MyMath.latex).join("=") + "$"
            : "$" + MyMath.latex(str_value) + " = 0$"
    }
    if (!['none', 'numeric', 'expand'].includes(format)) {
        console.warn(`Format inconnu : ${format}`)
    }
    return `$${MyMath.latex(str_value)}$`
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

    // je traite ensuite les cas où le format devrait être numérique
    // format pourrait être un tableau
    // cela a un sens de mélanger "numeric" et "empty" par exemple
    // mais pas d'avoir "numeric" et "round:x" dans le même tableau
    // donc je prends le premier format non "empty" ou "inf" dans le tableau
    if (Array.isArray(format)) {
        format = format.find(f => f !== 'empty' && f !== 'inf') || 'none'
    }

    if (NumericCheck.testFormat(format)) {
        // numérique mais exacte. Une comparaison directe suffit
        //return MyMath.parseUser(userValue).compare(expectedValue, "==")
        const numericChecker = new NumericCheck(userValue)
        return numericChecker.valueIsGood(expectedValue)
    }

    if (ErreurCheck.testFormat(format)) {
        const erreurChecker = new ErreurCheck(userValue, format)
        return erreurChecker.valueIsGood(expectedValue)
    }

    if (RoundCheck.testFormat(format)) {
        const roundChecker = new RoundCheck(userValue, format)
        return roundChecker.valueIsGood(expectedValue)
    }

    if (EquationCheck.testFormat(format)) {
        const equationChecker = new EquationCheck(userValue, format)
        return equationChecker.valueIsGood(expectedValue)
    }

    if (format === "expand") {
        // comparaison d'expressions algébriques
        return MyMath.parseUser(userValue).compare(parsedExpected.expand(), "==") as boolean
    }
    // autres formats à ajouter ici
    return MyMath.parseUser(userValue).expand().compare(parsedExpected.expand(), "==") as boolean
}

export {
    checkFormat,
    checkValue,
    formatValue,
    InputType
}
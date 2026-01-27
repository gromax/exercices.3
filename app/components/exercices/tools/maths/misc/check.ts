/**
 * Check if the userValue matches the expected format.
 */

import Parser from '../parser/parser'
import MyMath from '@mathstools/mymath'

type InputType = string | number | MyMath

function checkNumericExpression(expr:string): string|boolean {
    try {
        const objMath = Parser.build(expr)
        const variables = objMath.isFunctionOf(undefined) as Array<string>
        if (variables.length > 0) {
            return `Expression numérique attendue (pas de ${variables.join(', ')}).`
        }
        if (objMath.toString().includes('∞')) {
            return "Expression numérique attendue (pas d'infini)."
        }
        // on souhaite également que l'expression soit développée
        return objMath.isExpanded() ? true : "Vous devez simplifier."
    } catch (e) {
        // parsing error => pas numérique
        return "Expression invalide."
    }
}

/**
 * Test si l'expression n'a comme variable que celles présentes dans v
 * @param {string} expr 
 * @param {string} acceptedV
 * @returns {string|boolean}
 */
function checkFormatWithVar(expr:string, acceptedV:string): string|boolean {
    try {
        const objMath = Parser.build(expr)
        const variables = objMath.isFunctionOf(undefined) as Array<string>
        for (const v of variables) {
            if (!acceptedV.includes(v)) {
                return `L'expression ne doit pas dépendre de la variable ${v}.`
            }
        }
        return objMath.isExpanded() ? true : "Vous devez simplifier."
    } catch (e) {
        // parsing error => pas numérique
        return "Expression invalide."
    }
}

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
 * renvoie true ou un message d'erreur si l'expression donnée
 * n'est pas une expression vide
 * @param {string} expr 
 * @returns {boolean|string}
 */
function checkEmptyExpression(expr:string): boolean|string {
    return ['vide', '∅', 'empty'].includes(expr)
        ? true
        : "Vous devez répondre 'vide' ou '∅' pour indiquer l'ensemble vide."
}

/**
 * renvoie true ou un message d'erreur si l'expression donnée
 * n'est pas une expression infinie
 * @param {string} expr 
 * @returns {boolean|string}
 */
function checkInfiniteExpression(expr:string): boolean|string {
    return /^[-+]\s*(?:∞|inf|infini|infinity)$/.test(expr)
        ? true
        : "Vous devez fournir une valeur infinie (ex: +inf, -∞)."
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

    if (format === 'empty') {
        return checkEmptyExpression(expr)
    }

    if (format === "infini")  {
        return checkInfiniteExpression(expr)
    }

    if (format === 'numeric') {
        return checkNumericExpression(expr)
    }
    if (/^round:[0-9]+$/.test(format)) {
        return /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?(?:\s*%)?$/.test(expr) ? true : "Vous devez fournir un nombre éventuellement approximé."
    }
    if (/^erreur:(?:[0-9]+(?:\.[0-9]+)?)|(?:\.[0-9]+)$/.test(format)) {
        return /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?(?:\s*%)?$/.test(expr) ? true : "Vous devez fournir un nombre éventuellement approximé."
    }

    if (format.startsWith("var:")) {
        const i = format.indexOf(':')
        const v = format.substring(i+1)
        return checkFormatWithVar(expr, v)
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
function formatValue(value:any|Array<any>, format: string|Array<string> = "none"):string|Array<string> {
    // format peut être un tableau ou non
    // il faudrait voir les cas empty, infini qui sont à part et peuvent être en plus
    // puis les autres qui devraient être uniques
    if (Array.isArray(value)) {
        return value.map(val => formatValue(val, format) as string)
    }
    const str_value = String(value)
    if (
        (format === "infini") || (Array.isArray(format) && format.includes("infini"))
        && checkInfiniteExpression(str_value) === true
       ) {
        return str_value[0] === '-' ? '$-\\infty$' : '$+\\infty$'
    }
    if (
        (format === "empty") || (Array.isArray(format) && format.includes("empty"))
        && checkEmptyExpression(str_value) === true
       ) {
        return '$\\emptyset$'
    }
    if (Array.isArray(format)) {
        // premier cas, format était un tableau. Il faut donc chercher le format non empty et non infini
        const formatChoisi = format.filter(f => f !== 'empty' && f !== 'infini')
        if (formatChoisi.length > 1) {
            console.warn("Le format choisi contient des types inconmpatibles : " + formatChoisi.join(', ') + ".")
        }
        format = formatChoisi.length === 1 ? formatChoisi[0] : 'none'
    }
    // il pourrait arriver que le format choisi soit "empty" ou "infini" et qu'il
    // n'est pas convenu pour la valeur attendue. Ce cas revient à none
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
    if (checkEmptyExpression(String(expectedValue)) === true) {
        return checkEmptyExpression(userValue) === true
    }
    const parsedExpected = MyMath.make(expectedValue)
    if (parsedExpected.isInfinity()) {
        return checkInfiniteExpression(userValue) === true
            && parsedExpected.isMinusInfinity() === (userValue[0] === '-')
    }

    // je traite ensuite les cas où le format devrait être numérique
    // format pourrait être un tableau
    // cela a un sens de mélanger "numeric" et "empty" par exemple
    // mais pas d'avoir "numeric" et "round:x" dans le même tableau
    // donc je prends le premier format non "empty" ou "inf" dans le tableau
    if (Array.isArray(format)) {
        format = format.find(f => f !== 'empty' && f !== 'inf') || 'none'
    }

    if (format === "numeric") {
        // numérique mais exacte. Une comparaison directe suffit
        //return MyMath.parseUser(userValue).compare(expectedValue, "==")
        return MyMath.parseUser(userValue).pseudoEquality(parsedExpected)
    }
    if (format.startsWith("round:") || format.startsWith("erreur:")) {
        // Il faut une évaluation float des deux valeurs
        const userFloat = MyMath.parseUser(userValue).toFloat()
        const expectedFloat = parsedExpected.toFloat()
        if (isNaN(userFloat) || isNaN(expectedFloat)) {
            return false
        }
        const param = Number(format.split(':')[1])
        if (format.startsWith("round:")) {
            const factor = Math.pow(10, param)
            return userFloat * factor === Math.round(expectedFloat * factor)
        } else if (format.startsWith("erreur:")) {
            const tolerance = param
            return Math.abs(userFloat - expectedFloat) <= tolerance
        }
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
    formatValue
}
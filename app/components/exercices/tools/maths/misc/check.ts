/**
 * Check if the userValue matches the expected format.
 */

import Parser from '../parser/parser'
import MyMath from '@mathstools/mymath'
import { InputType } from '@types'

import { InfiniteCheck } from '../checkers/infinitecheck'
import { EmptyCheck } from '../checkers/emptycheck'

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

/* Renvoie true si l'expression est une équation contenant les variables indiquées
* @param {string} expr 
 * @param {string} acceptedV
 * @returns {string|boolean}
*/
function checkIfEquation(expr:string, variables:string):boolean|string {
    if (expr.trim() == "") {
        return "L'expression est vide"
    }
    if (!expr.includes("=")) {
        return "Une équation devrait contenir ="
    }
    let membres = expr.split("=")
    if (membres.length != 2) {
        return "Une équation ne devrait avoir qu'un ="
    }
    if (membres[0].trim() == "") {
        return "Membre gauche vide"
    }
    if (membres[1].trim() == "") {
        return "Membre droit vide"
    }
    let membreGaucheResult = checkFormatWithVar(membres[0], variables)
    if (membreGaucheResult !== true) {
        return membreGaucheResult
    }
    return checkFormatWithVar(membres[1], variables)
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
        const emptyChecker = new EmptyCheck(expr)
        return emptyChecker.formatIsValid
            ? true
            : emptyChecker.message
    }

    if (format === "infini")  {
        const infiniteChecker = new InfiniteCheck(expr)
        return infiniteChecker.formatIsValid
            ? true
            : infiniteChecker.message
    }

    if (format.startsWith("equation:")) {
        let items = format.split(":")
        if (items.length!=2) {
            throw new Error(`le format ${format} n'est pas défini.`)
        }
        let variables = items[1]
        return checkIfEquation(expr, variables)
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
        && (new InfiniteCheck(str_value)).formatIsValid
       ) {
        return str_value[0] === '-' ? '$-\\infty$' : '$+\\infty$'
    }
    if (
        (format === "empty") || (Array.isArray(format) && format.includes("empty"))
        && (new EmptyCheck(str_value)).formatIsValid
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
        return (new EmptyCheck(userValue)).formatIsValid
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

    if (format.startsWith("equation:")) {
        // On fait le parse des deux membres et on soustrait
        let userMembres = userValue.split("=")
        if (userMembres.length != 2) {
            return false
        }
        let user = MyMath.make(`(${userMembres[0]})-(${userMembres[1]})`)
        let good = MyMath.make(expectedValue)
        const v = user.variables
        v.sort()
        const v2 = good.variables
        v2.sort()
        if (v.length !== v2.length) {
            return false
        }
        for (let i=0;i<v.length;i++) {
            if (v[i]!=v2[i]) {
                return false
            }
        }
        // les variables sont les mêmes
        // si pas de variable, alors ok
        if (v.length == 0) {
            return true
        }
        // maintenant on va trouver le coefficient de la première variable.
        let v0 = v[0]
        let d1 = user.diff(v0)
        let d2 = good.diff(v0)
        // Pour que ce soit bon, d1 et d2 doivent être de simples scalaires
        if ((d1.variables.length>0) || (d2.variables.length>0)) {
            return false
        }
        // on a donc 2 constantes. On peut faire d2*user - d1*good
        // et tester si ça fait 0
        let red = MyMath.make(`(${d1})*(${good}) - (${d2})*(${user})`)
        return red.compare(0, "==") as boolean
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
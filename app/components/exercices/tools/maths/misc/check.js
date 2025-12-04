/**
 * Check if the userValue matches the expected format.
 */

import Parser from '../parser/parser.js';
import MyNerd from '../mynerd.js';


function checkNumericExpression(expr) {
    try {
        const objMath = Parser.build(expr);
        const variables = objMath.isFunctionOf();
        if (variables.length > 0) {
            return `Expression numérique attendue (pas de ${variables.join(', ')}).`;
        }
        // on souhaite également que l'expression soit développée
        return objMath.isExpanded() ? true : "Vous devez simplifier.";
    } catch (e) {
        // parsing error => pas numérique
        return "Expression invalide.";
    }
}

function checkIfExpand(expr) {
    try {
        const objMath = Parser.build(expr);
        return objMath.isExpanded() ? true : "Vous devez développer et simplifier.";
    } catch (e) {
        // parsing error => pas numérique
        return "Expression invalide.";
    }
}

function checkEmptyExpression(expr) {
    return expr == 'vide' || expr == '∅'
        ? true
        : "Vous devez répondre 'vide' ou '∅' pour indiquer l'ensemble vide.";
}

function checkInfiniteExpression(expr) {
    return /^[-+]\s*(?:∞|inf|infini|infinity)$/.test(expr)
        ? true
        : "Vous devez fournir une valeur infinie (ex: +inf, -∞).";
}

/**
 * test if expr matches the expected format
 * @param {string} expr 
 * @param {Array|string} format 
 * @returns {boolean|string} true if format is correct, error message otherwise
 */
function checkFormat(expr, format = 'none') {
    // format peut être un tableau de formats acceptés
    if (Array.isArray(format)) {
        const reponses = format.map(f => checkFormat(expr, f));
        if (reponses.includes(true)) {
            return true;
        }
        return reponses.join(' OU ');
    }

    if (format === 'empty') {
        return checkEmptyExpression(expr);
    }

    if (format === 'inf' || format === "infini")  {
        return checkInfiniteExpression(expr);
    }

    if (format === 'numeric') {
        return checkNumericExpression(expr);
    }
    if (/^round:[0-9]+$/.test(format)) {
        return /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?(?:\s*%)?$/.test(expr) ? true : "Vous devez fournir un nombre éventuellement approximé.";
    }
    if (/^erreur:(?:[0-9]+(?:\.[0-9]+)?)|(?:\.[0-9]+)$/.test(format)) {
        return /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?(?:\s*%)?$/.test(expr) ? true : "Vous devez fournir un nombre éventuellement approximé.";
    }
    if (format === 'expand') {
        return checkIfExpand(expr);
    }

    if (format !== 'none') {
        // format inconnu
        console.warn(`Format inconnu : ${format}`);
    }
    // autres formats à ajouter ici
    return true;
}

function checkValue(userValue, expectedValue, format = "none") {
    const checkFormatResult = checkFormat(userValue, format);
    if (checkFormatResult !== true) {
        return false;
    }

    // je traite d'abord les cas particuliers
    if (checkInfiniteExpression(expectedValue) === true) {
        return checkInfiniteExpression(userValue) === true && ((expectedValue[0]==='-') === (userValue[0] === '-'));
    }
    if (checkEmptyExpression(expectedValue) === true) {
        return checkEmptyExpression(userValue) === true;
    }

    // je traite ensuite les cas où le format devrait être numérique
    // format pourrait être un tableau
    // cela a un sens de mélanger "numeric" et "empty" par exemple
    // mais pas d'avoir "numeric" et "round:x" dans le même tableau
    // donc je prends le premier format non "empty" ou "inf" dans le tableau
    if (Array.isArray(format)) {
        format = format.find(f => f !== 'empty' && f !== 'inf') || 'none';
    }

    if (format === "numeric") {
        // numérique mais exacte. Une comparaison directe suffit
        return MyNerd.parseUser(userValue).compare(expectedValue, "==");
    }
    if (format.startsWith("round:") || format.startsWith("erreur:")) {
        // Il faut une évaluation float des deux valeurs
        const userFloat = MyNerd.parseUser(userValue).toFloat();
        const expectedFloat = MyNerd.toFloat(expectedValue);
        if (isNaN(userFloat) || isNaN(expectedFloat)) {
            return false;
        }
        const param = Number(format.split(':')[1]);
        if (format.startsWith("round:")) {
            const factor = Math.pow(10, param);
            return userFloat * factor === Math.round(expectedFloat * factor);
        } else if (format.startsWith("erreur:")) {
            const tolerance = param;
            return Math.abs(userFloat - expectedFloat) <= tolerance;
        }
    }
    if (format === "expand") {
        // comparaison d'expressions algébriques
        return MyNerd.parseUser(userValue).compare(`expand(${expectedValue})`, "==");
    }
    // autres formats à ajouter ici
    return MyNerd.parseUser(userValue).expand().compare(`expand(${expectedValue})`, "==");
}

export { checkFormat, checkValue };
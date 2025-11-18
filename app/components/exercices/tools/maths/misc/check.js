/**
 * Check if the userValue matches the expected format.
 */

import nerdamer from 'nerdamer';
import 'nerdamer/all';
import Parser from '../parser/parser.js';
import { expressionToFloat } from './misc.js';

/*function checkNumericExpression(expr) {
    try {
        const allowedSymbols = ['pi', 'e'];
        const parsed = nerdamer(String(expr));
        // nerdamer(...).variables() renvoie les symboles non numériques trouvés
        const vars = typeof parsed.variables === 'function' ? parsed.variables() : [];
        const unknown = vars.filter(v => !allowedSymbols.includes(v));
        return unknown.length === 0 ? true : `L'expression contient des inconnues (${unknown.join(', ')}).`;
    } catch (e) {
        // parsing error => pas numérique
        return "Expression invalide.";
    }
}*/
function checkNumericExpression(expr) {
    try {
        const objMath = Parser.build(expr);
        const variables = objMath.isFunctionOf();
        if (variables.length > 0) {
            return `L'expression contient des inconnues (${variables.join(', ')}).`;
        }
        // on souhaite également que l'expression soit développée
        return objMath.isExpanded() ? true : "Vous devez simplifier.";
    } catch (e) {
        // parsing error => pas numérique
        return "Expression invalide.";
    }
}



function checkFormat(expr, format) {
    if (format === 'numeric') {
        return checkNumericExpression(expr);
    }
    if (/^round:[0-9]+$/.test(format)) {
        return /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?$/.test(expr) ? true : "Vous devez fournir un nombre éventuellement approximé.";
    }
    if (/^erreur:(?:[0-9]+(?:\.[0-9]+)?)|(?:\.[0-9]+)$/.test(format)) {
        return /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?$/.test(expr) ? true : "Vous devez fournir un nombre éventuellement approximé.";
    }
    // autres formats à ajouter ici
    return true;
}

function checkValue(userValue, expectedValue, format = "none") {
    const checkFormatResult = checkFormat(userValue, format);
    if (checkFormatResult !== true) {
        return false;
    }
    // je traite d'abord les cas où le format devrait être numérique
    if (format === "numeric") {
        // numérique mais exacte. Une comparaison directe suffit
        return nerdamer(userValue).eq(nerdamer(expectedValue));
    }
    if (format.startsWith("round:") || format.startsWith("erreur:")) {
        // Il faut une évaluation float des deux valeurs
        const userFloat = expressionToFloat(userValue);
        const expectedFloat = expressionToFloat(expectedValue);
        if (isNaN(userFloat) || isNaN(expectedFloat)) {
            return false;
        }
        const param = Number(format.split(':')[1]);
        if (format.startsWith("round:")) {
            const factor = Math.pow(10, param);
            return Math.round(userFloat * factor) === Math.round(expectedFloat * factor);
        } else if (format.startsWith("erreur:")) {
            const tolerance = param;
            return Math.abs(userFloat - expectedFloat) <= tolerance;
        }
    }
    // autres formats à ajouter ici
    return nerdamer(userValue).eq(nerdamer(expectedValue));
}
    
export { checkFormat, checkValue };
/**
 * Check if the userValue matches the expected format.
 */

import nerdamer from 'nerdamer';
import 'nerdamer/all';

function checkNumericExpression(expr) {
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
}

function checkFormat(expr, format) {
    if (format === 'numeric') {
        return checkNumericExpression(expr);
    }
    // autres formats à ajouter ici
    return true;
}

export default checkFormat;
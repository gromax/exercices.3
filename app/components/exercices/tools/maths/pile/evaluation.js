import Alea from './alea';
import Table from './table'; // Tables et stats
import Calc from './calc';
import Dist from './dist'; // Distributions
import MyMath from '../mymath';
import { getValue, substituteLabels, substituteParams } from '../misc/substitution';

const MODULES = {
    'Alea': Alea,
    'Calc': Calc,
    'Table': Table,
    'Dist': Dist,
};

function _tryAsPile(expression, params) {
    let expr = expression.trim();
    if (! /^<P:.*>$/.test(expr)) {
        return null;
    }
    let pile = expr.slice(3, -1).trim().split(/\s+/).map(
        s => {
            const trimmed = s.trim();
            return getValue(trimmed, params) ?? substituteLabels(trimmed, params);
        }
    );
    return _executePile(pile);
}

function _executePile(pile) {
    const operandes = [];
    pile.reverse();
    if (pile.length === 0) return null;
    while (pile.length > 0) {
        let top = pile.pop();
        if (typeof top !== 'string') {
            operandes.push(top);
            continue;
        }
        if (top in Calc.SHORTCUTS) {
            top = Calc.SHORTCUTS[top];
        }
        if (!/^[A-Za-z_]+\.[A-Za-z_]\w*$/.test(top)) {
            operandes.push(top);
            continue;
        }
        const match = top.match(/^(\w+)\.(\w+)$/);
        const moduleName = match[1];
        const functionName = match[2];
        const m = MODULES[moduleName];
        if (!m) {
            throw new Error(`Module ${moduleName} non trouvé`);
        }
        if (!m.METHODS[functionName]) {
            throw new Error(`Fonction ${functionName} non trouvée dans le module ${moduleName}`);
        }
        const f = m.METHODS[functionName];
        const n = f.length;
        if (operandes.length < n) {
            throw new Error(`Pas assez d'opérandes pour l'opération ${top}`);
        }
        const args = operandes.splice(operandes.length - n, n);
        const result = f(...args);
        if (result !== undefined) {
            operandes.push(result);
        }
    }
    if (operandes.length !== 1) {
        throw new Error("La pile n'a pas été réduite à une seule valeur.");
    }
    return operandes[0];
}

/**
 * évalue une expression
 * @param {MyMath|string|number|Array} expression 
 * @param {object} params 
 * @returns 
 */
function evaluate(expression, params) {
    if (typeof expression === 'string') {
        const pileResult = _tryAsPile(expression, params)
        if (pileResult !== null) {
            return pileResult
        }
        if (expression.startsWith('[') && expression.endsWith(']')) {
            // liste
            const vals = expression.slice(1, -1).split(',').map(v => v.trim())
            return vals.map(v => MyMath.make(substituteParams(v, params)))
        }
        if (expression.startsWith('"') && expression.endsWith('"')) {
            // chaîne de caractères
            return expression.slice(1, -1);
        }
        expression = substituteParams(expression, params)
    }
    if (Array.isArray(expression)) {
        return expression.map(expr => MyMath.make(expr))
    }
    return MyMath.make(expression)
}

export default evaluate
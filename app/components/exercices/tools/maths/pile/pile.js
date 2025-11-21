import Alea from './alea.js';
import Table from './table.js';
import Calc from './calc.js';
import { getValue, substituteLabels } from '../misc/substitution.js';

const MODULES = {
    'Alea': Alea,
    'Calc': Calc,
    'Table': Table
};

function tryAsPile(expression, params) {
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
        if (!/^[A-Za-z_]+\.[A-Za-z_]+$/.test(top)) {
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

export default tryAsPile;
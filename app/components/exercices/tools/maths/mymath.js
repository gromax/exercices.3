import Parser from './parser/parser.js';
import { build } from './parser/rpnbuilder.js';
import Alea from './misc/alea.js';
import Calc from './misc/calc.js';
import Table from './misc/table.js';
import nerdamer from 'nerdamer';
import 'nerdamer/all';

const MODULES = {
    'Alea': Alea,
    'Calc': Calc,
    'Table': Table
};

/**
 * parse
 * @param {string} input 
 */
function parse(input) {
    const parsed = new Parser(input);
    return build(parsed.rpn);
}

function executePile(pile) {
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

/**
 * Si chaine est de la forme @name.sub
 * avec name dans params, alors renvoie params[name][sub]
 * @param {string} chaine 
 * @param {*} params 
 */
function getValue(chaine, params) {
    const m = chaine.match(/^@([A-Za-z_]\w*)(?:\.([A-Za-z_]\w*)|\[((?:@[A-Za-z_]\w*|[0-9]+)?)\])?$/);
    if (!m) {
        return null;
    }
    const [, name, sub, index] = m;
    return _getValueInternal(name, sub, index, params);
}

/**
 * Fonction interne pour obtenir la valeur d'un paramètre
 * @param {string} name nom du paramètre
 * @param {string|undefined} sub nom éventuel d'un attribut (.sub)
 * @param {string|undefined} index indice éventuel ([index])
 * @param {object} params 
 * @returns {*} la valeur du paramètre
 */
function _getValueInternal(name, sub, index, params) {
    if (params[name] === undefined) {
        throw new Error(`@${name} n'est pas défini.`);
    }
    if (sub === undefined && index === undefined) {
        return params[name];
    }
    if (sub !== undefined) {
        if (params[name][sub] === undefined) {
            throw new Error(`@${name}.${sub} n'est pas défini.`);
        }
        return params[name][sub];
    }
    if (!Array.isArray(params[name])) {
        throw new Error(`Le paramètre ${name} n'est pas un tableau.`);
    }
    if (index === "" && params.__i === undefined) {
        throw new Error(`Pas d'index défini pour accéder à ${name}[]. Ajoutez <:n> à votre affectation.`);
    }
    const idx = index === ""
        ? params.__i
        : (/[0-9]+/.test(index) ? parseInt(index, 10) : getValue(index, params));
    if (idx >= params[name].length){
        throw new Error(`L'index ${idx} est hors limites pour le tableau ${name} de taille ${params[name].length}.`);
    }
    return params[name][idx];
}

function evaluate(expression, params) {
    let expr = expression.trim();
    if (/^<P:.*>$/.test(expr)) {
        // expression commence par [ et finit par ]
        let pile = expr.slice(3, -1).trim().split(/\s+/).map(
            s => {
                const trimmed = s.trim();
                return getValue(trimmed, params) ?? substituteLabels(trimmed, params, true);
           }
         );
         return executePile(pile);
    }
    const substituted_expr = substituteLabels(expr, params, true);
    //console.log("Evaluating expression:", expression, "->", substituted_expr, "->", nerdamer(substituted_expr).toString());
    return nerdamer(substituted_expr).toString();
}

/**
 * Effectue une comparaison entre deux expressions selon l'opérateur donné
 * @param {*} leftExpr doit pouvoir être converti en string puis nerdamer
 * @param {*} rightExpr idem
 * @param {string} operator parmi ==, !=, <, <=, >, >=
 * @param {object} params permet de substituer des labels dans les expressions
 * @returns {boolean} le résultat de la comparaison
 */
function compare(leftExpr, rightExpr, operator, params) {
    const leftValue = String(evaluate(leftExpr, params));
    const rightValue = String(evaluate(rightExpr, params));
    switch (operator) {
        case '==':
            return nerdamer(leftValue).eq(nerdamer(rightValue));
        case '!=':
            return !nerdamer(leftValue).eq(nerdamer(rightValue));
        case '<':
            return nerdamer(leftValue).lt(nerdamer(rightValue));
        case '<=':
            return nerdamer(leftValue).lte(nerdamer(rightValue));
        case '>':
            return nerdamer(leftValue).gt(nerdamer(rightValue));
        case '>=':
            return nerdamer(leftValue).gte(nerdamer(rightValue));
    }
    return false;
}

/**
 * Renvoie la valeur au en texte au format spécifié
 * Le format peut être '$' pour LaTeX, 'f' pour décimal avec virgule,
 * ou 'Nf' pour décimal avec N chiffres après la virgule.
 * @param {*} value chaîne ou objet
 * @param {string} format précise le format
 * @returns {string} la valeur formatée
 */

function toFormat(value, format) {
    format = (format || '').trim();
    if (format === '$') {
        if (typeof value.toTex === 'function') {
            return value.toTex();
        }
        return latex(String(value));
    }
    if (format === 'f') {
        if (typeof value.toDecimal === 'function') {
            return String(value.toDecimal()).replace('.', ',');
        }
        return nerdamer(String(value)).text('decimals').replace('.', ',');
    }
    const m = format.match(/^([1-9][0-9]*)f$/);
    if (m) {
        const n = parseInt(m[1], 10);
        if (typeof value.toDecimal === 'function') {
            return value.toDecimal().toFixed(n).replace('.', ',');
        }
        return nerdamer(String(value)).text('decimals', n).replace('.', ',');
    }
    return String(value);
}

function latex(expression) {
    //return String(parse(expression).toTex());
    return nerdamer(expression).toTeX();
}

function parseUser(expr) {
    // Le but est ici de gérer des expressions utilisateurs
    // qui ne sont pas forcément valides en Algebrite
    // Par exemple : 5 + 3% -> 5 + (3 / 100)
    //return MyMath.parse(expr).toString();
    return expr.replace(',', '.');
}

// solution à étudier pour conserver les décimaux dans le TeX
function toTeXKeepDecimals(expr) {
    // map des tokens -> littéral décimal
    const map = {};
    let i = 0;
    // capture décimaux (ex. 0.1, .5, 12.34)
    const tokenized = expr.replace(/(?<![\w.])(-?\d*[.,]\d+)(?![\w.])/g, (m) => {
      const token = `__DEC_${i++}__`;
      map[token] = m;
      return token;
    });

    // passer à nerdamer (les tokens sont des identifiants valides)
    const tex = nerdamer(tokenized).toTeX();

    // remplacer les tokens par les littéraux décimaux d'origine dans le TeX
    let out = tex;
    for (const token in map) {
      out = out.split(token).join(map[token]);
    }
    return out;
}

/**
 * remplace les labels @label dans une expression par leur valeur
 * @param {string} expr une expression
 * @param {object} params les paramètres connus
 * @returns {string} une chaîne où les paramètres connus ont été remplacés par leur valeur
 */
function substituteLabels(expr, params, forceParenthesis=false) {
    const aleas = {};
    return expr.replace(/@([A-Za-z_]\w*)(?:\.([A-Za-z_]\w*)|\[((?:@[A-Za-z_]\w*|[0-9]+)?)\])?/g, (match, name, sub, index) => {
        // on envisage que le tag soit de la forme __a._10
        // dans ce cas on remplace par une valeur aléatoire constante
        if (name=== '__a') {
            const nStr = sub ? sub.slice(1) : '';
            const n = Number(nStr);
            if (isNaN(n) || !Number.isInteger(n) || n < 0) {
                throw new Error(`Index invalide pour un paramètre aléatoire : ${match}`);
            }
            if (aleas[sub] === undefined) {
                const value = Math.floor(Math.random()*n);
                aleas[sub] = value;
            }
            return String(aleas[sub]);
        }
        const replacement = _getValueInternal(name, sub, index, params);
        if (replacement === null) {
            return match;
        }
        return forceParenthesis ? `(${String(replacement)})` : String(replacement);
    });
}

function expressionToFloat(expression, params) {
    try {
        const substituted_expr = substituteLabels(expression, params, true);
        return parseFloat(nerdamer(substituted_expr).text('decimals'));
    } catch (e) {
        console.warn(`Erreur lors de la conversion de ${expression} en nombre décimal :`, e);
        return 0;
    }
}

const MyMath = {
    parse,
    evaluate,
    compare,
    toFormat,
    latex,
    parseUser,
    substituteLabels,
    expressionToFloat,
    getValue
};

export default MyMath
import Parser from './parser/parser.js';
import { build } from './parser/rpnbuilder.js';
import Alea from './misc/alea.js';
import nerdamer from 'nerdamer';
import 'nerdamer/all';

const MODULES = [Alea];

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
      const top = pile.pop();
      if (typeof top !== 'string') {
          operandes.push(top);
          continue;
      }
      if (!/^[A-Za-z_]+\.[A-Za-z_]+$/.test(top)) {
        operandes.push(top);
        continue;
      }
      const match = top.match(/^(\w+)\.(\w+)$/);
      const moduleName = match[1];
      const functionName = match[2];
      const m = MODULES.find(mod => mod.name == moduleName);
      if (!m) {
        throw new Error(`Module ${moduleName} non trouvé`);
      }
      if (!m.hasOwnProperty(functionName)) {
        throw new Error(`Fonction ${functionName} non trouvée dans le module ${moduleName}`);
      }
      const n = m[functionName].length;
      if (operandes.length < n) {
          throw new Error(`Pas assez d'opérandes pour l'opération ${top}`);
      }
      const args = operandes.splice(operandes.length - n, n);
      const result = m[functionName](...args);
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
    const m = chaine.match(/^@([A-Za-z_]\w*)\.([A-Za-z_]\w*)$/);
    if (!m) {
        return null;
    }
    const [, name, sub] = m;
    if (name in params) {
        return params[name][sub];
    }
    return null;
}


function evaluate(expression, params) {
    let expr = expression.trim();
    if (/^\[.*\]$/.test(expr)) {
        // expression commence par [ et finit par ]
        let pile = expr.slice(1, -1).trim().split(/\s+/).map(
            s => {
                const trimmed = s.trim();
                return getValue(trimmed, params) ?? substituteLabels(trimmed, params, true);
           }
         );
         return executePile(pile);
    }
    const substituted_expr = MyMath.substituteLabels(expr, params, true);
    return nerdamer(substituted_expr).simplify().toString();
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
    console.log('latex', expression);
    console.log('nerdamer', nerdamer(expression).toString());
    console.log('toTeX', nerdamer(expression).toTeX());
    return nerdamer(expression).toTeX();
}

function parseUser(expr) {
    // Le but est ici de gérer des expressions utilisateurs
    // qui ne sont pas forcément valides en Algebrite
    // Par exemple : 5 + 3% -> 5 + (3 / 100)
    //return MyMath.parse(expr).toString();
    return expr.replace(',', '.');
}

function areEqual(expr1, expr2) {
    const res = nerdamer(`(${expr1}) - (${expr2})`).simplify().toString();
    return String(res) === '0';
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
    return expr.replace(/@([A-Za-z_]\w*(\.[A-Za-z_]\w*)?)/g, (match, label,sub) => {
        // match === "@x" ou "@user.name"
        // label === "x" ou "user.name"
        // sub === undefined ou ".name"
        if (sub) {
            label = label.split('.')[0];
            sub = sub.slice(1); // enlever le point
        }
        if (!params.hasOwnProperty(label)) {
            return match; // ne remplace pas si le paramètre n'existe pas
        }
        const value = sub
          ? params[label][sub]
          : params[label];
        if (value === undefined) return match;
        return forceParenthesis ? `(${String(value)})` : String(value);
    });
}

const MyMath = {
    parse,
    evaluate,
    toFormat,
    latex,
    areEqual,
    parseUser,
    substituteLabels,
};

export default MyMath
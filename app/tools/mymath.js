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
  if (pile.length === 0) return null;
  while (pile.length > 0) {
      const top = pile.pop();
      if (typeof top !== 'string') {
          operandes.push(top);
          continue;
      }
      if (!/^\w+\.\w+$/.test(top)) {
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
      const args = operandes.splice(operandes.length - n, n).reverse();
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

function evaluate(expression, format=null) {
    let expr = expression.trim();
    if (/^\[.*\]$/.test(expr)) {
      // expression commence par [ et finit par ]
      let pile = expr.slice(1, -1).trim().split(/\s+/).map(
        s => s.trim()
      );
      return toFormat(executePile(pile), format||'');
    }
    return toFormat(nerdamer(expr).simplify().toString(), format||'');
}

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

const MyMath = {
    parse,
    evaluate,
    latex,
    areEqual,
    parseUser
};

export default MyMath
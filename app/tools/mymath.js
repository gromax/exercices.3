import Parser from './parser/parser.js';
import { build } from './parser/rpnbuilder.js';
import Alea from './misc/alea.js';
import Algebrite from 'algebrite';

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
    return toFormat(Algebrite.simplify(expr), format||'');
}

function toFormat(value, format) {
    format = (format || '').trim();
    if (format === '$') {
        if (typeof value.tex === 'function') {
            return value.tex();
        }
        return latex(String(value));
    }
    if (format === 'f') {
        if (typeof value.toDecimal === 'function') {
            return String(value.toDecimal());
        }
        return Algebrite.run(`float(${String(value)})`).toString();
    }
    const m = format.match(/^([1-9][0-9]*)f$/);
    if (m) {
        const n = parseInt(m[1], 10);
        if (typeof value.toDecimal === 'function') {
            return value.toDecimal().toFixed(n);
        }
        return parseFloat(Algebrite.run(`float(${String(value)})`)).toFixed(n);
    }
    return String(value);
}

function latex(expression) {
    return String(parse(expression).tex());
}

function areEqual(expr1, expr2) {
    const e1 = MyMath.parse(expr1).toString();
    const e2 = MyMath.parse(expr2).toString();
    const res = Algebrite.simplify(`(${e1}) - (${e2})`);
    return String(res) === '0';
}

const MyMath = {
    parse,
    evaluate,
    latex,
    areEqual
};

export default MyMath
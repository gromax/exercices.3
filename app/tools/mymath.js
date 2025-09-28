import { Parser } from './parser/parser.js';
import { build } from './parser/rpnbuilder.js';

/**
 * parse
 * @param {string} input 
 */
function parse(input) {
    const parsed = new Parser(input);
    return build(parsed.rpn);
}

function substituteLabels(expr, params) {
  return expr.replace(/@(\w+)/g, (match, label) => {
    if (!params.hasOwnProperty(label)) {
        throw new Error(`Lecture d'un paramètre inconnu : ${label}`);
    }
    return `(${params[label]})`;
  });
}

function evaluate(expression, params) {
    const substituted = substituteLabels(expression, params);
    const expr = parse(substituted);
    return String(expr.toDecimal());
}

const MyMath = {
    parse,
    evaluate
};

export default MyMath
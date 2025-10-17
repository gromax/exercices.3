import MyMath from '@tools/mymath.js';

/**
 * remplace les labels @label dans une expression par leur valeur
 * @param {string} expr une expression
 * @param {object} params les paramètres connus
 * @returns {string} une chaîne où les paramètres connus ont été remplacés par leur valeur
 */
function substituteLabels(expr, params, forceParenthesis=false) {
    return expr.replace(/@(\w+)/g, (match, label) => {
        if (!params.hasOwnProperty(label)) {
            return `@${label}`; // ne remplace pas si le paramètre n'existe pas
        }
        if (forceParenthesis) {
            return `(${String(params[label])})`;
        }
        return String(params[label]);
    });
}

function substituteExpressions(str, params) {
    return str.replace(/\{([^:]+):\s*([\w]*|\$)?\}/g, (match, expr, format) => {
        const sexpr = substituteLabels(expr, params, true);
        return MyMath.evaluate(sexpr, format);
    });
}

function substituteLatex(string) {
    return string.replace(/<\$:([^:]+):>/g, (match, texte) => {
        return `$${MyMath.latex(texte)}$`;
    });
}

export {
    substituteLabels,
    substituteLatex,
    substituteExpressions
};
import MyMath from '@tools/mymath.js';

function substituteExpressions(str, params) {
    return str.replace(/\{([^:]+):\s*([\w]*|\$)?\}/g, (match, expr, format) => {
        const evaluation = MyMath.evaluate(expr, params, true);
        return MyMath.evaluate(evaluation, format);
    });
}

function substituteLatex(string) {
    return string.replace(/<\$:([^:]+):>/g, (match, texte) => {
        return `$${MyMath.latex(texte)}$`;
    });
}

export {
    substituteLatex,
    substituteExpressions
};
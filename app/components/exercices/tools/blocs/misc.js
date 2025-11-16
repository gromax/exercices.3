import MyMath from '../maths/mymath.js';

function substituteExpressions(str, params) {
    return str.replace(/\{([^:]+):\s*([\w]*|\$)?\}/g, (match, expr, format) => {
        const evaluation = MyMath.getValue(expr, params)??MyMath.substituteLabels(expr, params, true);
        return MyMath.toFormat(evaluation, format);
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
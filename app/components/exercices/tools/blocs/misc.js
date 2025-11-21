import MyNerd from '../maths/mynerd.js';

function substituteLatex(string) {
    return string.replace(/<\$:([^:]+):>/g, (match, texte) => {
        return `$${MyNerd.latex(texte)}$`;
    });
}

export {
    substituteLatex
};
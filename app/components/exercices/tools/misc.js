/**
 * remplace les labels @label dans une expression par leur valeur
 * @param {string} expr une expression
 * @param {object} params les paramètres connus
 * @returns {string} une chaîne où les paramètres connus ont été remplacés par leur valeur
 */
function substituteLabels(expr, params) {
    return expr.replace(/@(\w+)/g, (match, label) => {
        if (!params.hasOwnProperty(label)) {
            return `@${label}`; // ne remplace pas si le paramètre n'existe pas
        }
        return String(params[label]);
    });
}

export { substituteLabels };
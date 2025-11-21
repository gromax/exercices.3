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

/**
 * remplace les labels @label dans une expression par leur valeur
 * On prévoit toujours des parenthèses autour de la valeur substituée au cas où ce soit une expression
 * @param {string} expr une expression
 * @param {object} params les paramètres connus
 * @returns {string} une chaîne où les paramètres connus ont été remplacés par leur valeur
 */
function substituteLabels(expr, params) {
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
        return `(${String(replacement)})`;
    });
}



export {
    substituteLabels,
    getValue,
};
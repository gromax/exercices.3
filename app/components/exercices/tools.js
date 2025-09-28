import MyMath from '@tools/mymath.js';

/**
 * Fonction qui retourne le niveau d'indentation d'une ligne
 * @param {string} line la ligne à analyser
 * @returns {number}
 */
function indent(line) {
    return line.match(/^\s*/)[0].length;
}
/**
 * Fonction qui analyse une condition de la forme [ @label == valeur ]
 * et qui renvoie un objet { label: string, value: string } ou null si la ligne n'est pas une condition
 * @param {string} line la ligne à analyser
 * @returns {object|null}
 */
function parseCondition(line) {
    const regex = /\[\s*@(\w+)\s*==\s*(.*?)\s*\]/;
    const match = line.match(regex);
    if (match) {
        return {
            label: match[1],
            value: match[2]
        };
    }
    return null;
}

/**
 * Fonction qui analyse une ligne de la forme @label = expression
 * et qui renvoie un objet { label: string, expression: string } ou null si la ligne n'est pas une affectation
 * @param {string} line la ligne à analyser
 * @returns {object|null}
 */
function parseAssignment(line) {
    const regex = /^\s*@(\w+)\s*=\s*(.*?)\s*$/;
    const match = line.match(regex);
    if (match) {
        return {
            label: match[1],
            expression: match[2]
        };
    }
    return null;
}

/**
 * Fonction d'initialisation des paramètres d'un exercice
 * @param {string} text 
 * @param {object|undefined|string} options 
 */
function initExoParams(text, options) {
    options = options || {};
    if (typeof options === 'string') {
        options = JSON.parse(options);
    }
    text = text || "";
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const params = {};
    let i = 0;
    while (i<lines.length) {
        let line = lines[i];
        line = line.trim();
        if (line === '' || line.startsWith('#')) {
            i++;
            continue;
        }
        const condition = parseCondition(line);
        if (condition) {
            const value = options[condition.label] ?? params[condition.label] ?? null;
            if (value === null) {
                throw new Error(`Le paramètre ${condition.label} est inconnu.`);
            }
            if (String(value) === condition.value) {
                i++;
                continue;
            }
            // on saute les lignes jusqu'à retrouver une ligne au même niveau d'indentation
            const currentIndent = indent(line);
            while (i < lines.length && indent(lines[i]) > currentIndent) {
                i++;
            }
            continue;
        }
        const assignment = parseAssignment(line);
        if (!assignment) {
            throw new Error(`La ligne suivante n'est pas une affectation valide : ${line}`);
        }
        if (assignment.label in params) {
            throw new Error(`Le paramètre ${assignment.label} est déjà défini.`);
        }
        if (assignment.label in options) {
            throw new Error(`Le paramètre ${assignment.label} est protégé et ne peut pas être redéfini.`);
        }
        params[assignment.label] = MyMath.evaluate(assignment.expression, { ...params, ...options });
        i++;
    }
    return params;
}

const Tools = {
    initExoParams
}

export default Tools;
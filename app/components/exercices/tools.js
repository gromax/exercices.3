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
 * remplace les labels @label dans une expression par leur valeur
 * @param {string} expr une expression
 * @param {object} params les paramètres connus
 * @returns {string} une chaîne où les paramètres connus ont été remplacés par leur valeur
 */
function substituteLabels(expr, params) {
  return expr.replace(/@(\w+)/g, (match, label) => {
    if (!params.hasOwnProperty(label)) {
        throw new Error(`Lecture d'un paramètre inconnu : ${label}`);
    }
    return String(params[label]);
  });
}

/**
 * Fonction qui analyse une condition de la forme { expr1 == expr2 } && {...}
 * et qui renvoie un tableau d'objets [{ left: string, right: string, operator:string }] ou null si la ligne n'est pas une condition
 * @param {string} line la ligne à analyser
 * @returns {array|null}
 */
function parseCondition(line) {
    const regex = /^\{\s*[\w@]+\s*([=!]=)\s*[\w@]+\s*\}(\s*&&\s*\{\s*[\w@]+\s*[=!]=\s*[\w@]+\s*\})*$/g;
    if (!regex.test(line)) {
        return null;
    }
    const components = line.split('&&').map(comp => comp.trim());
    const conditions = components.map(comp => {
        const match = comp.match(/\{\s*([\w@]+)\s*([=!]=)\s*([\w@]+)\s*\}/);
        if (match) {
            return {
                left: match[1],
                right: match[3],
                operator: match[2]
            };
        }
        return null;
    }).filter(Boolean);
    return conditions.length > 0 ? conditions : null;
}

/** Fonction qui teste une condition sur un ensemble de paramètres
 * @param {object} condition  { left: string, right: string, operator:string }
 * @param {object} params 
 * @returns {boolean}
 */
function testSingleCondition(condition, params) {
    const left = MyMath.evaluate(substituteLabels(condition.left, params));
    const right = MyMath.evaluate(substituteLabels(condition.right, params));
    return (left === right) === (condition.operator === '==');
}

/** Fonction qui teste un ensemble de conditions sur un ensemble de paramètres
 * @param {array} conditions  [{ left: string, right: string, operator:string }]
 * @param {object} params 
 * @returns {boolean}
 */
function testConditions(conditions, params) {
    for (const condition of conditions) {
        if (!testSingleCondition(condition, params)) {
            return false;
        }
    }
    return true;
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
 * Certains paramètres pouvant être aléatoire
 * on peut prévoir des reboot si certaines conditions sont insatisfaites
 * réessaie jusqu'à 50 fois avant de renvoyer une erreur
 * @param {string} text 
 * @param {object} options 
 * @returns {object}
 */
function initExoParams(text, options) {
    for (let attempt = 1; attempt <= 50; attempt++) {
        const result = initExoParamsOneTry(text, options);
        if (result !== null) {
            return result;
        }
    }
    throw new Error("Impossible d'initialiser les paramètres de l'exercice après 50 essais.");
}

/**
 * Fonction d'initialisation des paramètres d'un exercice
 * Fait un essain unique de résolution des paramètres
 * @param {string} text 
 * @param {object|null} options 
 */
function initExoParamsOneTry(text, options) {
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
            if (testConditions(condition, { ...params, ...options })) {
                // on entre dans ce bloc
                i++;
                continue;
            }
            // on saute les lignes jusqu'à retrouver une ligne au même niveau d'indentation
            const currentIndent = indent(line);
            i++;
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
        const substituted = substituteLabels(assignment.expression, { ...params, ...options });
        params[assignment.label] = MyMath.evaluate(substituted);
        i++;
    }
    return params;
}

const Tools = {
    initExoParams
}

export default Tools;
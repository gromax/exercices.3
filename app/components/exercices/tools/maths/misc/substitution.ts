import { TParams, InputType, NestedArray, NestedInput } from "@types"
import MyMath from "../mymath";

const PREMIERS = [
    2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101,
    103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229,
    233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353,
    359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479,
    487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617,
    619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757,
    761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907,
    911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997
]

/**
 * Si chaine est de la forme @name.sub
 * avec name dans params, alors renvoie params[name][sub]
 * @param {string} chaine 
 * @param {TParams} params 
 */
function getValue(chaine:string, params:TParams):NestedInput {
    const m = chaine.match(/^@([A-Za-z_]\w*)(?:\.([A-Za-z_]\w*)|\[((?:@[A-Za-z_]\w*|[0-9]+)?)\])?$/);
    if (!m) {
        return null;
    }
    const [, name, sub, index] = m;
    return _getValueInternal(name, sub, index, params);
}

function _getIndex(index:string, params:TParams):number {
    if (index === "") {
        if (typeof params.__i !== "number") {
            throw new Error(`Index indéfini !`)
        }
        return params.__i
    }
    if (/[0-9]+/.test(index)) {
        return parseInt(index, 10)
    }
    const v = getValue(index, params)
    if (Array.isArray(v)) {
        throw new Error(`On demandait une valeur unique, pas un tableau`)
    }
    if (v instanceof MyMath) {
        return Math.round(v.toFloat())
    }
    const n = parseInt(String(v), 10)
    if (isNaN(n)) {
        throw new Error(`${index} est index non valide`)
    }
    return n
}

/**
 * Fonction interne pour obtenir la valeur d'un paramètre
 * @param {string} name nom du paramètre
 * @param {string|undefined} sub nom éventuel d'un attribut (.sub)
 * @param {string|undefined} index indice éventuel ([index])
 * @param {TParams} params 
 * @returns {*} la valeur du paramètre
 */
function _getValueInternal(
    name:string,
    sub:string|undefined,
    index:string|undefined,
    params:TParams
):NestedInput {
    if (name === '__a') {
        if (sub === undefined) {
            throw new Error(`@__a doit être suivi d'un modificateur.`)
        }
        return _getAlea(sub)
    }
    if (params[name] === undefined) {
        throw new Error(`@${name} n'est pas défini.`)
    }
    if (sub === undefined && index === undefined) {
        return params[name]
    }
    if (sub !== undefined) {
        if (params[name][sub] === undefined) {
            throw new Error(`@${name}.${sub} n'est pas défini.`);
        }
        return params[name][sub];
    }
    // on a un index
    if (!Array.isArray(params[name])) {
        throw new Error(`Le paramètre ${name} n'est pas un tableau.`)
    }
    if (index === "" && params.__i === undefined) {
        throw new Error(`Pas d'index défini pour accéder à ${name}[]. Ajoutez <:n> à votre affectation.`)
    }
    const idx = _getIndex(index, params)
    if (idx >= params[name].length){
        throw new Error(`L'index ${idx} est hors limites pour le tableau ${name} de taille ${params[name].length}.`)
    }
    return params[name][idx]
}

/**
 * remplace les labels @label dans une expression par leur valeur
 * On prévoit toujours des parenthèses autour de la valeur substituée au cas où ce soit une expression
 * @param {string} expr une expression
 * @param {TParams} params les paramètres connus
 * @returns {string} une chaîne où les paramètres connus ont été remplacés par leur valeur
 */
function substituteLabels(expr:string, params:TParams):string {
    return expr.replace(/@([A-Za-z_]\w*)(?:\.([A-Za-z_]\w*)|\[((?:@[A-Za-z_]\w*|[0-9]+)?)\])?/g, (match, name, sub, index) => {
        // on envisage que le tag soit de la forme __a._10
        // dans ce cas on remplace par une valeur aléatoire constante
        if (name=== '__a') {
            return String(_getAlea(sub))
        }
        const replacement = _getValueInternal(name, sub, index, params)
        if (typeof replacement === 'string'
            && replacement.startsWith('"')
            && replacement.endsWith('"')) {
            return replacement.slice(1, -1)
        }
        return `(${String(replacement)})`
    });
}

function _getAlea(sub:string): number | string {
    if (!sub || sub.length === 0) {
        throw new Error("Modificateur manquant pour un paramètre aléatoire.")
    }
    const nStr = sub ? sub.slice(1) : ''
    const aType = sub ? sub.charAt(0) : ''
    // sub peut être de la forme
    // i# ou _# où # es un entier >=0 -> alea entier entre 0 et # exclu
    // I# ou _# où # es un entier >=0 -> alea entier entre 1 et # inclu
    // f# où # es un entier >=0 -> alea flottant entre 0 et # exclu 
    // s# où # es un entier >=0 -> alea entier entre -# et # exclu
    // S# où # es un entier >=0 -> alea flottant entre -# et # inclus, sans 0
    // v# où # est une chaine représentant des variables -> choisit aléatoirement la variable
    // P# renvoie un nombe premier inférieur ou égal à #, # devant aller de 2 à 1000
    if (aType === 'v') {
        if (nStr.length === 0) {
            throw new Error("Liste de variables vide pour un paramètre aléatoire.")
        }
        const i = Math.floor(Math.random() * nStr.length)
        return nStr.charAt(i)
    }
    const n = Number(nStr)
    if (isNaN(n) || !Number.isInteger(n) || n < 0) {
        throw new Error(`Index invalide pour un paramètre aléatoire : @__a.${aType}${nStr}`)
    }
    switch (aType) {
        case 'f':
            return Math.random() * n
        case 's':
            return Math.floor(Math.random() * (2 * n-1)) - (n-1)
        case 'S':
            let value = Math.floor(Math.random() * (2 * n)) - n
            if (value >= 0) {
                value += 1
            }
            return value;
        case 'I':
            return Math.floor(Math.random() * n) + 1
        case 'P':
            if (n < 2 || n > 1000) {
                throw new Error(`[@__a.P${nStr}] l'indice peut aller de 2 à 1000 compris.`)
            }
            const primes = PREMIERS.filter(p => p <= n)
            const i = Math.floor(Math.random() * primes.length)
            return primes[i]
        default:
            return Math.floor(Math.random() * n)
    }
}

function substituteParams(expression:NestedArray<any>, params:TParams):NestedArray<InputType> {
    if (Array.isArray(expression)) {
        return expression.map(expr => substituteParams(expr, params))
    }
    if (typeof expression !== 'string') {
        return expression
    }
    return expression.includes('@')
        ? getValue(expression, params) ?? substituteLabels(expression, params)
        : expression
}

export {
    substituteLabels,
    getValue,
    substituteParams,
};
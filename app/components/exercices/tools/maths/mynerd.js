/* Le but de ce module est de préprocesser des
   commandes avec nerdamer
   notamment, on veut pouvoir :
    - remplacer ln par log
    - remplacer log par log10
    - gérer les décimaux avec des virgules
    - faire une conversion tofloat
*/

import nerdamer from 'nerdamer';
import 'nerdamer/all';
import Parser from './parser/parser.js';
import { build } from './parser/rpnbuilder.js';


import { substituteLabels, getValue } from './misc/substitution.js';

class MyNerd {
    static parseFloat(value) {
        if (typeof value === 'number') {
            return value;
        }
        if (typeof value !== 'string') {
            value = String(value);
        }
        if (value.includes(',')) {
            value = value.replace(',', '.');
        }
        if (value.includes('%')) {
            value = value.replace('%', '');
            return parseFloat(value) / 100;
        }
        return parseFloat(value);
    }

    static make(expression, params = {}) {
        return new MyNerd(expression, params);
    }

    static latex(expression, params = {}) {
        const n = new MyNerd(expression, params);
        return n.latex();
    }
    
    static parseUser(expression) {
        // user ne va pas forcément respecter les * ou ce genre de détails
        // je vais donc preprocesser
        try {
            const parsed = new Parser(expression);
            const b = build(parsed.rpn);
            return new MyNerd(b.toString());
        } catch (e) {
            console.warn("Erreur lors du parsing de l'expression utilisateur :", e);
            return new MyNerd("NaN");
        }
    }

    static toFloat(expression, params = {}) {
        const n = new MyNerd(expression, params);
        return n.toFloat();
    }

    static toFormat(expression, format, params = {}) {
        const n = new MyNerd(expression, params);
        return n.toFormat(format);
    }

    static variables(expression, params = {}) {
        const n = new MyNerd(expression, params);
        return n.variables;
    }

    static buildFunction(expression, params = {}) {
        const n = new MyNerd(expression, params);
        return n.processed.buildFunction();
    }

    static solveInC(exprLeft, exprRight, varName) {
        try {
            const equation = `${exprLeft} = ${exprRight}`;
            const normalized = MyNerd.normalization(equation);
            const solutions = nerdamer.solveEquations(normalized, varName);
            return solutions.toString().split(',');
        } catch (e) {
            console.warn(`Erreur lors de la résolution de l'équation ${exprLeft} = ${exprRight} pour la variable ${varName} :`, e);
            return [];
        }
    }

    static solveInR(exprLeft, exprRight, varName) {
        const solutionsStr = MyNerd.solveInC(exprLeft, exprRight, varName);
        // je filtre les solutions complexes
        return solutionsStr.filter(sol => !sol.includes('i'));
    }

    /**
     * Effectue une comparaison entre deux expressions selon l'opérateur donné
     * @param {*} leftExpr doit pouvoir être converti
     * @param {*} rightExpr idem
     * @param {string} operator parmi ==, !=, <, <=, >, >=
     * @param {object} params permet de substituer des labels dans les expressions
     * @returns {boolean} le résultat de la comparaison
     */
    static compare(leftExpr, rightExpr, operator, params = {}) {
        const left = MyNerd.make(leftExpr, params);
        return left.compare(rightExpr, operator, params);
    }

    static normalization(expression) {
        if (typeof expression !== 'string') {
            expression = String(expression);
        }
        return expression
            .replace(/,/g, '.')            // virgules → points décimaux
            .replace(/\blog\(/g, 'log10(') // log( → log10(
            .replace(/\bln\(/g, 'log(');   // ln( → log(
    }

    static denormalization(expression) {
        if (typeof expression !== 'string') {
            expression = String(expression);
        }
        return expression
            .replace(/\./g, ',')            // points décimaux → virgules
            .replace(/\blog\(/g, 'ln(')     // log( → ln(
            .replace(/\blog10\(/g, 'log('); // log10( → log(
            
    }

    constructor(expression, params = {}) {
        if (typeof expression !== 'string') {
            expression = String(expression);
        }
        this._expression = expression.includes('@')
          ? getValue(expression, params) ?? substituteLabels(expression, params)
          : expression;
        this._normalized = MyNerd.normalization(this._expression);
        try {
            this._processed = nerdamer(this._normalized);
        } catch (e) {
            console.warn(`Erreur lors du traitement avec nerdamer de ${this._normalized}:`, e);
            this._processed = nerdamer("NaN");
        }
    }

    get expression() {
        return this._expression;
    }

    get processed() {
        return this._processed;
    }

    get variables() {
        return this._processed.variables();
    }

    toFloat() {
        try {
            return parseFloat(this._processed.text('decimals'));
        } catch (e) {
            console.warn(`Erreur lors de la conversion de ${this._expression} en nombre décimal :`, e);
            return NaN;
        }
    }

    toString() {
        return MyNerd.denormalization(this._processed.toString());
    }

    latex() {
        return MyNerd.denormalization(this._processed.toTeX());
    }

    /**
     * Renvoie la valeur au en texte au format spécifié
     * Le format peut être '$' pour LaTeX, 'f' pour décimal avec virgule,
     * ou 'Nf' pour décimal avec N chiffres après la virgule.
     * @param {*} value chaîne ou objet
     * @param {string} format précise le format
     * @returns {string} la valeur formatée
     */
    toFormat(format) {
        format = (format || '').trim();
        if (format === '$') {
            return this.latex();
        }
        if (format === 'f') {
            return this._toFormatDecimal(-1);
        }
        if (format === 'f$') {
            return this._toTexDecimal(-1);
        }
        const m = format.match(/^([1-9][0-9]*)f(\$)?$/);
        if (m) {
            const n = parseInt(m[1], 10);
            if (m[2]) {
                return this._toTexDecimal(n+1);
            }
            return this._toFormatDecimal(n+1);
        }
        return this.toString();
    }

    /**
     * renvoie au format décimal avec n chiffres après la virgule
     * @param {number} n -1 si pas de limite
     * @returns {string}
     */
    _toFormatDecimal(n) {
        if (n >= 0) {
            return MyNerd.denormalization(this._processed.text('decimals', n));
        }
        return MyNerd.denormalization(this._processed.text('decimals'));
    }

    /**
     * renvoie au format décimal pour TeX
     * @param {number} n -1 si pas de limite
     * @returns {string}
     */
    _toTexDecimal(n) {
        const expr = this._toFormatDecimal(n);
        // ensuite on veut générer du TeX
        // J'utilise mon parser
        const parsed = new Parser(expr);
        const b = build(parsed.rpn);
        return b.toTex();
    }

    compare(rightExpr, operator, params = {}) {
        const right = MyNerd.make(rightExpr, params);
        switch (operator) {
            case '==':
                return this._processed.eq(right.processed);
            case '!=':
                return !this._processed.eq(right.processed);
            case '<':
                return this._processed.lt(right.processed);
            case '<=':
                return this._processed.lte(right.processed);
            case '>':
                return this._processed.gt(right.processed);
            case '>=':
                return this._processed.gte(right.processed);
        }
        return false;
    }

    expand() {
        this._processed = this._processed.expand();
        return this;
    }

}

export default MyNerd;

/*
// solution à étudier pour conserver les décimaux dans le TeX
function toTeXKeepDecimals(expr) {
    // map des tokens -> littéral décimal
    const map = {};
    let i = 0;
    // capture décimaux (ex. 0.1, .5, 12.34)
    const tokenized = expr.replace(/(?<![\w.])(-?\d*[.,]\d+)(?![\w.])/g, (m) => {
      const token = `__DEC_${i++}__`;
      map[token] = m;
      return token;
    });

    // passer à nerdamer (les tokens sont des identifiants valides)
    const tex = nerdamer(tokenized).toTeX();

    // remplacer les tokens par les littéraux décimaux d'origine dans le TeX
    let out = tex;
    for (const token in map) {
      out = out.split(token).join(map[token]);
    }
    return out;
}
*/
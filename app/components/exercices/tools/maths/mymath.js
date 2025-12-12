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
import Parser from './parser/parser';
import { build } from './parser/rpnbuilder';
import { substituteLabels, getValue } from './misc/substitution';

class MyNath {
    /** @type{Array|null} enfants de l'objet */
    #children

    /** @type{string} expression d'origine */
    #expression = ""

    /** @type{nerdamer.Expression} */
    #processed

    /** @type{string} */
    #processed_lower_text = ""


    static reverseOperator(operator) {
        switch (operator) {
            case '<':
                return '>';
            case '<=':
                return '>=';
            case '>':
                return '<';
            case '>=':
                return '<=';
            case '==':
                return '==';
            case '!=':
                return '!=';
            default:
                throw new Error(`Opérateur inconnu : ${operator}`);
        }
    }

    static parseFloat(value) {
        if (typeof value === 'number') {
            return value;
        }
        if (value instanceof MyNerd) {
            return value.toFloat();
        }
        if (typeof value !== 'string') {
            value = String(value);
        }
        value = value.trim()
        if (/^[+-]?\s?inf(?:inity|ty|ini)?$/.test(value)) {
            return value.startsWith('-') ? -Infinity : Infinity;
        }
        return MyNerd.toFloat(value);
    }

    static parseInt(value) {
        const f = MyNerd.parseFloat(value);
        const n = Math.trunc(f);
        if (f !== n) {
            throw new Error(`La valeur ${value} ne peut pas être convertie en entier.`);
        }
        return n;
    }

    static make(expression, params = {}) {
        return new MyNerd(expression, params);
    }

    static latex(expression, params = {}) {
        if (/^[+-]?\s*(?:∞|inf|infinity|infty|infini)?$/.test(expression)) {
            return expression.startsWith('-') ? "-\\infty" : "+\\infty";
        }
        const n = new MyNerd(expression, params);
        return n.latex();
    }
    
    static parseUser(expression) {
        // user ne va pas forcément respecter les * ou ce genre de détails
        // je vais donc preprocesser
        if (/^[+-]?\s*(?:∞|inf|infinity|infty|infini)?$/.test(expression)) {
            expression = expression.startsWith('-') ? "-infinity" : "infinity";
        }
        try {
            const parsed = new Parser(expression);
            const b = build(parsed.rpn);
            return new MyNerd(b.toString());
        } catch (e) {
            console.warn("Erreur lors du parsing de l'expression utilisateur :", expression);
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
        return n.buildFunction();
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
            .replace(/\bln\(/g, 'log(')    // ln( → log(
            .replace(/%/g, '/100');        // % → /100
    }

    static denormalization(expression) {
        if (typeof expression !== 'string') {
            expression = String(expression);
        }
        if (expression === 'infinity') {
            return '+∞';
        } else if (expression === '-infinity') {
            return '-∞';
        }
        return expression
            .replace(/\./g, ',')            // points décimaux → virgules
            .replace(/\blog\(/g, 'ln(')     // log( → ln(
            .replace(/\blog10\(/g, 'log('); // log10( → log(
            
    }

    static latexDenormalization(expression) {
        if (typeof expression !== 'string') {
            expression = String(expression);
        }
        if (expression === '\\infty') {
            return '+\\infty';
        }
        return expression
            .replace(/\./g, ',')            // points décimaux → virgules
            .replace(/\b\\log\(/g, '\\ln(')            // log( → ln(
            .replace(/\b\\log10\(/g, '\\log(')         // log10( → log(
            .replaceAll('\\mathrm{log}_{10}', '\\log') // log → ln
            .replaceAll('\\mathrm{log}', '\\ln')       // log → ln
    }

    /**
     * remplace les expressions de la forme {expression:format}
     * par la valeur évaluée de l'expression au format spécifié
     */
    static substituteExpressions(texte, params) {
        return texte.replace(/\{([^:{}]+):\s*([\w]*(?:\$)?)?\}/g, (match, expr, format) => {
            return MyNerd.make(expr, params).toFormat(format);
        });
    }


    // Méthodes d'instance

    constructor(expression, params = {}) {
        if (typeof expression !== 'string') {
            expression = String(expression);
        }
        this.#expression = expression.includes('@')
          ? getValue(expression, params) ?? substituteLabels(expression, params)
          : expression;
        if (this.#expression === Infinity || this.#expression === "Infinity") {
            this.#expression = "infinity";
        } else if (this.#expression === -Infinity || this.#expression === "-Infinity") {
            this.#expression = "-infinity";
        }
          this.#children = null;
        if (Array.isArray(this.#expression)) {
            this.#children = this.#expression.map(expr => new MyNerd(expr, params));
            return;
        }
        this._normalized = MyNerd.normalization(this.#expression);
        try {
            this.#processed = nerdamer(this._normalized);
            this.#processed_lower_text = this.#processed.text().toLowerCase();
        } catch (e) {
            console.warn(`Erreur lors du traitement avec nerdamer de ${this._normalized}:`, e);
            this.#processed = nerdamer("NaN");
            this.#processed_lower_text = this.#processed.text().toLowerCase();
        }
    }

    get expression() {
        if (this.#children !== null) {
            return this.#children.map(child => child.expression);
        }
        return this.#expression;
    }

    get variables() {
        if (this.#children !== null) {
            return this.#children.map(child => child.variables);
        }
        return this.#processed.variables();
    }

    toFloat() {
        if (this.#children !== null) {
            return this.#children.map(child => child.toFloat());
        }
        try {
            const txt = this.#processed.evaluate().text('decimals');
            if (txt === 'infinity') {
                return Infinity;
            } else if (txt === '-infinity') {
                return -Infinity;
            }
            return parseFloat(txt);
        } catch (e) {
            console.warn(`Erreur lors de la conversion de ${this._expression} en nombre décimal :`, e);
            return NaN;
        }
    }

    toString() {
        if (this.#children !== null) {
            return this.#children.map(child => child.toString());
        }
        return MyNerd.denormalization(this.#processed.toString());
    }

    latex() {
        if (this.#children !== null) {
            return this.#children.map(child => child.latex());
        }
        const txt = this.#processed.text();
        if (txt === 'infinity') {
            return "+\\infty";
        } else if (txt === '-infinity') {
            return "-\\infty";
        }
        return MyNerd.latexDenormalization(this._processed.toTeX());
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
        if (this.#children !== null) {
            return this.#children.map(child => child.toFormat(format));
        }
        format = (format || '').trim();
        if (format === '$') {
            return this.latex();
        }
        if (format === 's$') {
            return this.#toMyLatex();
        }
        if (format === 'f') {
            return this.#toFormatDecimal(-1);
        }
        if (format === 'f$') {
            return this.#toTexDecimal(-1);
        }
        const m = format.match(/^([1-9][0-9]*)f(\$)?$/);
        if (m) {
            const n = parseInt(m[1], 10);
            if (m[2]) {
                return this.#toTexDecimal(n+1);
            }
            return this.#toFormatDecimal(n+1);
        }
        return this.toString();
    }

    /**
     * renvoie au format décimal avec n chiffres après la virgule
     * @param {number} n -1 si pas de limite
     * @returns {string}
     */
    #toFormatDecimal(n) {
        if (n >= 0) {
            return MyNerd.denormalization(this._processed.evaluate().text('decimals', n));
        }
        // Si on a une expression comme "4.3 + sqrt(4.5)", nerdamer ne va pas
        // exécuter la fonction. Dans ce cas il me semble plus pertinent d'évaluer
        return MyNerd.denormalization(this._processed.evaluate().text('decimals'));
    }

    /**
     * renvoie au format décimal pour TeX
     * @param {number} n -1 si pas de limite
     * @returns {string}
     */
    #toTexDecimal(n) {
        const expr = this.#toFormatDecimal(n);
        // ensuite on veut générer du TeX
        // J'utilise mon parser
        const parsed = new Parser(expr);
        const b = build(parsed.rpn);
        return b.toTex();
    }

    /**
     * Le latx de nerdamer n'est pas toujours satisfaisant
     * je prévois donc un format personalisé
     * @returns {string}
     */
    #toMyLatex() {
        const expr = this.#expression;
        const parsed = new Parser(expr);
        const b = build(parsed.rpn);
        return b.simplify().toTex();
    }


    compare(rightExpr, operator, params = {}) {
        if (this.#children !== null) {
            if (Array.isArray(rightExpr)) {
                if (rightExpr.length !== this.#children.length) {
                    throw new Error(`Les tableaux comparés n'ont pas la même taille.`);
                }
                return this.#children.map((child, index) => child.compare(rightExpr[index], operator, params));
            } else {
                return this.#children.map(child => child.compare(rightExpr, operator, params));
            }
        }
        const right = MyNerd.make(rightExpr, params);
        if (this.isInfinity()) {
            return this.#compareInfinityCase(right, operator);
        } else if (right.isInfinity()) {
            return right.#compareInfinityCase(this, MyNerd.reverseOperator(operator));
        }
        switch (operator) {
            case '==':
                return this.#processed.eq(right.#processed);
            case '!=':
                return !this.#processed.eq(right.#processed);
            case '<':
                return this.#processed.lt(right.#processed);
            case '<=':
                return this.#processed.lte(right.#processed);
            case '>':
                return this.#processed.gt(right.#processed);
            case '>=':
                return this.#processed.gte(right.#processed);
            default:
                throw new Error(`Opérateur de comparaison invalide : ${operator}`);
        }
    }

    #compareInfinityCase(othervalue, operator) {
        switch (operator) {
            case '==':
                return this.#processed_lower_text === othervalue.#processed_lower_text;
            case '!=':
                return this.#processed_lower_text !== othervalue.#processed_lower_text;
            case '<':
                return this.isMinusInfinity() && !othervalue.isMinusInfinity();
            case '<=':
                return this.isMinusInfinity();
            case '>':
                return this.isPlusInfinity() && !othervalue.isPlusInfinity();
            case '>=':
                return this.isPlusInfinity();
            default:
                throw new Error(`Opérateur de comparaison invalide : ${operator}`);
        }
    }

    isInfinity() {
        return this.#children === null && (this.#processed_lower_text === 'infinity' || this.#processed_lower_text === '-infinity');
    }

    isPlusInfinity() {
        return this.#children === null && this.#processed_lower_text === 'infinity';
    }

    isMinusInfinity() {
        return this.#children === null && this.#processed_lower_text === '-infinity';
    }

    expand() {
        if (this.#children !== null) {
            for (const child of this.#children) {
                child.expand();
            }
            return this;
        }
        this.#processed = this.#processed.expand();
        return this;
    }

    sub(varName, value) {
        if (this.#children !== null) {
            return new MyNerd(this.#children.map(child => child.sub(varName, value)));
        }
        this.#processed = this.#processed.sub(varName, value);
        return this;
    }

    buildFunction() {
        if (this.#children !== null) {
            return this.#children.map(child => child.buildFunction());
        }
        return this.#processed.buildFunction();
    }

}

export default MyNath;
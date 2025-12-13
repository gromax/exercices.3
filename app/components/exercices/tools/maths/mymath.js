/* Le but de ce module est de préprocesser des
   commandes avec nerdamer
   notamment, on veut pouvoir :
    - remplacer ln par log
    - remplacer log par log10
    - gérer les décimaux avec des virgules
    - faire une conversion tofloat
*/

import nerdamer from 'nerdamer'
import 'nerdamer/all'
import Parser from './parser/parser'
import { substituteParams } from './misc/substitution'
import { Base } from './number/base'

// Constante privée
// sert à empêcher l'accès direct au constructeur
const PRIVATE = Symbol('private');

class MyMathArray {
    /** @type{Array<MyMath>|null} enfants de l'objet */
    #children = null

    /**
     * constructeur
     * @param {Array<MyMath>} children 
     */
    constructor(children) {
        this.#children = children
    }

    get expression() {
        return this.#children.map(child => child.expression)
    }

    get variables() {
        return this.#children.map(child => child.variables)
    }

    toFloat() {
        return this.#children.map(child => child.toFloat());
    }

    toString() {
        return this.#children.map(child => child.toString());
    }

    latex() {
        return this.#children.map(child => child.latex());
    }

    toFormat(format) {
        return this.#children.map(child => child.toFormat(format));
    }

    expand() {
        return new MyMathArray(this.#children.map(child => child.expand()))
    }

    sub(varName, value) {
        return new MyMathArray(this.#children.map(child => child.sub(varName, value)))
    }

    buildFunction() {
        return this.#children.map(child => child.buildFunction())
    }

    compare(rightExpr, operator, params = {}) {
        if (Array.isArray(rightExpr) || (rightExpr instanceof MyMathArray)) {
            if (rightExpr.length !== this.#children.length) {
                throw new Error(`Les tableaux comparés n'ont pas la même taille.`);
            }
            if (Array.isArray(rightExpr)) {
                return this.#children.map((child, index) => child.compare(rightExpr[index], operator, params))
            } else {
                return this.#children.map((child, index) => child.compare(rightExpr.getChild(index), operator))
            }
        }
        return this.#children.map(child => child.compare(rightExpr, operator, params));
    }

    get length() {
        return this.#children.length;
    }

    getChild(index) {
        return this.#children[index]
    }

}


class MyMath {
    /** @type{string} expression d'origine */
    #expression

    /** @type{nerdamer.Expression|null} */
    #nerdamer_processed = null

    /** @type{Base|null} */
    #mynumber = null

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
        if (value instanceof MyMath) {
            return value.toFloat();
        }
        if (typeof value !== 'string') {
            value = String(value);
        }
        value = value.trim()
        if (/^[+-]?\s?inf(?:inity|ty|ini)?$/.test(value)) {
            return value.startsWith('-') ? -Infinity : Infinity;
        }
        return MyMath.toFloat(value);
    }

    static parseInt(value) {
        const f = MyMath.parseFloat(value);
        const n = Math.trunc(f);
        if (f !== n) {
            throw new Error(`La valeur ${value} ne peut pas être convertie en entier.`);
        }
        return n;
    }

    /**
     * fabrique un MyMath à partir d'une expression
     * @param {string|number|Array|MyMath|MyMathArray} expression 
     * @returns {MyMath|MyMathArray}
     */
    static make(expression) {
        if ((expression instanceof MyMath) || (expression instanceof MyMathArray)) {
            return expression
        }
        if (Array.isArray(expression)) {
            return new MyMathArray(expression.map(expr => MyMath.make({ expression: expr })))
        }
        if (expression instanceof Base) {
            return new MyMath(PRIVATE, { mynumber: expression })
        }
        // expression pourrait être un number ou un string
        return new MyMath(PRIVATE, { expression: String(expression) })
    }

    static latex(expression, params = {}) {
        return MyMath.make(substituteParams(expression, params)).latex();
    }
    
    static parseUser(expression) {
        // user ne va pas forcément respecter les * ou ce genre de détails
        // je vais donc préprocesser
        if (/^[+-]?\s*(?:∞|inf|infinity|infty|infini)?$/.test(expression)) {
            expression = expression.startsWith('-') ? "-infinity" : "infinity";
        }
        try {
            return new MyMath(PRIVATE, { mynumber: Parser.build(expression) });
        } catch (e) {
            console.warn("Erreur lors du parsing de l'expression utilisateur :", expression);
            return new MyMath(PRIVATE, { expression: "NaN" });
        }
    }

    static toFloat(expression, params = {}) {
        return MyMath.make(substituteParams(expression, params)).toFloat()
    }

    static toFormat(expression, format, params = {}) {
        return MyMath.make(substituteParams(expression, params)).toFormat(format)
    }

    static variables(expression, params = {}) {
        return MyMath.make(substituteParams(expression, params)).variables;
    }

    static buildFunction(expression, params = {}) {
        return MyMath.make(substituteParams(expression, params)).buildFunction();
    }

    static solveInC(exprLeft, exprRight, varName) {
        try {
            const equation = `${exprLeft} = ${exprRight}`;
            const normalized = MyMath.normalization(equation);
            const solutions = nerdamer.solveEquations(normalized, varName);
            return solutions.toString().split(',');
        } catch (e) {
            console.warn(`Erreur lors de la résolution de l'équation ${exprLeft} = ${exprRight} pour la variable ${varName} :`, e);
            return [];
        }
    }

    static solveInR(exprLeft, exprRight, varName) {
        const solutionsStr = MyMath.solveInC(exprLeft, exprRight, varName);
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
        const left = MyMath.make(substituteParams(leftExpr, params))
        return left.compare(rightExpr, operator, params)
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
            return MyMath.make(substituteParams(expr, params)).toFormat(format);
        });
    }


    // Méthodes d'instance
    constructor(token, options) {
        if (token !== PRIVATE) {
            throw new Error('Utilisez MyMath.make() pour créer une instance')
        }
        if (typeof options.expression !== 'undefined') {
            this.#initFromExpression(options.expression.trim())
            return
        }
        if (typeof options.nerdamer !== 'undefined') {
            this.#nerdamer_processed = options.nerdamer
            if (typeof this.#expression === 'undefined') {
                this.#initFromExpression(MyMath.denormalization(this.#nerdamer_processed.toString()))
            }
        }
        if (typeof options.mynumber !== 'undefined') {
            this.#mynumber = options.mynumber
            if (typeof this.#expression === 'undefined') {
                this.#initFromExpression(this.#mynumber.toString())
            }
        }
    }

    #initFromExpression(expression) {
        if (typeof expression !== 'string') {
            expression = String(expression)
        }
        if (/^[+-]?\s*(?:inf|infini|infinity|∞)$/i.test(expression)) {
            this.#expression = expression[0] === '-' ? "-infinity" : "infinity"
        } else {
            this.#expression = expression
        }
    }

    #getMyNumber() {
        if (this.#mynumber != null) {
            return this.#mynumber
        }
        this.#mynumber = Parser.build(this.#expression)
        return this.#mynumber
    }

    #getNerdamerProcessed() {
        if (this.#nerdamer_processed !== null) {
            return this.#nerdamer_processed
        }
        const normalized = this.#mynumber !== null
            ? this.#mynumber.toStringEn()
            : MyMath.normalization(this.#expression)
        try {
            this.#nerdamer_processed = nerdamer(normalized)
        } catch (e) {
            console.warn(`Erreur lors du traitement avec nerdamer de ${normalized}:`, e)
            this.#nerdamer_processed = nerdamer("NaN")
        }
        return this.#nerdamer_processed
    }

    get expression() {
        return this.#expression;
    }

    get variables() {
        return this.#getNerdamerProcessed().variables();
    }

    toFloat() {
        try {
            const txt = this.#getNerdamerProcessed().evaluate().text('decimals');
            if (txt === 'infinity') {
                return Infinity;
            } else if (txt === '-infinity') {
                return -Infinity;
            }
            return parseFloat(txt);
        } catch (e) {
            console.warn(`Erreur lors de la conversion de ${this.#expression} en nombre décimal :`, e);
            return NaN;
        }
    }

    toString() {
        return MyMath.denormalization(this.#getNerdamerProcessed().toString());
    }

    latex() {
        if (this.isPlusInfinity()) {
            return "+\\infty";
        } else if (this.isMinusInfinity()) {
            return "-\\infty";
        }
        return MyMath.latexDenormalization(this.#getNerdamerProcessed().toTeX());
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
        if (format === 's$') {
            // format personnalisé pour contourner des soucis de nerdamer
            return this.#getMyNumber().simplify().toTex()
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
            return MyMath.denormalization(this.#getNerdamerProcessed().evaluate().text('decimals', n));
        }
        // Si on a une expression comme "4.3 + sqrt(4.5)", nerdamer ne va pas
        // exécuter la fonction. Dans ce cas il me semble plus pertinent d'évaluer
        return MyMath.denormalization(this.#getNerdamerProcessed().evaluate().text('decimals'));
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
        return Parser.build(expr).toTex()
    }

    compare(rightExpr, operator, params = {}) {
        const right = MyMath.make(substituteParams(rightExpr, params))
        if (right instanceof MyMathArray) {
            // c'est un objet MyMathArray
            return right.compare(this, MyMath.reverseOperator(operator));
        }
        if (this.isInfinity()) {
            return this.#compareInfinityCase(right, operator);
        } else if (right.isInfinity()) {
            return right.#compareInfinityCase(this, MyMath.reverseOperator(operator));
        }
        const p1 = this.#getNerdamerProcessed()
        const p2 = right.#getNerdamerProcessed()
        switch (operator) {
            case '==':
                return p1.eq(p2);
            case '!=':
                return !p1.eq(p2);
            case '<':
                return p1.lt(p2);
            case '<=':
                return p1.lte(p2);
            case '>':
                return p1.gt(p2);
            case '>=':
                return p1.gte(p2);
            default:
                throw new Error(`Opérateur de comparaison invalide : ${operator}`);
        }
    }

    #compareInfinityCase(othervalue, operator) {
        switch (operator) {
            case '==':
                return this.#getMyNumber().toString() === othervalue.#getMyNumber().toString();
            case '!=':
                return this.#getMyNumber().toString() !== othervalue.#getMyNumber().toString();
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
        return this.isPlusInfinity() || this.isMinusInfinity()
    }

    isPlusInfinity() {
        return this.#expression === 'infinity'
    }

    isMinusInfinity() {
        return this.#expression === '-infinity'
    }

    expand() {
        return new MyMath(PRIVATE, { nerdamer: this.#getNerdamerProcessed().expand() })
    }

    sub(varName, value) {
        return new MyMath(PRIVATE, { nerdamer: this.#getNerdamerProcessed().sub(varName, value) })
    }

    buildFunction() {
        return this.#getNerdamerProcessed().buildFunction();
    }
}

export default MyMath;
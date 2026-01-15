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
import { simplify, decimalize } from './number/simplify'

// Constante privée
// sert à empêcher l'accès direct au constructeur
const PRIVATE = Symbol('private');

class MyMath {
    /** @type{string} expression d'origine */
    #expression

    /** @type{nerdamer.Expression|null} */
    #nerdamer_processed = null

    /** @type{Base|null} */
    #mynumber = null

    /**
     * alias de toFloat
     * @param {*} value 
     * @returns 
     */
    static toNumber(value) {
        return MyMath.toFloat(value)
    }

    static toInteger(value) {
        const f = MyMath.toFloat(value);
        if (isNaN(f)) {
            throw new Error(`La valeur ${value} ne peut pas être convertie en entier.`);
        }
        const n = Math.trunc(f);
        if (f !== n) {
            throw new Error(`La valeur ${value} ne peut pas être convertie en entier.`);
        }
        return n;
    }

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
     * @param {string|number|MyMath} expression 
     * @returns {MyMath}
     */
    static make(expression) {
        if (expression instanceof MyMath) {
            return expression
        }
        if (expression instanceof Base) {
            return new MyMath(PRIVATE, { mynumber: expression })
        }
        // expression pourrait être un number ou un string
        return new MyMath(PRIVATE, { expression: String(expression) })
    }

    static latex(expression) {
        return MyMath.make(expression).latex();
    }
    
    static parseUser(expression) {
        // user ne va pas forcément respecter les * ou ce genre de détails
        // je vais donc préprocesser
        try {
            return new MyMath(PRIVATE, { mynumber: Parser.build(expression) });
        } catch (e) {
            console.warn("Erreur lors du parsing de l'expression utilisateur :", expression);
            return new MyMath(PRIVATE, { expression: "NaN" });
        }
    }

    static toFloat(expression) {
        return MyMath.make(expression).toFloat()
    }

    static toFormat(expression, format) {
        if (typeof expression === 'string' && expression.startsWith('"') && expression.endsWith('"')) {
            // chaîne de caractères
            // renvoyée sans tenir compte du format
            return expression.slice(1, -1);
        }
        return MyMath.make(expression).toFormat(format)
    }

    static variables(expression) {
        return MyMath.make(expression).variables;
    }

    static buildFunction(expression) {
        return MyMath.make(expression).buildFunction();
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
     * @returns {boolean} le résultat de la comparaison
     */
    static compare(leftExpr, rightExpr, operator) {
        return MyMath.make(leftExpr).compare(rightExpr, operator)
    }

    static normalization(expression) {
        if (typeof expression !== 'string') {
            expression = String(expression);
        }
        return expression
            .replace(/,/g, '.')            // virgules → points décimaux
            .replace(/∞|inf(?!\w)|infini(?!\w)/g, 'infinity') // ∞ → infinity
            .replace(/\blog\(/g, 'log10(') // log( → log10(
            .replace(/\bln\(/g, 'log(')    // ln( → log(
            .replace(/%/g, '/100');        // % → /100
    }

    static denormalization(expression) {
        if (typeof expression !== 'string') {
            expression = String(expression);
        }
        return expression
            .replace(/infinity/gi, '∞')            // points décimaux → virgules
            .replace(/\./g, ',')            // points décimaux → virgules
            .replace(/\blog\(/g, 'ln(')     // log( → ln(
            .replace(/\blog10\(/g, 'log('); // log10( → log(
            
    }

    static latexDenormalization(expression) {
        if (typeof expression !== 'string') {
            expression = String(expression);
        }
        expression = expression.replace('infinity', '\\infty')
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
            const replacement = substituteParams(expr, params)
            if (typeof replacement === 'string' && replacement.startsWith('"') && replacement.endsWith('"')) {
                return replacement.slice(1, -1)
            }
            if (Array.isArray(replacement)) {
                if (format === 'b') {
                    return replacement.map(r => String(r)).join(', ')
                }
                return replacement.map(r => MyMath.make(r).toFormat(format)).join(', ')
            }
            if (format === 'b') {
                return String(replacement)
            }
            return MyMath.make(replacement).toFormat(format);
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
        if (expression.includes('diff(') || expression.includes('expand(')) {
            // cas particulier où on a une commande nerdamer
            this.#expression = expression
            const n = this.#getNerdamerProcessed()
            this.#expression = MyMath.denormalization(n.toString())
            return
        }

        this.#expression = expression
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
            this.#nerdamer_processed = nerdamer(normalized).evaluate()
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
            return this.#getMyNumber().toDecimal().toNumber()
        } catch (e) {
            console.warn(`Erreur lors de la conversion de ${this.#expression} en nombre décimal :`, e);
            return NaN;
        }
    }

    /**
     * renvoie la valeur Decimal associée
     * @returns {Decimal}
     */
    toDecimal() {
        return this.#getMyNumber().toDecimal();
    }

    toString() {
        //console.log(this.#getNerdamerProcessed().toString())
        return this.#expression
    }

    toStringSimplified() {
        return simplify(this.#getMyNumber()).toString()
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
            return simplify(this.#getMyNumber()).toTex()
        }
        if (format === 's') {
            // format personnalisé pour contourner des soucis de nerdamer
            return simplify(this.#getMyNumber()).toString()
        }
        if (format === 'f') {
            return this.#toFormatDecimal(-1);
        }
        if (format === 'f$') {
            return this.#toTexDecimal(-1);
        }
        const m = format.match(/^([0-9]*)f(\$)?$/);
        if (m) {
            const n = parseInt(m[1], 10);
            if (m[2]) {
                return this.#toTexDecimal(n);
            }
            return this.#toFormatDecimal(n);
        }
        return MyMath.denormalization(this.#getNerdamerProcessed().toString())
    }

    /**
     * renvoie au format décimal avec n chiffres après la virgule
     * @param {number} n -1 si pas de limite
     * @returns {string}
     */
    #toFormatDecimal(n) {
        // s'il y a des varriables, je passe par nerdamer. Sinon par mynumber
        if (this.variables.length > 0) {
            // La procédure de décimalisation va calculer ce qui peut l'être
            // et on peut fixer au besoin, sinon on garde toute la précision
            return n>=0
                ? decimalize(this.#getMyNumber()).toFixed(n).toString()
                : decimalize(this.#getMyNumber()).toString()
        }
        if (n >= 0) {
            return this.#getMyNumber().toDecimal().toFixed(n).replace('.', ',')
        }
        return this.#getMyNumber().toDecimal().toString().replace('.', ',')
    }


    /** renvoie une représentation décimale
     * @param {number} n nombre de chiffres après la virgule
     * @param {string} dot caractère utilisé pour le séparateur décimal
     * @returns {string}
     */
    toFixed(n, dot = '.') {
        if (dot === '.') {
            return this.#getMyNumber().toDecimal().toFixed(n)
        }
        return this.#getMyNumber().toDecimal().toFixed(n).replace('.', dot)
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

    /**
     * Fait une comparaison numérique sur la base d'une évaluation
     * donc ne vérifie pas symboliquement l'égalité
     * @param {MyMath|string|number} right 
     */
    pseudoEquality(right) {
        const lStr = this.toDecimal().toString()
        const rStr = MyMath.make(right).toDecimal().toString()
        if (lStr === rStr) {
            return true
        }
        // On pourrait admettre un petit écart dû à du bruit de calcul
        if (lStr.length < 40 || rStr.length < 40) {
            return false
        }
        // On veut au moins 40 chiffres identiques
        return (lStr.slice(0, 40) === rStr.slice(0, 40))
    }

    compare(rightExpr, operator) {
        const right = MyMath.make(rightExpr)
        if (Array.isArray(right)) {
            return right.map(r => this.compare(r, operator))
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
        return this.#getNerdamerProcessed().eq('+infinity')
    }

    isMinusInfinity() {
        return this.#getNerdamerProcessed().eq('-infinity')
    }

    expand() {
        return new MyMath(PRIVATE, { nerdamer: this.#getNerdamerProcessed().expand() })
    }

    sub(varName, value) {
        return new MyMath(PRIVATE, { nerdamer: this.#getNerdamerProcessed().sub(varName, value) })
    }

    diff() {
        return new MyMath(PRIVATE, { expression: `diff(${this.#expression})` })
    }

    buildFunction() {
        return this.#getNerdamerProcessed().buildFunction();
    }

    simplify() {
        return MyMath.make(simplify(this.#getMyNumber()))
    }
}

export default MyMath;
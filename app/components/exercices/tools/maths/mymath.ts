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
import Decimal from 'decimal.js'
import { TParams, InputType, NestedArray } from "@types"


type AcceptedInput = InputType | Base
interface MyMathOptions {
    expression?: string,
    nerdamer?: nerdamer.Expression,
    mynumber?: Base
}


class MyMath {
    /** @type{string} expression d'origine */
    private _expression:string

    /** @type{nerdamer.Expression|null} */
    private _nerdamer_processed?:nerdamer.Expression

    /** @type{Base|null} */
    private _mynumber?:Base

    /**
     * alias de toFloat
     * @param {*} value 
     * @returns 
     */
    static toNumber(value:AcceptedInput):number {
        return MyMath.toFloat(value)
    }

    static toInteger(value:AcceptedInput):number {
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

    static reverseOperator(operator:string):string {
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

    static parseFloat(value:AcceptedInput):number {
        if (typeof value === 'number') {
            return value;
        }
        if (value instanceof Base) {
            return value.toDecimal(undefined).toNumber();
        }
        if (value instanceof MyMath) {
            return value.toFloat();
        }
        if (typeof value !== 'string') {
            throw new Error(`La valeur ${value} ne peut pas être convertie en nombre.`);
        }
        value = value.trim()
        if (/^[+-]?\s?inf(?:inity|ty|ini)?$/.test(value)) {
            return value.startsWith('-') ? -Infinity : Infinity;
        }
        return MyMath.toFloat(value);
    }

    static parseInt(value:AcceptedInput):number {
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
    static make(expression:AcceptedInput): MyMath {
        if (expression instanceof MyMath) {
            return expression
        }
        if (expression instanceof Base) {
            return new MyMath({ mynumber: expression })
        }
        if ((typeof expression !== 'string') && (typeof expression !== 'number')) {
            throw new Error('L\'expression doit être une chaîne de caractères, un nombre ou une instance de MyMath')
        }
        // expression pourrait être un number ou un string
        return new MyMath({ expression: String(expression) })
    }

    static latex(expression:AcceptedInput):string {
        return MyMath.make(expression).latex();
    }
    
    static parseUser(expression:string): MyMath {
        // user ne va pas forcément respecter les * ou ce genre de détails
        // je vais donc préprocesser
        try {
            return new MyMath({ mynumber: Parser.build(expression) });
        } catch (e) {
            console.warn("Erreur lors du parsing de l'expression utilisateur :", expression);
            return new MyMath({ expression: "NaN" });
        }
    }

    static toFixedArray(expression:NestedArray<AcceptedInput>, n:number):NestedArray<string> {
        if (Array.isArray(expression)) {
            return expression.map(item => MyMath.toFixedArray(item, n))
        }
        return MyMath.make(expression).toFixed(n)
    }

    static toFloat(expression:AcceptedInput):number {
        if (typeof expression === 'number') {
            return expression;
        }
        return MyMath.make(expression).toFloat()
    }

    static toFormat(expression:AcceptedInput, format:string):string {
        if (typeof expression === 'string' && expression.startsWith('"') && expression.endsWith('"')) {
            // chaîne de caractères
            // renvoyée sans tenir compte du format
            return expression.slice(1, -1);
        }
        return MyMath.make(expression).toFormat(format)
    }

    static variables(expression:AcceptedInput): Array<string> {
        return MyMath.make(expression).variables;
    }

    static buildFunction(expression:AcceptedInput): Function {
        return MyMath.make(expression).buildFunction();
    }

    static solveInC(exprLeft:string, exprRight:string, varName:string):Array<string> {
        try {
            const equation:string = `${exprLeft} = ${exprRight}`;
            const normalized:string = MyMath.normalization(equation);
            // nerdamer ne semble pas déclarer correctement solveEquations en ts
            const solutions = (nerdamer as any).solveEquations(normalized, varName);
            return solutions.toString().split(',');
        } catch (e) {
            console.warn(`Erreur lors de la résolution de l'équation ${exprLeft} = ${exprRight} pour la variable ${varName} :`, e);
            return [];
        }
    }

    static solveInR(exprLeft:string, exprRight:string, varName:string):Array<string> {
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
    static compare(
        leftExpr:NestedArray<AcceptedInput>,
        rightExpr:NestedArray<AcceptedInput>,
        operator:string
    ):NestedArray<boolean>{
        if (Array.isArray(leftExpr)) {
            if (Array.isArray(rightExpr)) {
                if (leftExpr.length !== rightExpr.length) {
                    throw new Error('Les deux tableaux doivent avoir la même longueur pour une comparaison élément par élément.');
                }
                return leftExpr.map((le, i) => MyMath.compare(le, rightExpr[i], operator) as boolean);
            } else {
                return MyMath.make(rightExpr).compare(leftExpr, MyMath.reverseOperator(operator))
            }
        }
        return MyMath.make(leftExpr).compare(rightExpr, operator)
    }

    static normalization(expression:string):string {
        if (typeof expression !== 'string') {
            throw new Error('L\'expression doit être une chaîne de caractères')
        }
        return expression
            .replace(/,/g, '.')            // virgules → points décimaux
            .replace(/∞|inf(?!\w)|infini(?!\w)/g, 'infinity') // ∞ → infinity
            .replace(/\blog\(/g, 'log10(') // log( → log10(
            .replace(/\bln\(/g, 'log(')    // ln( → log(
            .replace(/%/g, '/100');        // % → /100
    }

    static denormalization(expression:string):string {
        if (typeof expression !== 'string') {
            throw new Error('L\'expression doit être une chaîne de caractères');
        }
        return expression
            .replace(/infinity/gi, '∞')            // points décimaux → virgules
            .replace(/\./g, ',')            // points décimaux → virgules
            .replace(/\blog\(/g, 'ln(')     // log( → ln(
            .replace(/\blog10\(/g, 'log('); // log10( → log(
            
    }

    static latexDenormalization(expression:string):string {
        if (typeof expression !== 'string') {
            throw new Error('L\'expression doit être une chaîne de caractères');
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
    static substituteExpressions(texte:string, params:TParams):string {
        return texte.replace(/\{([^:{}]+):\s*([\w]*(?:\$)?)?\}/g, (match, expr, format) => {
            const replacement = substituteParams(expr, params)
            if (typeof replacement === 'string' && replacement.startsWith('"') && replacement.endsWith('"')) {
                return replacement.slice(1, -1)
            }
            return MyMath._substituteExpressionsHelper(replacement, format, 0)
        });
    }

    private static _substituteExpressionsHelper(
        replacement:NestedArray<InputType>,
        format:string,
        depth:number
    ):string {
        if (Array.isArray(replacement)) {
            const res = replacement.map(r => MyMath._substituteExpressionsHelper(r, format, depth+1)).join(', ')
            if (depth>0) {
                return `[${res}]`
            }
            return res
        }
        if (format === 'b') {
            return String(replacement)
        }
        return MyMath.make(replacement).toFormat(format)
    }

    // Méthodes d'instance
    private constructor(options: MyMathOptions = {}) {
        if (typeof options.expression !== 'undefined') {
            this._initFromExpression(options.expression.trim())
        } else if (typeof options.nerdamer !== 'undefined') {
            this._nerdamer_processed = options.nerdamer
            this._expression = MyMath.denormalization(this._nerdamer_processed.toString())
        } else if (typeof options.mynumber !== 'undefined') {
            this._mynumber = options.mynumber
            this._expression = this._mynumber.toString()
        } else {
            throw new Error('MyMath doit être initialisé avec une expression, un nerdamer.Expression ou un Base')
        }
    }

    private _initFromExpression(expression:string) {
        if (typeof expression !== 'string') {
            throw new Error('L\'expression doit être une chaîne de caractères');
        }
        if (expression.includes('diff(') || expression.includes('expand(')) {
            // cas particulier où on a une commande nerdamer
            this._expression = expression
            const n = this._getNerdamerProcessed()
            this._expression = MyMath.denormalization(n.toString())
            return
        }
        this._expression = expression
    }

    private _getMyNumber(): Base {
        if (typeof this._mynumber === "undefined") {
            this._mynumber = Parser.build(this._expression)
        }
        return this._mynumber
    }

    private _getNerdamerProcessed() {
        if (typeof this._nerdamer_processed !== "undefined") {
            return this._nerdamer_processed
        }
        const normalized = typeof this._mynumber !== "undefined"
            ? this._mynumber.toStringEn()
            : MyMath.normalization(this._expression)
        try {
            this._nerdamer_processed = nerdamer(normalized).evaluate()
        } catch (e) {
            console.warn(`Erreur lors du traitement avec nerdamer de ${normalized}:`, e)
            this._nerdamer_processed = nerdamer("NaN")
        }
        return this._nerdamer_processed
    }

    get expression():string {
        return this._expression;
    }

    get variables():Array<string> {
        return this._getNerdamerProcessed().variables();
    }

    toFloat():number {
        try {
            return this._getMyNumber().toDecimal(undefined).toNumber()
        } catch (e) {
            console.warn(`Erreur lors de la conversion de ${this._expression} en nombre décimal :`, e);
            return NaN;
        }
    }

    /**
     * renvoie la valeur Decimal associée
     * @returns {Decimal}
     */
    toDecimal():Decimal {
        return this._getMyNumber().toDecimal(undefined);
    }

    toString():string {
        //console.log(this._getNerdamerProcessed().toString())
        return this._expression
    }

    toStringSimplified():string {
        return simplify(this._getMyNumber()).toString()
    }

    latex():string {
        if (this.isPlusInfinity()) {
            return "+\\infty";
        } else if (this.isMinusInfinity()) {
            return "-\\infty";
        }
        return MyMath.latexDenormalization(this._getNerdamerProcessed().toTeX());
    }

    /**
     * Renvoie la valeur au en texte au format spécifié
     * Le format peut être '$' pour LaTeX, 'f' pour décimal avec virgule,
     * ou 'Nf' pour décimal avec N chiffres après la virgule.
     * @param {*} value chaîne ou objet
     * @param {string} format précise le format
     * @returns {string} la valeur formatée
     */
    toFormat(format:string):string {
        format = (format || '').trim();
        if (format === '$') {
            return this.latex();
        }
        if (format === 's$') {
            // format personnalisé pour contourner des soucis de nerdamer
            return simplify(this._getMyNumber()).toTex()
        }
        if (format === 's') {
            // format personnalisé pour contourner des soucis de nerdamer
            return simplify(this._getMyNumber()).toString()
        }
        if (format === 'f') {
            return this._toFormatDecimal(-1);
        }
        if (format === 'f$') {
            return this._toTexDecimal(-1);
        }
        const m = format.match(/^([0-9]*)f(\$)?$/);
        if (m) {
            const n = parseInt(m[1], 10);
            if (m[2]) {
                return this._toTexDecimal(n);
            }
            return this._toFormatDecimal(n);
        }
        return MyMath.denormalization(this._getNerdamerProcessed().toString())
    }

    /**
     * renvoie au format décimal avec n chiffres après la virgule
     * @param {number} n -1 si pas de limite
     * @returns {string}
     */
    private _toFormatDecimal(n:number):string {
        // s'il y a des varriables, je passe par nerdamer. Sinon par mynumber
        if (this.variables.length > 0) {
            // La procédure de décimalisation va calculer ce qui peut l'être
            // et on peut fixer au besoin, sinon on garde toute la précision
            return n>=0
                ? decimalize(this._getMyNumber()).toFixed(n).toString()
                : decimalize(this._getMyNumber()).toString()
        }
        if (n >= 0) {
            return this._getMyNumber().toDecimal(undefined).toFixed(n).replace('.', ',')
        }
        return this._getMyNumber().toDecimal(undefined).toString().replace('.', ',')
    }


    /** renvoie une représentation décimale
     * @param {number} n nombre de chiffres après la virgule
     * @param {string} dot caractère utilisé pour le séparateur décimal
     * @returns {string}
     */
    toFixed(n:number, dot:string = '.'):string {
        if (dot === '.') {
            return this._getMyNumber().toDecimal(undefined).toFixed(n)
        }
        return this._getMyNumber().toDecimal(undefined).toFixed(n).replace('.', dot)
    }

    /**
     * renvoie au format décimal pour TeX
     * @param {number} n -1 si pas de limite
     * @returns {string}
     */
    private _toTexDecimal(n:number):string {
        const expr = this._toFormatDecimal(n);
        // ensuite on veut générer du TeX
        // J'utilise mon parser
        return Parser.build(expr).toTex()
    }

    /**
     * Fait une comparaison numérique sur la base d'une évaluation
     * donc ne vérifie pas symboliquement l'égalité
     * @param {MyMath|string|number} right 
     */
    pseudoEquality(right:AcceptedInput):boolean {
        const lStr = this.toDecimal()
        const rStr = MyMath.make(right).toDecimal()
        // on admet un bruit de calcul très faible
        return lStr.minus(rStr).abs().lt('1e-30')
    }

    compare(rightExpr:NestedArray<AcceptedInput>, operator:string):NestedArray<boolean> {
        if (Array.isArray(rightExpr)) {
            return rightExpr.map(r => this.compare(r, operator) as boolean)
        }
        const right = MyMath.make(rightExpr)
        if (this.isInfinity()) {
            return this._compareInfinityCase(right, operator);
        } else if (right.isInfinity()) {
            return right._compareInfinityCase(this, MyMath.reverseOperator(operator));
        }
        const p1 = this._getNerdamerProcessed()
        const p2 = right._getNerdamerProcessed()
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

    private _compareInfinityCase(othervalue:MyMath, operator:string):boolean {
        switch (operator) {
            case '==':
                return this._getMyNumber().toString() === othervalue._getMyNumber().toString();
            case '!=':
                return this._getMyNumber().toString() !== othervalue._getMyNumber().toString();
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

    isInfinity():boolean {
        return this.isPlusInfinity() || this.isMinusInfinity()
    }

    isPlusInfinity():boolean {
        return this._getNerdamerProcessed().eq('+infinity')
    }

    isMinusInfinity():boolean {
        return this._getNerdamerProcessed().eq('-infinity')
    }

    expand():MyMath {
        return new MyMath({ nerdamer: this._getNerdamerProcessed().expand() })
    }

    sub(varName:string, value:AcceptedInput):MyMath {
        const valueStr = MyMath.normalization(MyMath.make(value).toString());
        return new MyMath({ nerdamer: this._getNerdamerProcessed().sub(varName, valueStr) })
    }

    diff():MyMath {
        return new MyMath({ expression: `diff(${this._expression})` })
    }

    buildFunction():Function {
        return this._getNerdamerProcessed().buildFunction();
    }

    simplify():MyMath {
        return MyMath.make(simplify(this._getMyNumber()))
    }
}

export default MyMath;
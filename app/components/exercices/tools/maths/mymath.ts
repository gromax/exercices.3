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
import { TParams, InputType, NestedArray, NestedInput } from "@types"

interface MyMathOptions {
    expression?: string,
    nerdamer?: nerdamer.Expression,
    mynumber?: Base,
    invalid?:boolean
}

type TValue = "expression" | "brutText" | "ensemble" | "invalid"
const PREFIX_ENSEMBLE = '//inter//'

function _isBrutText(expression: string): boolean {
    return expression.startsWith('"') && expression.endsWith('"')
}

function _isEnsemble(expression: string): boolean {
    return expression.startsWith(PREFIX_ENSEMBLE)
}



class MyMath {
    /** @type{string} expression d'origine */
    private _expression:string

    /** @type{nerdamer.Expression|null} */
    private _nerdamer_processed?:nerdamer.Expression

    /** @type{Base|null} */
    private _mynumber?:Base

    /** @type{TValue} */
    private _type:TValue = "expression" // type par défaut

    /**
     * alias de toFloat
     * @param {*} value 
     * @returns 
     */
    static toNumber(value:InputType):number {
        return MyMath.toFloat(value)
    }

    /**
     * Convertit la valeur en nombre entier
     * @param {InputType} value La valeur à convertir en nombre entier
     * @returns {number} Le nombre entier correspondant à la valeur fournie
     */
    static toInteger(value:InputType):number {
        const f = MyMath.toFloat(value)
        if (isNaN(f)) {
            throw new Error(`La valeur ${value} ne peut pas être convertie en entier.`)
        }
        const n = Math.trunc(f)
        if (f !== n) {
            throw new Error(`La valeur ${value} ne peut pas être convertie en entier.`)
        }
        return n
    }

    /**
     * Essaie de convertir la valeur en entier.
     * @param {InputType} value valeur à convertir en entier
     * @returns {false|number} l'entier correspondant ou false si la conversion échoue
     */
    static tryInteger(value:InputType):false|number {
        try {
            return MyMath.toInteger(value)
        } catch (e) {
            return false
        }
    }

    /**
     * Inverse un opérateur de comparaison.
     * @param {string} operator L'opérateur à inverser
     * @returns {string} L'opérateur inversé
     */
    static reverseOperator(operator:string):string {
        switch (operator) {
            case '<':
                return '>'
            case '<=':
                return '>='
            case '>':
                return '<'
            case '>=':
                return '<='
            case '==':
                return '=='
            case '!=':
                return '!='
            default:
                throw new Error(`Opérateur inconnu : ${operator}`)
        }
    }

    /**
     * Analyse une valeur et la convertit en nombre à virgule flottante.
     * @param {InputType} value La valeur à analyser
     * @returns {number} Le nombre à virgule flottante correspondant à la valeur fournie
     */
    static parseFloat(value:InputType):number {
        if (typeof value === 'number') {
            return value
        }
        if (value instanceof MyMath) {
            return value.toFloat()
        }
        if (typeof value !== 'string') {
            throw new Error(`La valeur ${value} ne peut pas être convertie en nombre.`)
        }
        value = value.trim()
        if (/^[+-]?\s?inf(?:inity|ty|ini)?$/.test(value)) {
            return value.startsWith('-') ? -Infinity : Infinity
        }
        return MyMath.toFloat(value)
    }

    /**
     * Analyse une valeur et la convertit en nombre entier.
     * @param {InputType} value La valeur à analyser
     * @returns {number} Le nombre entier correspondant à la valeur fournie
     */
    static parseInt(value:InputType):number {
        const f = MyMath.parseFloat(value)
        const n = Math.trunc(f)
        if (f !== n) {
            throw new Error(`La valeur ${value} ne peut pas être convertie en entier.`)
        }
        return n
    }

    /**
     * fabrique un MyMath à partir d'une expression
     * @param {InputType} expression 
     * @returns {MyMath}
     */
    static make(expression:InputType): MyMath {
        if (expression instanceof MyMath) {
            return expression
        }
        if ((typeof expression !== 'string') && (typeof expression !== 'number')) {
            throw new Error('L\'expression doit être une chaîne de caractères, un nombre ou une instance de MyMath')
        }
        // expression pourrait être un number ou un string
        return new MyMath({ expression: String(expression) })
    }

    /**
     * Renvoie l'écriture latex d'une expression
     * @param {InputType} expression L'expression à convertir en MyMath
     * @returns {string} L'écriture latex de l'expression fournie
     */
    static latex(expression:InputType):string {
        return MyMath.make(expression).latex()
    }
    
    /**
     * Analyse une expression fournie par l'utilisateur et la convertit en instance de MyMath.
     * @param {string} expression L'expression utilisateur à analyser
     * @returns {MyMath} L'instance de MyMath correspondant à l'expression fournie
     */
    static parseUser(expression:string): MyMath {
        // user ne va pas forcément respecter les * ou ce genre de détails
        // je vais donc préprocesser
        try {
            return new MyMath({ mynumber: Parser.build(expression) })
        } catch (e) {
            console.warn("Erreur lors du parsing de l'expression utilisateur :", expression)
            console.warn(e.message)
            return new MyMath({ expression: "NaN", invalid:true })
        }
    }

    /**
     * Convertit une expression ou un tableau d'expression en
     * un expression (ou tableau) où les parties numériques sont fixées
     * @param {NestedInput} expression L'expression à convertir
     * @param {number} n Le nombre de décimales
     * @returns {NestedArray<string>} Le tableau de chaînes de caractères avec le nombre fixe de décimales
     */
    static toFixedArray(expression:NestedInput, n:number):NestedArray<string> {
        if (Array.isArray(expression)) {
            return expression.map(item => MyMath.toFixedArray(item, n))
        }
        return MyMath.make(expression).toFixed(n)
    }

    /**
     * Convertit une expression en nombre à virgule flottante.
     * @param {InputType} expression L'expression à convertir
     * @returns {number} Le nombre à virgule flottante correspondant à l'expression fournie
     */
    static toFloat(expression:InputType):number {
        if (typeof expression === 'number') {
            return expression
        }
        return MyMath.make(expression).toFloat()
    }

    /**
     * Convertit une expression en instance de Decimal.
     * @param {InputType} expression L'expression à convertir
     * @returns {Decimal} L'instance de Decimal correspondant à l'expression fournie
     */
    static toDecimal(expression:InputType):Decimal {
        return MyMath.make(expression).toDecimal()
    }

    /**
     * Convertit une expression en une chaîne de caractères formatée selon le format spécifié.
     * @param {InputType} expression L'expression à convertir
     * @param {string} format Le format à appliquer
     * @returns {string} La chaîne de caractères formatée
     */
    static toFormat(expression:InputType, format:string):string {
        if (typeof expression === 'string' && expression.startsWith('"') && expression.endsWith('"')) {
            // chaîne de caractères
            // renvoyée sans tenir compte du format
            return expression.slice(1, -1)
        }
        return MyMath.make(expression).toFormat(format)
    }

    /**
     * Récupère toutes les variables présentes dans une expression.
     * @param {InputType} expression L'expression à analyser
     * @returns {Array<string>} Un tableau contenant les noms des variables
     */
    static variables(expression:InputType): Array<string> {
        return MyMath.make(expression).variables
    }

    /**
     * Construit une fonction JavaScript à partir d'une expression mathématique.
     * @param {InputType} expression L'expression à convertir en fonction
     * @returns {Function} La fonction JavaScript correspondante
     */
    static buildFunction(expression:InputType): Function {
        return MyMath.make(expression).buildFunction()
    }

    /**
     * Résout une équation dans l'ensemble des nombres complexes (C) pour une variable donnée.
     * @param {string} exprLeft L'expression du côté gauche de l'équation
     * @param {string} exprRight L'expression du côté droit de l'équation
     * @param {string} varName Le nom de la variable à résoudre
     * @returns {Array<string>} Un tableau de solutions sous forme de chaînes de caractères
     */
    static solveInC(exprLeft:string, exprRight:string, varName:string):Array<string> {
        try {
            const equation:string = `${exprLeft} = ${exprRight}`
            const normalized:string = MyMath.normalization(equation)
            // nerdamer ne semble pas déclarer correctement solveEquations en ts
            const solutions = (nerdamer as any).solveEquations(normalized, varName)
            return solutions.toString().split(',')
        } catch (e) {
            console.warn(`Erreur lors de la résolution de l'équation ${exprLeft} = ${exprRight} pour la variable ${varName} :`, e)
            console.warn(e.message)
            return []
        }
    }

    /**
     * Résout une équation dans l'ensemble des nombres réels (R) pour une variable donnée.
     * @param {string} exprLeft L'expression du côté gauche de l'équation
     * @param {string} exprRight L'expression du côté droit de l'équation
     * @param {string} varName Le nom de la variable à résoudre
     * @returns {Array<string>} Un tableau de solutions sous forme de chaînes de caractères
     */
    static solveInR(exprLeft:string, exprRight:string, varName:string):Array<string> {
        const solutionsStr = MyMath.solveInC(exprLeft, exprRight, varName)
        // je filtre les solutions complexes
        return solutionsStr.filter(sol => !sol.includes('i'))
    }

    /**
     * Effectue une comparaison entre deux expressions selon l'opérateur donné
     * @param {NestedInput} leftExpr doit pouvoir être converti
     * @param {NestedInput} rightExpr idem
     * @param {string} operator parmi ==, !=, <, <=, >, >=
     * @returns {boolean} le résultat de la comparaison
     */
    static compare(
        leftExpr:NestedInput,
        rightExpr:NestedInput,
        operator:string
    ):NestedArray<boolean>{
        if (Array.isArray(leftExpr)) {
            if (Array.isArray(rightExpr)) {
                if (leftExpr.length !== rightExpr.length) {
                    throw new Error('Les deux tableaux doivent avoir la même longueur pour une comparaison élément par élément.')
                }
                return leftExpr.map((le, i) => MyMath.compare(le, rightExpr[i], operator) as boolean)
            } else {
                return MyMath.make(rightExpr).compare(leftExpr, MyMath.reverseOperator(operator))
            }
        }
        return MyMath.make(leftExpr).compare(rightExpr, operator)
    }

    /**
     * Normalise une expression mathématique en remplaçant certains caractères et fonctions par leur équivalent standard
     * autrement dit du français vers l'anglais standardisé
     * @param {string} expression expression à normaliser
     * @returns {string} expression normalisée
     */
    static normalization(expression:string):string {
        if (typeof expression !== 'string') {
            throw new Error('L\'expression doit être une chaîne de caractères')
        }
        return expression
            .replace(/,/g, '.')            // virgules → points décimaux
            .replace(/;/g, ',')            // points virgules → virgules
            .replace(/∞|inf(?!\w)|infini(?!\w)/g, 'infinity') // ∞ → infinity
            .replace(/\blog\(/g, 'log10(') // log( → log10(
            .replace(/\bln\(/g, 'log(')    // ln( → log(
            .replace(/%/g, '/100')        // % → /100
    }

    /**
     * Convertit l'expression de sa version normalisée (anglaise) à la version dénormalisée (française)
     * @param {string} expression expression normalisée
     * @returns {string} expression dénormalisée
     */
    static denormalization(expression:string):string {
        if (typeof expression !== 'string') {
            throw new Error('L\'expression doit être une chaîne de caractères')
        }
        return expression
            .replace(/infinity/gi, '∞')            // points décimaux → virgules
            .replace(/,/g, ';')            // virgules → points virgules
            .replace(/\./g, ',')            // points décimaux → virgules
            .replace(/\blog\(/g, 'ln(')     // log( → ln(
            .replace(/\blog10\(/g, 'log(') // log10( → log(
            
    }

    /**
     * Convertit l'expression normalisée en expression LaTeX
     * @param {string} expression expression normalisée
     * @returns {string} expression LaTeX
     */
    static latexDenormalization(expression:string):string {
        if (typeof expression !== 'string') {
            throw new Error('L\'expression doit être une chaîne de caractères')
        }
        expression = expression.replace('infinity', '\\infty')
        if (expression === '\\infty') {
            return '+\\infty'
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
        })
    }

    /**
     * Aide récursive pour la substitution des expressions
     * @param {NestedArray<InputType>} replacement valeur à substituer
     * @param {string} format format de sortie
     * @param {number} depth profondeur de récursion
     * @returns {string} chaîne formatée
     */
    private static _substituteExpressionsHelper(
        replacement:NestedInput,
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
            const brutReplacement = String(replacement)
            if (brutReplacement.startsWith('"') && brutReplacement.endsWith('"')) {
                return brutReplacement.slice(1, -1)
            }
            return brutReplacement
        }
        return MyMath.make(replacement).toFormat(format)
    }

    /**
     * Constructeur de la classe MyMath
     * @param {MyMathOptions} options options d'initialisation
     */
    private constructor(options: MyMathOptions = {}) {
        if (typeof options.expression !== 'undefined') {
            this._initFromExpression(options.expression.trim())
        } else if (typeof options.nerdamer !== 'undefined') {
            this._nerdamer_processed = options.nerdamer
            this._expression = MyMath.denormalization(this._nerdamer_processed.toString())
            this._type = "expression"
        } else if (typeof options.mynumber !== 'undefined') {
            this._mynumber = options.mynumber
            this._expression = this._mynumber.toString()
            this._type = "expression"
        } else {
            this._type = "invalid"
            throw new Error('MyMath doit être initialisé avec une expression, un nerdamer.Expression ou un Base')
        }
        if (typeof options.invalid !== 'undefined' && options.invalid === true) {
            this._type = "invalid"
        }
    }

    /**
     * Initialise l'objet MyMath à partir d'une expression sous forme de chaîne
     * @param {string} expression expression mathématique sous forme de chaîne
     */
    private _initFromExpression(expression:string) {
        if (_isBrutText(expression)) {
            this._type = "brutText"
            this._expression = expression
            return
        }
        if (_isEnsemble(expression)) {
            this._type = "ensemble"
            this._expression = expression
            return
        }
        if (expression.includes('expand(')) {
            // cas particulier où on a une commande nerdamer
            this._expression = expression
            const n = this._getNerdamerProcessed()
            this._expression = MyMath.denormalization(n.toString())
            return
        }
        this._expression = expression
    }

    /**
     * Renvoie l'objet Base correspondant à l'expression
     * @returns {Base} objet Base
     */
    private _getMyNumber(): Base {
        if (this._type !== "expression") {
            throw new Error(`<${this._expression}> : L'objet MyMath n'est pas de type expression.`)
        }
        if (typeof this._mynumber === "undefined") {
            try {
                this._mynumber = Parser.build(this._expression)
            } catch(e) {
                console.warn("Erreur lors du parsing de l'expression :", this._expression)
                console.warn(e.message)
                this._type = "invalid"
                return Parser.build("NaN")
            }
        }
        return this._mynumber
    }

    /**
     * Renvoie l'objet nerdamer correspondant à l'expression
     * @returns {nerdamer.Expression} expression nerdamer
     */
    private _getNerdamerProcessed(): nerdamer.Expression {
        if (this._type !== "expression") {
            throw new Error(`<${this._expression}> : L'objet MyMath n'est pas de type expression.`)
        }
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
            this._type = "invalid"
            this._nerdamer_processed = nerdamer("NaN")
        }
        this._type = "expression"
        return this._nerdamer_processed
    }

    /**
     * Renvoie l'expression sous forme de chaîne
     * @returns {string} expression sous forme de chaîne
     */
    get expression():string {
        return this._expression
    }

    /**
     * Renvoie la liste des variables présentes dans l'expression
     * @returns {Array<string>} tableau des noms de variables
     */
    get variables():Array<string> {
        // _getMyNumber() vérifie déjà que l'objet est de type expression
        return this._getMyNumber().variables
    }

    /**
     * Convertit l'expression en nombre à virgule flottante
     * @returns {number} valeur en nombre à virgule flottante ou NaN en cas d'erreur
     */
    toFloat():number {
        if (this._type !== "expression") {
            throw new Error(`<${this._expression}> : L'objet MyMath n'est pas de type expression.`)
        }
        try {
            return this._getMyNumber().toDecimal(undefined).toNumber()
        } catch (e) {
            console.warn(`Erreur lors de la conversion de ${this._expression} en nombre décimal :`, e)
            console.warn(e)
            return NaN
        }
    }

    /**
     * Vérifie si l'expression est un texte (entouré de guillemets).
     * @returns {boolean} true si l'expression est un texte, false sinon.
     */
    isText():boolean {
        return this._type === "brutText"
    }

    /**
     * Vérifie si la saisie correspond bien à une expression
     * @returns {boolean} true si la saisie est une expression, false sinon.
     */
    isExpression():boolean {
        return this._type === "expression"
    }

    /**
     * renvoie la valeur Decimal associée
     * @returns {Decimal}
     */
    toDecimal():Decimal {
        // _getMyNumber() vérifie déjà que l'objet est de type expression
        return this._getMyNumber().toDecimal(undefined)
    }

    /**
     * Renvoie la représentation de l'expression sous forme de chaîne
     * @returns {string} expression sous forme de chaîne
     */
    toString():string {
        if (this._type === "brutText") {
            return this._expression.slice(1, -1)
        } else if (this._type === "ensemble") {
            return this._expression.slice(PREFIX_ENSEMBLE.length).trim()
        }
        return this._expression
    }

    /**
     * Renvoie la représentation simplifiée de l'expression sous forme de chaîne
     * @returns {string} expression simplifiée
     */
    toStringSimplified():string {
        if (this._type === "ensemble") {
            throw new Error(`<${this._expression}> : Pas implémenté pour le type ensemble.`)
        } else if (this._type === "expression") {
            const mn = this._getMyNumber()
            if (this.invalid) {
                return this.toString()
            }
            return simplify(mn).toString()
        }
        return this.toString()
    }

    /**
     * Renvoie la représentation LaTeX de l'expression simplifiée
     * @returns {string} LaTeX de l'expression simplifiée
     */
    latex():string {
        if (this._type === "expression") {
            if (this.isPlusInfinity()) {
                return "+\\infty"
            } else if (this.isMinusInfinity()) {
                return "-\\infty"
            }
            // je vais préférer ma version de latex
            return this._getMyNumber().toTex()
        } else if (this._type === "ensemble") {
            throw new Error(`<${this._expression}> : Pas implémenté pour le type ensemble.`)
        }
        return this.toString()
    }

    /**
     * Renvoie la valeur au en texte au format spécifié
     * Le format peut être '$' pour LaTeX, 'f' pour décimal avec virgule,
     * ou 'Nf' pour décimal avec N chiffres après la virgule.
     * @param {string} format précise le format
     * @returns {string} la valeur formatée
     */
    toFormat(format:string):string {
        format = (format || '').trim()
        if (format === '$') {
            return this.latex()
        }
        if (format === 's$') {
            // format personnalisé pour contourner des soucis de nerdamer
            if (this._type === "expression") {
                return simplify(this._getMyNumber()).toTex()
            } else if (this._type === "ensemble") {
                throw new Error(`<${this._expression}> : Pas implémenté pour le type ensemble.`)
            }
            return this.latex()
        }
        if (format === 's') {
            // format personnalisé pour contourner des soucis de nerdamer
            if (this._type === "expression") {
                return simplify(this._getMyNumber()).toString()
            } else if (this._type === "ensemble") {
                throw new Error(`<${this._expression}> : Pas implémenté pour le type ensemble.`)
            }
            return this.toString()
        }
        if (format === 'f') {
            return this._toFormatDecimal(-1)
        }
        if (format === 'f$') {
            return this._toTexDecimal(-1)
        }
        const m = format.match(/^([0-9]*)f(\$)?$/)
        if (m) {
            const n = parseInt(m[1], 10)
            if (m[2]) {
                return this._toTexDecimal(n)
            }
            return this._toFormatDecimal(n)
        }
        return this.toString()
    }

    /**
     * renvoie au format décimal avec n chiffres après la virgule
     * @param {number} n -1 si pas de limite
     * @returns {string}
     */
    private _toFormatDecimal(n:number):string {
        if (this._type === "ensemble") {
            throw new Error(`<${this._expression}> : Pas implémenté pour le type ensemble.`)
        } else if (this._type !== "expression") {
            return this.toString()
        }
        // cas général pour type expression
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
        if (this._type === "ensemble") {
            throw new Error(`<${this._expression}> : Pas implémenté pour le type ensemble.`)
        } else if (this._type !== "expression") {
            return this.toString()
        }
        // cas général pour type expression
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
        if (this._type === "ensemble") {
            throw new Error(`<${this._expression}> : Pas implémenté pour le type ensemble.`)
        } else if (this._type !== "expression") {
            return this.toString()
        }
        // cas général pour type expression

        const expr = this._toFormatDecimal(n)
        // ensuite on veut générer du TeX
        // J'utilise mon parser
        return Parser.build(expr).toTex()
    }

    /**
     * Fait une comparaison numérique sur la base d'une évaluation
     * donc ne vérifie pas symboliquement l'égalité
     * @param {InputType} right 
     */
    pseudoEquality(right:InputType):boolean {
        // déclenchera une erreur sur Decimal() si _type pas expression sur this et right
        const lStr = this.toDecimal()
        const rStr = MyMath.make(right).toDecimal()
        // on admet un bruit de calcul très faible
        return lStr.minus(rStr).abs().lt('1e-30')
    }

    /**
     * Compare l'expression avec une autre valeur en utilisant un opérateur donné
     * @param {NestedInput} rightExpr - l'autre valeur ou tableau de valeurs à comparer
     * @param {string} operator - opérateur de comparaison (==, !=, <, <=, >, >=)
     * @returns {NestedArray<boolean>} résultat de la comparaison
     */
    compare(rightExpr:NestedInput, operator:string):NestedArray<boolean> {
        if (!this.isExpression()) {
            throw new Error(`<${this.expression}> : Comparaison pas implémenté pour le type non expression.`)
        }
        if (Array.isArray(rightExpr)) {
            return rightExpr.map(r => this.compare(r, operator) as boolean)
        }
        const right = MyMath.make(rightExpr)
        if (!right.isExpression()) {
            throw new Error(`<${right.expression}> : Comparaison pas implémenté pour le type non expression.`)
        }
        if (this.isInfinity()) {
            return this._compareInfinityCase(right, operator)
        } else if (right.isInfinity()) {
            return right._compareInfinityCase(this, MyMath.reverseOperator(operator))
        }
        const p1 = this._getNerdamerProcessed()
        const p2 = right._getNerdamerProcessed()
        switch (operator) {
            case '==':
                return p1.eq(p2)
            case '!=':
                return !p1.eq(p2)
            case '<':
                return p1.lt(p2)
            case '<=':
                return p1.lte(p2)
            case '>':
                return p1.gt(p2)
            case '>=':
                return p1.gte(p2)
            default:
                throw new Error(`Opérateur de comparaison invalide : ${operator}`)
        }
    }

    /**
     * Prédicat pour tester une comparaison impliquant l'infini
     * @param {MyMath} othervalue - l'autre valeur à comparer
     * @param {string} operator - opérateur de comparaison (==, !=, <, <=, >, >=)
     * @returns {boolean} vrai si le nombre est invalide, faux sinon
     */
    private _compareInfinityCase(othervalue:MyMath, operator:string):boolean {
        // appelé seulement par compare - test sur type des valeurs inutile
        switch (operator) {
            case '==':
                return this._getMyNumber().toString() === othervalue._getMyNumber().toString()
            case '!=':
                return this._getMyNumber().toString() !== othervalue._getMyNumber().toString()
            case '<':
                return this.isMinusInfinity() && !othervalue.isMinusInfinity()
            case '<=':
                return this.isMinusInfinity()
            case '>':
                return this.isPlusInfinity() && !othervalue.isPlusInfinity()
            case '>=':
                return this.isPlusInfinity()
            default:
                throw new Error(`Opérateur de comparaison invalide : ${operator}`)
        }
    }

    /**
     * Prédicat pour tester si le nombre est infini
     * @returns {boolean} vrai si le nombre est infini, faux sinon
     */
    isInfinity():boolean {
        return this.isPlusInfinity() || this.isMinusInfinity()
    }

    /**
     * Prédicat pour tester si le nombre est plus l'infini
     * @returns {boolean} vrai si le nombre est plus l'infini, faux sinon
     */
    isPlusInfinity():boolean {
        if (!this.isExpression()) {
            return false
        }
        return this._getMyNumber().isPlusInfinity(undefined)
        //return this._getNerdamerProcessed().eq('+infinity')
    }

    /**
     * Prédicat pour tester si le nombre est moins l'infini
     * @returns {boolean} vrai si le nombre est moins l'infini, faux sinon
     */
    isMinusInfinity():boolean {
        if (!this.isExpression()) {
            return false
        }
        return this._getMyNumber().isMinusInfinity(undefined)
    }

    /**
     * Prédicat pour tester si le nombre est développé
     * @returns {boolean} vrai si le nombre est développé, faux sinon
     */
    isExpanded():boolean {
        if (!this.isExpression()) {
            throw new Error(`<${this.expression}> : Vérification de l'expansion pas implémentée pour le type non expression.`)
        }
        return this._getMyNumber().isExpanded()
    }

    /**
     * Prédicat pour tester si le nombre est simplifié
     * @returns {boolean} vrai si le nombre est simplifié, faux sinon
     */
    isSimplified():boolean {
        if (this.isExpression()) {
            return this._getMyNumber().isSimplified()
        } else if (this._type === 'ensemble') {
            throw new Error(`<${this.expression}> : Vérification de la simplification pas implémentée pour le type ensemble.`)
        }
        throw new Error(`<${this.expression}> : Vérification de la simplification impossible pour le type ${this._type}.`)
    }

    expand():MyMath {
        // _gerNerdamerProcessed lèver une erreur si pas du bon _type
        return new MyMath({ nerdamer: this._getNerdamerProcessed().expand() })
    }

    /**
     * Substitue une variable par une valeur
     * @param {string} varName - nom de la variable
     * @param {InputType} value - valeur à substituer
     * @returns {MyMath} nouveau MyMath avec la substitution effectuée
     */
    sub(varName:string, value:InputType):MyMath {
        if (!this.isExpression()) {
            throw new Error(`<${this.expression}> : Substitution pas implémentée pour le type ${this._type}.`)
        }
        const base_value = value instanceof MyMath ? value._getMyNumber() : value
        const newMyNumber = this._getMyNumber().substituteVariable(varName, base_value)
        return new MyMath({ mynumber: newMyNumber })
    }

    /**
     * Substitue plusieurs variables par leurs valeurs
     * @param {Record<string, InputType>} vars - dictionnaire des variables et de leurs valeurs
     * @returns {MyMath} nouveau MyMath avec les substitutions effectuées
     */
    subs(vars:Record<string, InputType>):MyMath {
        if (!this.isExpression()) {
            throw new Error(`<${this.expression}> : Substitutions pas implémentées pour le type ${this._type}.`)
        }
        const base_vars: Record<string, Base> = {}
        let n = this._getMyNumber()
        for (const [varName, value] of Object.entries(vars)) {
            if (!base_vars[varName]) {
                base_vars[varName] = MyMath.make(value)._getMyNumber()
            }
            n = n.substituteVariable(varName, base_vars[varName])
        }
        return new MyMath({ mynumber: n })
    }

    /**
     * Calcule la dérivée par rapport à une variable
     * @param {string} varName - nom de la variable
     * @returns {MyMath} nouveau MyMath représentant la dérivée
     */
    diff(varName:string=""):MyMath {
        // lèvera une erreur avec _getMyNumber() si le _type n'est pas correct
        const b = this._getMyNumber()
        if (varName == "") {
            let v = this.variables
            if (v.length == 0) {
                return MyMath.make(0)
            }
            varName = v[0]
        }
        //const db = derivate(b, varName)
        const db = simplify(b.derivate(varName))
        return new MyMath({mynumber:db})
    }

    /**
     * Construit une fonction JavaScript à partir de l'expression
     * @returns {Function} fonction JavaScript correspondant à l'expression
     */
    buildFunction():Function {
        // lèvera une erreur avec _getNerdamerProcessed() si le _type n'est pas correct
        return this._getNerdamerProcessed().buildFunction()
    }

    /**
     * Simplifie l'expression
     * @returns {MyMath} nouveau MyMath représentant l'expression simplifiée
     */
    simplify():MyMath {
        if (this.isExpression()) {
            return new MyMath({ mynumber: simplify(this._getMyNumber()) })
        } else if (this._type === "ensemble") {
            throw new Error(`<${this.expression}> : Simplification pas implémentée pour le type ${this._type}.`)
        }
        throw new Error(`<${this.expression}> : Simplification pas implémentée pour le type ${this._type}.`)
    }

    /**
     * Prédicat pour tester si le nombre est invalide
     * @returns {boolean} vrai si le nombre est invalide, faux sinon
     */
    get invalid():boolean {
        return this._type === "invalid"
    }
}

export default MyMath
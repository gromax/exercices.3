import MyMath from '../mymath'
import { Decimal } from 'decimal.js'
import { NestedArray, InputType } from '@types'
import { gcd } from '../misc/function'

class Calc {
    static readonly NAME = 'Calc'
    static readonly METHODS = {
        'mult': Calc.mult,
        'divide': Calc.divide,
        'add': Calc.add,
        'sub': Calc.sub,
        'mod': Calc.mod,
        'div': Calc.intDivide,
        'intDivide': Calc.intDivide,
        'pgcd': Calc.pgcd,
        'ppcm': Calc.ppcm,
        'abs': Calc.abs,
        'factorial': Calc.factorial,
        'sign': Calc.sign,
        'substitute': Calc.substitute,
        'solve': Calc.solve,
        'float': Calc.float,
        'round': Calc.round,
        'ceil': Calc.ceil,
        'floor': Calc.floor,
        'expand': Calc.expand,
        'exp':Calc.exp,
        'diff': Calc.diff,
        'derivate': Calc.derivate,
        'max': Calc.max,
        'min': Calc.min,
        'simplify': Calc.simplify,
    }
    static readonly SHORTCUTS:Record<string,string> = {
        'abs': 'Calc.abs',
        '*': 'Calc.mult',
        '+': 'Calc.add',
        '-': 'Calc.sub',
        'mod': 'Calc.mod',
        'div': 'Calc.intDivide',
        'pgcd': 'Calc.pgcd',
        'ppcm': 'Calc.ppcm',
        'factorial': 'Calc.factorial',
        'sign': 'Calc.sign',
        '/': 'Calc.divide',
        'sub': 'Calc.substitute',
        'solve': 'Calc.solve',
        'float': 'Calc.float',
        'round': 'Calc.round',
        'ceil': 'Calc.ceil',
        'floor': 'Calc.floor',
        'expand': 'Calc.expand',
        'exp': 'Calc.exp',
        'diff': 'Calc.diff',
        'derivate': 'Calc.derivate',
        'deriver': 'Calc.derivate',
        'max': 'Calc.max',
        'min': 'Calc.min',
        'simplify': 'Calc.simplify'
    }
    static mult(x: InputType, y: InputType): InputType {
        if ((typeof x === 'number') && (typeof y === 'number')) {
            return x * y
        }
        if ((typeof x === 'string') && (typeof y === 'string')) {
            return `(${x})*(${y})`
        }
        return MyMath.make(`(${String(x)})*(${String(y)})`)
    }

    /**
     * Divise x par y.
     * @param {InputType} x dividende
     * @param {InputType} y diviseur
     * @returns {InputType} quotient de x par y
     */
    static divide(x: InputType, y: InputType): InputType {
        if ((typeof x === 'string') && (typeof y === 'string')) {
            return `(${x})/(${y})`
        }
        return MyMath.make(`(${String(x)})/(${String(y)})`)
    }

    /**
     * Modulo de x par y.
     * @param {InputType} x 
     * @param {InputType} y 
     * @returns {InputType} objet représentant x % y
     */
    static mod(x: InputType, y: InputType): InputType {
        const ix = MyMath.tryInteger(x)
        const iy = MyMath.tryInteger(y)
        if ((ix !== false) && (iy !== false)) {
            return ix % iy
        }
        if ((typeof x === 'string') && (typeof y === 'string')) {
            return `mod(${x}; ${y})`
        }
        return MyMath.make(`mod(${String(x)}; ${String(y)})`)
    }

    /**
     * Division entière de x par y.
     * @param {InputType} x 
     * @param {InputType} y 
     * @returns {InputType} objet représentant x div y
     */
    static intDivide(x: InputType, y: InputType): InputType {
        const ix = MyMath.tryInteger(x)
        const iy = MyMath.tryInteger(y)
        if ((ix !== false) && (iy !== false)) {
            return (ix - ix%iy)/iy
        }
        if ((typeof x === 'string') && (typeof y === 'string')) {
            return `(${x} - mod(${x};${y}))/(${y})`
        }
        return MyMath.make(`(${String(x)} - mod(${String(x)};${String(y)}))/(${String(y)})`)
    }

    /**
     * Plus grand commun diviseur (PGCD) de x et y.
     * @param {InputType} x 
     * @param {InputType} y 
     * @returns {InputType} objet représentant pgcd(x, y)
     */
    static pgcd(x: InputType, y: InputType): InputType {
        const ix = MyMath.tryInteger(x)
        const iy = MyMath.tryInteger(y)
        if ((ix !== false) && (iy !== false)) {
            return gcd(ix, iy)
        }
        if ((typeof x === 'string') && (typeof y === 'string')) {
            return `pgcd(${x}; ${y})`
        }
        return MyMath.make(`pgcd(${String(x)}; ${String(y)})`)
    }

    /**
     * Plus petit commun multiple (PPCM) de x et y.
     * @param {InputType} x 
     * @param {InputType} y 
     * @returns {InputType} objet représentant ppcm(x, y)
     */
    static ppcm(x: InputType, y: InputType): InputType {
        const ix = MyMath.tryInteger(x)
        const iy = MyMath.tryInteger(y)
        if ((ix !== false) && (iy !== false)) {
            const a = Math.abs(ix)
            const b = Math.abs(iy)
            if (a === 0 || b === 0) return 0
            return (a * b) / (Calc.pgcd(a, b) as number)
        }
        if ((typeof x === 'string') && (typeof y === 'string')) {
            return `ppcm(${x}; ${y})`
        }
        return MyMath.make(`ppcm(${String(x)}; ${String(y)})`)
    }

    /**
     * Additionne x et y.
     * @param {InputType} x 
     * @param {InputType} y 
     * @returns {InputType} objet représentant x + y
     */
    static add(x: InputType, y: InputType): InputType {
        if ((typeof x === 'number') && (typeof y === 'number')) {
            return x + y
        }
        if ((typeof x === 'string') && (typeof y === 'string')) {
            return `(${x})+(${y})`
        }
        return MyMath.make(`(${String(x)})+(${String(y)})`)
    }

    /**
     * Soustrait y de x.
     * @param {InputType} x 
     * @param {InputType} y 
     * @returns {InputType} objet représentant x - y
     */
    static sub(x: InputType, y: InputType): InputType {
        if ((typeof x === 'number') && (typeof y === 'number')) {
            return x - y
        }
        if ((typeof x === 'string') && (typeof y === 'string')) {
            return `(${x})-(${y})`
        }
        return MyMath.make(`(${String(x)})-(${String(y)})`)
    }

    /**
     * Valeur absolue de x.
     * @param {InputType} x 
     * @returns {InputType} objet représentant |x|
     */
    static abs(x: InputType): InputType {
        if (typeof x === 'number') {
            return Math.abs(x)
        }
        if (typeof x === 'string') {
            return `abs(${x})`
        }
        return MyMath.make(`abs(${String(x)})`)
    }

    /**
     * Signe de x.
     * @param {InputType} x 
     * @returns {number|string} 1 si x positif, -1 si x négatif, 0 si x nul, ou expression symbolique si x n'est pas un nombre
     */
    static sign(x: InputType): number|string {
        const a = MyMath.toNumber(x);
        if (isNaN(a)) {
            return `sign(${String(x)})`;
        }
        return Math.sign(a);
    }

    /**
     * Factorielle de n
     * @param {InputType} n
     * @returns {InputType} objet représentant n!
     */
    static factorial(n: InputType): string {
        const _n = MyMath.toInteger(n)
        if (isNaN(_n)) {
            throw new Error(`[${String(n)}] Paramètre invalide pour Calc.factorial. Entier requis.`)
        }
        if (_n < 0) {
            throw new Error(`[${String(n)}] Paramètre invalide pour Calc.factorial. Entier positif requis.`)
        }
        let result = Decimal('1')
        for (let i = 2; i <= _n; i++) {
            result = result.mul(i)
        }
        return result.toString()
    }

    /**
     * Exponentielle de x.
     * @param {InputType} x 
     * @returns {InputType} objet représentant e^x
     */
    static exp(x: InputType): InputType {
        if (typeof x === 'number') {
            return Math.exp(x)
        }
        if (typeof x === 'string') {
            return `exp(${x})`
        }
        return MyMath.make(`exp(${String(x)})`)
    }

    /**
     * Arrondit x à n chiffres après la virgule.
     * @param {InputType} x 
     * @param {InputType} n 
     * @returns {string} valeur arrondie ou expression symbolique si x n'est pas un nombre
     */
    static round(x: InputType, n: InputType):string {
        const a = MyMath.toDecimal(x)
        const digits = MyMath.toInteger(n)
        if (a.isNaN()) {
            return 'NaN';
        }
        const multiplier = "1" + "0".repeat(Math.abs(digits))
        return digits > 0
            ? a.mul(multiplier).round().div(multiplier).toString()
            : a.div(multiplier).round().mul(multiplier).toString()
    }

    /**
     * prend la partie entière de x à n chiffres après la virgule.
     * @param {InputType} x 
     * @param {InputType} n 
     * @returns {string} valeur arrondie ou expression symbolique si x n'est pas un nombre
     */
    static floor(x: InputType, n: InputType):string {
        const a = MyMath.toDecimal(x)
        const digits = MyMath.toInteger(n)
        if (a.isNaN()) {
            return "NaN"
        }
        const multiplier = "1" + "0".repeat(Math.abs(digits))
        return digits > 0
            ? a.mul(multiplier).floor().div(multiplier).toString()
            : a.div(multiplier).floor().mul(multiplier).toString()
    }

    /**
     * prend la partie entière + 1 de x à n chiffres après la virgule.
     * @param {InputType} x 
     * @param {InputType} n 
     * @returns {string} valeur arrondie ou expression symbolique si x n'est pas un nombre
     */
    static ceil(x: InputType, n: InputType):string {
        const a = MyMath.toDecimal(x)
        const digits = MyMath.toInteger(n)
        if (a.isNaN()) {
            return "NaN"
        }
        const multiplier = "1" + "0".repeat(Math.abs(digits))
        return digits > 0
            ? a.mul(multiplier).ceil().div(multiplier).toString()
            : a.div(multiplier).ceil().mul(multiplier).toString()
    }

    /**
     * évalue une expression en précisant la variabe
     * @param {string} expr 
     * @param {string} name nom de la variable
     * @param {string|number|array} value 
     */
    static substitute(expr:InputType, name:string, value:NestedArray<InputType>):NestedArray<string> {
        if (Array.isArray(value)) {
            return value.map(v => Calc.substitute(expr, name, v));
        }
        return MyMath.make(expr).sub(name, value).toString();
    }

    /**
     * Développe l'expression.
     * @param {InputType} expr 
     * @returns {string} expression développée
     */
    static expand(expr:InputType):string {
        return MyMath.make(expr).expand().toString();
    }

    /**
     * Résout une équation de la forme exprLeft = exprRight pour la variable varName.
     * @param {string} exprLeft 
     * @param {string} exprRight 
     * @param {string} varName 
     * @returns {array} liste des solutions
     */
    static solve(exprLeft:string, exprRight:string, varName:string):Array<string> {
        return MyMath.solveInR(exprLeft, exprRight, varName);
    }

    /**
     * renvoie une verssion float d'une expression
     * @param {string} expression 
     * @returns 
     */
    static float(expression:NestedArray<InputType>):NestedArray<number> {
        if (Array.isArray(expression)) {
            return expression.map(expr => Calc.float(expr));
        }
        try {
            return MyMath.toFloat(expression);
        } catch (e) {
            console.warn(`Erreur lors de la conversion en float de l'expression ${expression} :`, e);
            return NaN;
        }
    }

    /**
     * dérive l'expression selon la variable spécifiée
     * @param {string|MyMath} expression 
     * @returns 
     */
    static diff(expression:InputType, variable:InputType):string {
        const varName = variable.toString();
        return MyMath.make(expression).diff(varName).toString();
    }


    /**
     * dérive l'expression selon sa variable (devrait être unique)
     * @param {string|MyMath} expression 
     * @returns 
     */
    static derivate(expression:InputType):string {
        return MyMath.make(expression).diff().toString();
    }

    /**
     * renvoie le max entre x et y
     * @param {InputType} x 
     * @param {InputType} y 
     * @returns {InputType} le maximum entre x et y
     */
    static max(x:InputType, y:InputType):InputType {
        if (MyMath.make(x).toFloat() > MyMath.make(y).toFloat()) {
            return x
        } else {
            return y
        }
    }

    /**
     * renvoie le min entre x et y
     * @param {InputType} x 
     * @param {InputType} y 
     * @returns {InputType} le minimum entre x et y
     */
    static min(x:InputType, y:InputType):InputType {
        if (MyMath.make(x).toFloat() < MyMath.make(y).toFloat()) {
            return x
        } else {
            return y
        }
    }

    /**
     * Simplifie l'expression.
     * @param {InputType} x 
     * @returns {number|MyMath} expression simplifiée
     */
    static simplify(x:InputType):number|MyMath {
        if (typeof x === 'number') {
            return x
        }
        return MyMath.make(x).simplify()
    }

}
export default Calc;
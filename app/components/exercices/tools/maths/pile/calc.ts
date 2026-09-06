import MyMath from '../mymath';
import { NestedArray, InputType } from '@types';

class Calc {
    static readonly NAME = 'Calc'
    static readonly METHODS = {
        'mult': Calc.mult,
        'divide': Calc.divide,
        'add': Calc.add,
        'sub': Calc.sub,
        'abs': Calc.abs,
        'sign': Calc.sign,
        'substitute': Calc.substitute,
        'solve': Calc.solve,
        'float': Calc.float,
        'round': Calc.round,
        'expand': Calc.expand,
        'exp':Calc.exp,
        'diff': Calc.diff,
        'max': Calc.max,
        'min': Calc.min,
        'simplify': Calc.simplify
    }
    static readonly SHORTCUTS:Record<string,string> = {
        'abs': 'Calc.abs',
        '*': 'Calc.mult',
        '+': 'Calc.add',
        '-': 'Calc.sub',
        'mod': 'Calc.mod',
        'div': 'Calc.intDivide',
        'sign': 'Calc.sign',
        '/': 'Calc.divide',
        'sub': 'Calc.substitute',
        'solve': 'Calc.solve',
        'float': 'Calc.float',
        'round': 'Calc.round',
        'expand': 'Calc.expand',
        'exp': 'Calc.exp',
        'diff': 'Calc.diff',
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
        if ((typeof x === 'number') && (typeof y === 'number')) {
            return x % y
        }
        if ((typeof x === 'string') && (typeof y === 'string')) {
            return `mod(${x}, ${y})`
        }
        return MyMath.make(`mod(${String(x)}, ${String(y)})`)
    }

    /**
     * Division entière de x par y.
     * @param {InputType} x 
     * @param {InputType} y 
     * @returns {InputType} objet représentant x div y
     */
    static intDivide(x: InputType, y: InputType): InputType {
        if ((typeof x === 'number') && (typeof y === 'number')) {
            return (x-x%y)/y
        }
        if ((typeof x === 'string') && (typeof y === 'string')) {
            return `(${x} - mod(${x},${y}))/(${y})`
        }
        return MyMath.make(`(${String(x)} - mod(${String(x)},${String(y)}))/(${String(y)})`)
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
     * @returns {string|number} valeur arrondie ou expression symbolique si x n'est pas un nombre
     */
    static round(x: InputType, n: InputType):string|number {
        const a = MyMath.toNumber(x)
        const digits = MyMath.toInteger(n)
        if (isNaN(a)) {
            return `round(${String(x)}, ${String(n)})`;
        }
        if (digits < 0) {
            console.warn(`Paramètre invalide pour Calc.round : ${String(n)}`);
            return Math.round(a);
        }
        // Éviter les problèmes de précision floating point
        const multiplier = Math.pow(10, digits);
        return Math.round((a + Number.EPSILON) * multiplier) / multiplier;
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
     * dérive l'expression
     * @param {string|MyMath} expression 
     * @returns 
     */
    static diff(expression:InputType):string {
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
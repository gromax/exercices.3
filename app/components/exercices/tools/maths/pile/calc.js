import MyMath from '../mymath';

class Calc {
    static NAME = 'Calc'
    static METHODS = {
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
    }
    static SHORTCUTS = {
        'abs': 'Calc.abs',
        '*': 'Calc.mult',
        '+': 'Calc.add',
        '-': 'Calc.sub',
        'sign': 'Calc.sign',
        '/': 'Calc.divide',
        'sub': 'Calc.substitute',
        'solve': 'Calc.solve',
        'float': 'Calc.float',
        'round': 'Calc.round',
        'expand': 'Calc.expand',
        'exp': 'Calc.exp',
        'diff': 'Calc.diff',
    }
    static mult(x, y) {
        const a = Number(x);
        const b = Number(y);
        if (isNaN(a) || isNaN(b)) {
            return `${String(x)} * ${String(y)}`;
        }
        return a * b;
    }

    static divide(x, y) {
        return `(${String(x)}) / (${String(y)})`;
    }

    static add(x, y) {
        const a = MyMath.toNumber(x);
        const b = MyMath.toNumber(y);
        if (isNaN(a) || isNaN(b)) {
            return `${String(x)} + ${String(y)}`;
        }
        return a + b;
    }

    static sub(x, y) {
        const a = MyMath.toNumber(x);
        const b = MyMath.toNumber(y);
        if (isNaN(a) || isNaN(b)) {
            return `${String(x)} - ${String(y)}`;
        }
        return a - b;
    }

    static abs(x) {
        const a = MyMath.toNumber(x);
        if (isNaN(a)) {
            return `abs(${String(x)})`;
        }
        return Math.abs(a);
    }

    static sign(x) {
        const a = MyMath.toNumber(x);
        if (isNaN(a)) {
            return `sign(${String(x)})`;
        }
        return Math.sign(a);
    }

    static exp(x) {
        const a = MyMath.toNumber(x);
        if (isNaN(a)) {
            return `exp(${String(x)})`;
        }
        return Math.exp(a);
    }

    static round(x, n) {
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
    static substitute(expr, name, value) {
        if (Array.isArray(value)) {
            return value.map(v => Calc.substitute(expr, name, v));
        }
        return MyMath.make(expr).sub(name, value).toString();
    }

    /** Développe l'expression */
    static expand(expr) {
        return MyMath.make(expr).expand().toString();
    }

    /**
     * fait la résolution d'une équation
     * @param {string} exprLeft 
     * @param {string} exprRight 
     * @param {string} varName 
     * @returns {array} liste des solutions
     */
    static solve(exprLeft, exprRight, varName) {
        return MyMath.solveInR(exprLeft, exprRight, varName);
    }

    /**
     * renvoie une verssion float d'une expression
     * @param {string} expression 
     * @returns 
     */
    static float(expression) {
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
    static diff(expression) {
        return MyMath.make(expression).diff().toString();
    }
}
export default Calc;
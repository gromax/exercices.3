import MyNerd from '../mynerd';

class Calc {
    static NAME = 'Calc';
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
    };
    static SHORTCUTS = {
        'abs': 'Calc.abs',
        '*': 'Calc.mult',
        '+': 'Calc.add',
        '-': 'Calc.sub',
        'sign': 'Calc.sign',
        '/': 'Calc.divide',
        'sub': 'Calc.substitute',
        'solve': 'Calc.solve',
        'float': 'Calc.float'
    }
    static mult(x, y) {
        const a = Number(x);
        const b = Number(y);
        if (isNaN(a) || isNaN(b)) {
            return `${x} * ${y}`;
        }
        return a * b;
    }

    static divide(x, y) {
        return `${x} / ${y}`;
    }

    static add(x, y) {
        const a = Number(x);
        const b = Number(y);
        if (isNaN(a) || isNaN(b)) {
            return `${x} + ${y}`;
        }
        return a + b;
    }

    static sub(x, y) {
        const a = Number(x);
        const b = Number(y);
        if (isNaN(a) || isNaN(b)) {
            return `${x} - ${y}`;
        }
        return a - b;
    }

    static abs(x) {
        const a = Number(x);
        if (isNaN(a)) {
            return `abs(${x})`;
        }
        return Math.abs(a);
    }

    static sign(x) {
        const a = Number(x);
        if (isNaN(a)) {
            return `sign(${x})`;
        }
        return Math.sign(a);
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
        const n = MyNerd.make(expr);
        return MyNerd.denormalization(n.processed.sub(name, value).toString());
    }

    /**
     * fait la résolution d'une équation
     * @param {string} exprLeft 
     * @param {string} exprRight 
     * @param {string} varName 
     * @returns {array} liste des solutions
     */
    static solve(exprLeft, exprRight, varName) {
        return MyNerd.solveInR(exprLeft, exprRight, varName);
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
            return MyNerd.toFloat(expression);
        } catch (e) {
            console.warn(`Erreur lors de la conversion en float de l'expression ${expression} :`, e);
            return NaN;
        }
    }
}
export default Calc;
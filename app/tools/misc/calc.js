class Calc {
    static SHORTCUTS = {
        'abs': 'Calc.abs',
        '*': 'Calc.mult',
        '+': 'Calc.add',
        '-': 'Calc.sub',
        'sign': 'Calc.sign',
        '/': 'Calc.divide'
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
}
export default Calc;
class Calc {
    static mult(x, y) {
        const a = Number(x);
        const b = Number(y);
        if (isNaN(a) || isNaN(b)) {
            return `${a} * ${b}`;
        }
        return a * b;
    }

    static add(x, y) {
        const a = Number(x);
        const b = Number(y);
        if (isNaN(a) || isNaN(b)) {
            return `${a} + ${b}`;
        }
        return a + b;
    }

    static sub(x, y) {
        const a = Number(x);
        const b = Number(y);
        if (isNaN(a) || isNaN(b)) {
            return `${a} - ${b}`;
        }
        return a - b;
    }

    static abs(x) {
        const a = Number(x);
        if (isNaN(a)) {
            return `abs(${a})`;
        }
        return Math.abs(a);
    }

    static sign(x) {
        const a = Number(x);
        if (isNaN(a)) {
            return `sign(${a})`;
        }
        return Math.sign(a);
    }
}
export default Calc;
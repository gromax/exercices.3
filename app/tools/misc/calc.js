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
}
export default Calc;
class Alea {
    static entier(min, max) {
        const a = Number(min);
        const b = Number(max);
        min = Math.min(a, b);
        max = Math.max(a, b);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

export default Alea;
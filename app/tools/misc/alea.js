class Alea {
    static NAME = 'Alea';
    static METHODS = {
        'entier': Alea.entier,
        'signe': Alea.signe
    };
    static entier(min, max) {
        const a = Number(min);
        const b = Number(max);
        min = Math.min(a, b);
        max = Math.max(a, b);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static signe() {
        return Math.random() < 0.5 ? -1 : 1;
    }
}

export default Alea;
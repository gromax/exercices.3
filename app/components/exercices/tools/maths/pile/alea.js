import MyMath from '../mymath'
class Alea {
    static NAME = 'Alea'
    static METHODS = {
        'entier': Alea.entier,
        'signe': Alea.signe,
        'lagrangePolynome': Alea.lagrangePolynome,
        'binomial': Alea.binomial,
        'binomialList': Alea.binomialList,
        'choice': Alea.choice
    };
    static entier(min, max) {
        const a = MyMath.toNumber(min);
        const b = MyMath.toNumber(max);
        min = Math.min(a, b);
        max = Math.max(a, b);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static signe() {
        return Math.random() < 0.5 ? -1 : 1;
    }

    static choice(tab) {
        if (!Array.isArray(tab) || tab.length === 0) {
            throw new Error("Paramètre invalide pour Alea.choice");
        }
        const index = Alea.entier(0, tab.length - 1);
        return tab[index];
    }

    static lagrangePolynome(xmin, ymin, xmax, ymax, n) {
        xmin = MyMath.toNumber(xmin);
        ymin = MyMath.toNumber(ymin);
        xmax = MyMath.toNumber(xmax);
        ymax = MyMath.toNumber(ymax);
        n = MyMath.toNumber(n);
        if (isNaN(xmin) || isNaN(ymin) || isNaN(xmax) || isNaN(ymax) || isNaN(n) || n < 0) {
            throw new Error("Paramètres invalides pour Alea.laplacePolynome");
        }
        const xvalues = [];
        while (xvalues.length < n+1) {
            const x = Math.floor(Math.random()*(xmax-xmin+1))+xmin;
            if (!xvalues.includes(x)) {
                xvalues.push(x);
            }
        }
        const yvalues = [];
        for (let i=0; i<n+1; i++) {
            const y = Math.floor(Math.random()*(ymax-ymin+1))+ymin;
            yvalues.push(y);
        }
        let expression = "0";
        for (let i=0; i<=n; i++) {
            // on exprime un produit de (x - xj), j != i
            const monomes = _.reduce(xvalues, (acc, xj, j) => {
                if (j != i) {
                    return acc + `*(x-(${xj}))`;
                } else {
                    return acc;
                }
            }, '1');
            const poids = yvalues[i] / _.reduce(xvalues, (acc, xj, j) => {
                if (j != i) {
                    return acc * (xvalues[i] - xj);
                } else {
                    return acc;
                }
            }, 1);
            expression += ` + (${poids})*${monomes}`;
        }
        return MyMath.make(expression).expand().toString()
    }
}

export default Alea;
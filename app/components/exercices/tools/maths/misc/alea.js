import nerdamer from 'nerdamer';

class Alea {
    static NAME = 'Alea';
    static METHODS = {
        'entier': Alea.entier,
        'signe': Alea.signe,
        'laplacePolynome': Alea.laplacePolynome
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

    static laplacePolynome(xmin, ymin, xmax, ymax, n) {
        xmin = Number(xmin);
        ymin = Number(ymin);
        xmax = Number(xmax);
        ymax = Number(ymax);
        n = Number(n);
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
        return nerdamer(expression).expand().toString(); 
    }
}

export default Alea;
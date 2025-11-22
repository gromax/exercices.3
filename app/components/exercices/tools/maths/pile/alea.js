import MyNerd from '../mynerd.js';
class Alea {
    static NAME = 'Alea';
    static METHODS = {
        'entier': Alea.entier,
        'signe': Alea.signe,
        'lagrangePolynome': Alea.lagrangePolynome,
        'binomial': Alea.binomial,
        'binomialList': Alea.binomialList,
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

    static lagrangePolynome(xmin, ymin, xmax, ymax, n) {
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
        return MyNerd.make(expression).expand().toString();
    }

    /**
     * simule une répétition de n épreuves de Bernoulli de paramètre p
     * soit une loi binomiale B(n,p)
     * @param {string|number} n 
     * @param {string|number} p 
     * @returns 
     */
    static binomial(n, p) {
        n = parseInt(n);
        p = MyNerd.parseFloat(p);
        if (isNaN(n) || isNaN(p) || n <= 0 || p < 0 || p > 1) {
            throw new Error('Paramètres invalides pour la loi binomiale');
        }
        if (n>25) {
            return Alea._binomialBTPE(n, p);
        }
        let successes = 0;
        for (let i = 0; i < n; i++) {
            if (Math.random() < p) {
                successes++;
            }
        }
        return successes;
    }

    /**
     * Génère une liste de count résultats issus de la loi binomiale B(n,p)
     * @param {string|number} count 
     * @param {string|number} n 
     * @param {string|number} p 
     */
    static binomialList(count, n, p) {
        count = parseInt(count);
        if (isNaN(count) || count <= 0) {
            throw new Error('Paramètre count invalide pour binomialList');
        }
        return Array.from({ length: count }, () => Alea.binomial(n, p));
    }

    /**
     * Algorithme BTPE pour loi binomiale (plus rapide pour grands n)
     * @param {number} n - Nombre d'essais
     * @param {number} p - Probabilité de succès
     * @returns {number}
     */
    static _binomialBTPE(n, p) {
        // Ajuster p si nécessaire
        const flip = p > 0.5;
        const probability = flip ? 1 - p : p;
        
        const mean = n * probability;
        const variance = mean * (1 - probability);
        const stddev = Math.sqrt(variance);
        
        // Approximation normale pour grands n
        let x;
        do {
            x = Math.round(mean + stddev * Alea._normal(mean, stddev));
        } while (x < 0 || x > n);
        return flip ? n - x : x;
    }

    /** simule un aléa normal selon loi normale
     * @param {number} mu - moyenne
     * @param {number} sigma - écart type
     * @returns {number} un nombre aléatoire suivant une loi normale N(mu, sigma)
     */ 
    static _normal(mu, sigma) {
        let u, x, y;
        do {
            // Box-Muller pour génération normale
            x = Math.random();
            y = Math.random();
            u = x*x + y*y;
        } while (u ==0 || u > 1);
        return (x*Math.sqrt(-2 * Math.log(u) / u))*sigma + mu;
    }

    /**
     * Calcule P(X <= k) pour X ~ B(n, p) via récurrence
     * Plus efficace car réutilise les calculs précédents
     */
    static binomialCDF(k, n, p) {
        k = parseInt(k);
        n = parseInt(n);
        p = MyNerd.parseFloat(p);
        
        if (isNaN(k) || isNaN(n) || isNaN(p)) {
            throw new Error('Paramètres invalides pour binomialCDF');
        }
        if (k < 0) return 0;
        if (k >= n) return 1;
        if (p === 0) return 1;
        if (p === 1) return 0;
        
        // Calcul itératif avec récurrence
        const normFactor = (1 - p);
        const remainingPowers = n;
        let prob = 1; // P(X=0) (manque le facteur (1-p)^n)
        let cdf = 0; // idem
        // P(X = i+1) = P(X = i) * (n-i)/(i+1) * p/(1-p)
        const ratio = p/(1 - p);
        for (let i = 0; i < k; i++) {
            cdf += prob;
            // si cdf trop grand, normaliser
            while (cdf > 10 && remainingPowers > 0) {
                cdf *= normFactor;
                prob *= normFactor;
                remainingPowers--;
            }
            prob *= ((n - i) / (i + 1)) * ratio;
        }
        while (remainingPowers > 0) {
            cdf *= normFactor;
            remainingPowers--;
        }
        // éviter dépassement dû aux erreurs d'arrondi
        return Math.min(cdf, 1);
    }

    

}

export default Alea;
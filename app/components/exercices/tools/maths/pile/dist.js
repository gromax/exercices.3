/*
 * Module sur les distributions de probabilités
 * Implémente des fonctions pour la loi binomiale et autres
 */

import MyMath from '../mymath'
class Dist {
    static NAME = 'Dist'
    static METHODS = {
        'binomial': Dist.binomial,
        'binList': Dist.binomialList,
        'binCDF': Dist.binomialCDF,
        'binPDF': Dist.binomialPDF,
    };

    /**
     * simule une répétition de n épreuves de Bernoulli de paramètre p
     * soit une loi binomiale B(n,p)
     * @param {string|number} n 
     * @param {string|number} p 
     * @returns 
     */
    static binomial(n, p) {
        n = MyMath.toInteger(n);
        p = MyMath.toNumber(p);
        if (isNaN(n) || isNaN(p) || n <= 0 || p < 0 || p > 1) {
            throw new Error('Paramètres invalides pour la loi binomiale');
        }
        if (n>25) {
            return Dist.#binomialBTPE(n, p);
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
        count = MyMath.toInteger(count)
        if (count <= 0) {
            throw new Error('Paramètre count invalide pour binomialList')
        }
        p = MyMath.toNumber(p)
        if (isNaN(p) || p < 0 || p > 1) {
            throw new Error('Paramètre p invalide pour binomialList');
        }
        return Array.from({ length: count }, () => Dist.binomial(n, p));
    }

    /**
     * Algorithme BTPE pour loi binomiale (plus rapide pour grands n)
     * @param {number} n - Nombre d'essais
     * @param {number} p - Probabilité de succès
     * @returns {number}
     */
    static #binomialBTPE(n, p) {
        // Ajuster p si nécessaire
        const flip = p > 0.5;
        const probability = flip ? 1 - p : p;
        
        const mean = n * probability;
        const variance = mean * (1 - probability);
        const stddev = Math.sqrt(variance);
        
        // Approximation normale pour grands n
        let x;
        let counter = 0;
        do {
            x = Math.round(Dist.#normal(mean, stddev));
            counter++;
            if (counter > 10) {
                throw new Error("Trop d'itérations dans #binomialBTPE");
            }
        } while (x < 0 || x > n);
        return flip ? n - x : x;
    }

    /** simule un aléa normal selon loi normale
     * @param {number} mu - moyenne
     * @param {number} sigma - écart type
     * @returns {number} un nombre aléatoire suivant une loi normale N(mu, sigma)
     */ 
    static #normal(mu, sigma) {
        mu = MyMath.toNumber(mu)
        sigma = MyMath.toNumber(sigma)
        if (isNaN(mu) || isNaN(sigma) || sigma <= 0) {
            throw new Error('Paramètres invalides pour Dist.#normal')
        }
        let u, x, y
        do {
            // Box-Muller pour génération normale
            x = Math.random()
            y = Math.random()
            u = x*x + y*y
        } while (u ==0 || u > 1)
        return (x*Math.sqrt(-2 * Math.log(u) / u))*sigma + mu
    }

    /**
     * Calcule P(X <= k) pour X ~ B(n, p) via récurrence
     * Plus efficace car réutilise les calculs précédents
     */
    static binomialCDF(k, n, p) {
        k = MyMath.toInteger(k)
        n = MyMath.toInteger(n)
        p = MyMath.toNumber(p)
        
        if (isNaN(k) || isNaN(n) || isNaN(p)) {
            throw new Error('Paramètres invalides pour binomialCDF')
        }
        if (k < 0) return 0
        if (k >= n) return 1
        if (p === 0) return 1
        if (p === 1) return 0
        
        // Calcul itératif avec récurrence
        const normFactor = (1 - p)
        const remainingPowers = n
        let prob = 1 // P(X=0) (manque le facteur (1-p)^n)
        let cdf = 0 // idem
        // P(X = i+1) = P(X = i) * (n-i)/(i+1) * p/(1-p)
        const ratio = p/(1 - p)
        for (let i = 0; i < k; i++) {
            cdf += prob
            // si cdf trop grand, normaliser
            while (cdf > 10 && remainingPowers > 0) {
                cdf *= normFactor
                prob *= normFactor
                remainingPowers--
            }
            prob *= ((n - i) / (i + 1)) * ratio
        }
        while (remainingPowers > 0) {
            cdf *= normFactor
            remainingPowers--
        }
        // éviter dépassement dû aux erreurs d'arrondi
        return Math.min(cdf, 1)
    }

    /**
     * Calcule P(X = k) pour X ~ B(n, p) via récurrence
     * Plus efficace car réutilise les calculs précédents
     */
    static binomialPDF(k, n, p) {
        k = MyMath.toInteger(k)
        n = MyMath.toInteger(n)
        p = MyMath.toNumber(p)
        if (isNaN(k) || isNaN(n) || isNaN(p)) {
            throw new Error('Paramètres invalides pour binomialPDF')
        }
        if (k < 0 || k > n) return 0;
        if (p === 0) return k === 0 ? 1 : 0
        if (p === 1) return k === n ? 1 : 0
        // Calcul itératif avec récurrence
        let logProb = 0
        for (let i = k+1; i <= n; i++) {
            logProb += Math.log(i)
        }
        for (let i = 1; i <= k; i++) {
            logProb -= Math.log(i)
        }
        logProb += k * Math.log(p) + (n - k) * Math.log(1 - p)
        return Math.min(Math.exp(logProb),1)
    }
}

export default Dist
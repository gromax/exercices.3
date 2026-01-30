/*
 * Module sur les distributions de probabilités
 * Implémente des fonctions pour la loi binomiale et autres
 */

import { InputType } from "@types"
import MyMath from '../mymath'

class Dist {
    static readonly NAME = 'Dist'
    static readonly METHODS = {
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
    static binomial(n:InputType, p:InputType):number {
        const _n = MyMath.toInteger(n);
        const _p = MyMath.toNumber(p);
        if (isNaN(_n) || isNaN(_p) || _n <= 0 || _p < 0 || _p > 1) {
            throw new Error('Paramètres invalides pour la loi binomiale');
        }
        if (_n>25) {
            return Dist._binomialBTPE(_n, _p);
        }
        let successes = 0;
        for (let i = 0; i < _n; i++) {
            if (Math.random() < _p) {
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
    static binomialList(count:InputType, n:InputType, p:InputType):Array<number> {
        const _count = MyMath.toInteger(count)
        if (_count <= 0) {
            throw new Error('Paramètre count invalide pour binomialList')
        }
        const _p = MyMath.toNumber(p)
        if (isNaN(_p) || _p < 0 || _p > 1) {
            throw new Error('Paramètre p invalide pour binomialList');
        }
        return Array.from({ length: _count }, () => Dist.binomial(n, _p));
    }

    /**
     * Algorithme BTPE pour loi binomiale (plus rapide pour grands n)
     * @param {number} n - Nombre d'essais
     * @param {number} p - Probabilité de succès
     * @returns {number}
     */
    private static _binomialBTPE(n:number, p:number):number {
        // Ajuster p si nécessaire
        const flip = p > 0.5;
        const probability = flip ? 1 - p : p;
        
        const mean = n * probability;
        const variance = mean * (1 - probability);
        const stddev = Math.sqrt(variance);
        
        // Approximation normale pour grands n
        let x:number;
        let counter = 0;
        do {
            x = Math.round(Dist._normal(mean, stddev));
            counter++;
            if (counter > 10) {
                throw new Error("Trop d'itérations dans _binomialBTPE");
            }
        } while (x < 0 || x > n);
        return flip ? n - x : x;
    }

    /** simule un aléa normal selon loi normale
     * @param {number} mu - moyenne
     * @param {number} sigma - écart type
     * @returns {number} un nombre aléatoire suivant une loi normale N(mu, sigma)
     */ 
    private static _normal(mu:number, sigma:number):number {
        if (isNaN(mu) || isNaN(sigma) || sigma <= 0) {
            throw new Error('Paramètres invalides pour Dist._normal')
        }
        let u:number, x:number, y:number
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
    static binomialCDF(k:InputType, n:InputType, p:InputType):number {
        const _k = MyMath.toInteger(k)
        const _n = MyMath.toInteger(n)
        const _p = MyMath.toNumber(p)
        
        if (isNaN(_k) || isNaN(_n) || isNaN(_p)) {
            throw new Error('Paramètres invalides pour binomialCDF')
        }
        if (_k < 0) return 0
        if (_k >= _n) return 1
        if (_p === 0) return 1
        if (_p === 1) return 0
        
        // Calcul itératif avec récurrence
        const normFactor = (1 - _p)
        let remainingPowers = _n
        let prob = 1 // P(X=0) (manque le facteur (1-p)^n)
        let cdf = 0 // idem
        // P(X = i+1) = P(X = i) * (n-i)/(i+1) * p/(1-p)
        const ratio = _p/(1 - _p)
        for (let i = 0; i <= _k; i++) {
            cdf += prob
            // si cdf trop grand, normaliser
            while (cdf > 10 && remainingPowers > 0) {
                cdf *= normFactor
                prob *= normFactor
                remainingPowers--
            }
            prob *= ((_n - i) / (i + 1)) * ratio
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
    static binomialPDF(k:InputType, n:InputType, p:InputType):number {
        const _k = MyMath.toInteger(k)
        const _n = MyMath.toInteger(n)
        const _p = MyMath.toNumber(p)
        if (isNaN(_k) || isNaN(_n) || isNaN(_p)) {
            throw new Error('Paramètres invalides pour binomialPDF')
        }
        if (_k < 0 || _k > _n) return 0;
        if (_p === 0) return _k === 0 ? 1 : 0
        if (_p === 1) return _k === _n ? 1 : 0
        // Calcul itératif avec récurrence
        let logProb = 0
        for (let i = _k+1; i <= _n; i++) {
            logProb += Math.log(i)
        }
        for (let i = 1; i <= _n-_k; i++) {
            logProb -= Math.log(i)
        }
        logProb += _k * Math.log(_p) + (_n - _k) * Math.log(1 - _p)
        return Math.min(Math.exp(logProb),1)
    }
}

export default Dist
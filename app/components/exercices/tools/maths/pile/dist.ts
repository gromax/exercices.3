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
        'normCDF': Dist.normalCDF,
        'normPDF': Dist.normalPDF,
        'normal': Dist.normal,
        'normList': Dist.normalList
    };

    /**
     * simule une répétition de n épreuves de Bernoulli de paramètre p
     * soit une loi binomiale B(n,p)
     * @param {InputType} n 
     * @param {InputType} p 
     * @returns {number} un nombre aléatoire suivant une loi binomiale B(n,p)
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
     * @param {InputType} count 
     * @param {InputType} n 
     * @param {InputType} p 
     * @return {Array<number>} un tableau de count nombres aléatoires suivant une loi binomiale B(n,p)
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
     * @param {InputType} k - nombre de succès
     * @param {InputType} n - nombre d'essais
     * @param {InputType} p - probabilité de succès
     * @return {number} P(X <= k)
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
     * @param {InputType} k - nombre de succès
     * @param {InputType} n - nombre d'essais
     * @param {InputType} p - probabilité de succès
     * @return {number} P(X = k) pour X ~ B(n, p)
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

    /**
     * Fonction d'erreur
     * erf(x/sqrt(2)) = 2/sqrt(pi) * integral de 0 à x de exp(-t^2/2) dt
     * soit la proba que Z ~ N(0,1) soit dans [-x, x]
     * @param {InputType} x 
     * @returns {number} erf(x) approximé selon Abramowitz et Stegun
     */
    static _erf(x:number):number {
        const sign = x >= 0 ? 1 : -1
        const absX = Math.abs(x)
        const a1 = 0.254829592
        const a2 = -0.284496736
        const a3 = 1.421413741
        const a4 = -1.453152027
        const a5 = 1.061405429
        const p = 0.3275911

        const t = 1 / (1 + p * absX)
        const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX)
        return sign * y
    }
    
    /**
     * Calcule P(X <= x) pour X ~ N(mu, std2)
     * @param {InputType} x - valeur à évaluer
     * @param {InputType} mu - moyenne
     * @param {InputType} std - écart type
     */
    static normalCDF(x:InputType, mu:InputType, std:InputType):number {
        const _x = MyMath.toFloat(x)
        const _mu = MyMath.toFloat(mu)
        const _std = MyMath.toFloat(std)
        
        if (isNaN(_x) || isNaN(_mu) || isNaN(_std) || _std <= 0) {
            throw new Error('Paramètres invalides pour normalCDF')
        }
        const z = (_x - _mu) / (_std * Math.sqrt(2))
        /*
        erf(x normalisé / sqrt(2)) donne la proba pour X dans [-x,x]
        donc 0.5*(1-erf(...)) donne la proba d'une des queues,
        et donc erf(...) + 0.5(1-erf(...)) donnc la proba souhaitée
        */
        return 0.5*(1 + Dist._erf(z))
    }

    /**
     * Calcule f(x) selon densité N(mu, std2)
     * @param {InputType} x - point d'évaluation
     * @param {InputType} mu - moyenne
     * @param {InputType} std - écart type
     */
    static normalPDF(x:InputType, mu:InputType, std:InputType):number {
        const _x = MyMath.toFloat(x)
        const _mu = MyMath.toFloat(mu)
        const _std = MyMath.toFloat(std)
        
        if (isNaN(_x) || isNaN(_mu) || isNaN(_std) || _std <= 0) {
            throw new Error('Paramètres invalides pour normalPDF')
        }
        return (1 / (_std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((_x - _mu) / _std, 2))
    }

    /**
     * simule un tirage selon une loi normale
     * @param {InputType} mu - moyenne
     * @param {InputType} std - écart type
     * @returns {number} un nombre aléatoire suivant une loi normale N(mu, std2)
     */
    static normal(mu:InputType, std:InputType):number {
        const _mu = MyMath.toFloat(mu)
        const _std = MyMath.toFloat(std)
        if (isNaN(_mu) || isNaN(_std) || _std <= 0) {
            throw new Error('Paramètres invalides pour la loi normale')
        }
        return Dist._normal(_mu, _std)
    }

    /**
     * Génère une liste de count résultats issus de la loi ~ N(mu, std2)
     * @param {InputType} count 
     * @param {InputType} mu 
     * @param {InputType} std 
     * @return {Array<number>} un tableau de count nombres aléatoires suivant une loi normale N(mu, std2)
     */
    static normalList(count:InputType, mu:InputType, std:InputType):Array<number> {
        const _count = MyMath.toInteger(count)
        if (_count <= 0) {
            throw new Error('Paramètre count invalide pour normalList')
        }
        const _mu = MyMath.toFloat(mu)
        const _std = MyMath.toFloat(std)
        if (isNaN(_mu) || isNaN(_std) || _std <= 0) {
            throw new Error('Paramètres invalides pour normalList')
        }
        return Array.from({ length: _count }, () => Dist._normal(_mu, _std));
    }

}


export default Dist
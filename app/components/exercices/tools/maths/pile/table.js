import MyMath from "../mymath"

class Table {
    static NAME = 'Table';
    static METHODS = {
        'indice': Table.indice,
        'indices': Table.indices,
        'sortFreqs': Table.sortFreqs,
        'toBrut': Table.toBrut,
        'size': Table.size,
        'sum': Table.sum,
        'product': Table.product,
        'moyenne': Table.average,
        'average': Table.average,
        'average2': Table.average2,
        'covariance': Table.covariance,
        'variance': Table.variance,
        'std': Table.std,
        'variance2': Table.variance2,
        'std2': Table.std2,
        'mediane2': Table.mediane2,
        'quantile2': Table.quantile2,
        'max': Table.max,
        'min': Table.min,
        'ECC2': Table.ECC2,
        'filter': Table.filter,
    }

    static numberArray(arr) {
        if (!Array.isArray(arr)) {
            throw new Error(`L'argument de Table.numberArray doit être un tableau.`);
        }
        return arr.map(v => MyMath.parseFloat(v));
    }

    static stringArray(arr) {
        if (!Array.isArray(arr)) {
            throw new Error(`L'argument de Table.stringArray doit être un tableau.`)
        }
        return arr.map(v => String(v))
    }


    static indice(val, arr) {
        if (!Array.isArray(arr)) {
            throw new Error(`Le second argument de Table.indice doit être un tableau.`);
        }
        return arr.map(v => String(v)).indexOf(String(val))
    }

    static indices(val, arr) {
        if (!Array.isArray(arr)) {
            throw new Error(`Le second argument de Table.indices doit être un tableau.`);
        }
        arr = Table.stringArray(arr)
        return arr.reduce((acc, item, index) => {
            if (String(item) === String(val)) {
                acc.push(index)
            }
            return acc
        }, [])
    }

    /**
     * Trie les valeurs : renvoie une liste de valeurs (croissantes)
     * et leurs effectifs associés
     * @param {Array} arr 
     * @return {Array<Array,Array>} [valeurs, effectifs]
     */
    static sortFreqs(arr) {
        if (!Array.isArray(arr)) {
            throw new Error(`L'argument de Table.sortFreqs doit être un tableau.`);
        }
        const arrCopy = Table.numberArray(arr)
        arrCopy.sort((a, b) => a - b)
        const valeurs = []
        const effectifs = []
        let currentValue = null
        for (const val of arrCopy) {
            if (val !== currentValue) {
                valeurs.push(val)
                effectifs.push(1)
                currentValue = val
            } else {
                effectifs[effectifs.length - 1]++
            }
        }
        return [valeurs, effectifs]
    }

    /**
     * partant d'un tableau de valeurs et d'effectifs,
     * reconstitue le tableau brut
     * @param {Array} values 
     * @param {Array} effectifs 
     */
    static toBrut(values, effectifs) {
        if (!Array.isArray(values) || !Array.isArray(effectifs)) {
            throw new Error(`Les arguments de Table.toBrut doivent être des tableaux.`);
        }
        if (values.length !== effectifs.length) {
            throw new Error(`Les tableaux passés à Table.toBrut doivent avoir la même taille.`);
        }
        const result = []
        effectifs = Table.numberArray(effectifs)
        for (let i = 0; i < values.length; i++) {
            for (let j = 0; j < effectifs[i]; j++) {
                result.push(values[i])
            }
        }
        return result
    }

    static size(arr) {
        if (!Array.isArray(arr)) {
            throw new Error(`L'argument de Table.size doit être un tableau.`);
        }
        return arr.length
    }

    static sum(arr) {
        if (!Array.isArray(arr)) {
            throw new Error(`L'argument de Table.sum doit être un tableau.`)
        }
        arr = Table.numberArray(arr)
        return arr.reduce((acc, val) => acc + val, 0)
    }

    static product(arr1, arr2) {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
            throw new Error(`Les arguments de Table.product doivent être des tableaux.`);
        }
        if (arr1.length !== arr2.length) {
            throw new Error(`Les tableaux passés à Table.product doivent avoir la même taille.`);
        }
        arr1 = Table.numberArray(arr1)
        arr2 = Table.numberArray(arr2)
        return arr1.map((val, index) => val * arr2[index])
    }

    static average(values) {
        if (!Array.isArray(values)) {
            throw new Error(`L'argument de Table.average doit être un tableau.`)
        }
        if (values.length === 0) {
            throw new Error(`Le tableau passé à Table.average est vide.`)
        }
        values = Table.numberArray(values)
        return Table.sum(values) / values.length
    }

    static average2(values, effectifs) {
        if (!Array.isArray(values) || !Array.isArray(effectifs)) {
            throw new Error(`Les arguments de Table.average doivent être des tableaux.`)
        }
        if (values.length !== effectifs.length) {
            throw new Error(`Les tableaux passés à Table.average doivent avoir la même taille.`)
        }
        values = Table.numberArray(values)
        effectifs = Table.numberArray(effectifs)
        const N = Table.sum(effectifs)
        if (N === 0) {
            throw new Error(`La somme des effectifs est nulle dans Table.average.`)
        }
        return Table.sum(Table.product(values, effectifs)) / N
    }

    static covariance(values1, values2) {
        if (!Array.isArray(values1) || !Array.isArray(values2)) {
            throw new Error(`Les arguments de Table.covariance doivent être des tableaux.`);
        }
        if (values1.length !== values2.length) {
            throw new Error(`Les tableaux passés à Table.covariance doivent avoir la même taille.`);
        }
        values1 = Table.numberArray(values1)
        values2 = Table.numberArray(values2)
        const m1 = Table.average(values1)
        const m2 = Table.average(values2)
        let cov = 0;
        for (let i = 0; i < values1.length; i++) {
            cov += (values1[i] - m1) * (values2[i] - m2)
        }
        return cov / values1.length
    }

    static variance(values) {
        values = Table.numberArray(values)
        const m = Table.average(values)
        const squaredDiffs = values.map((val) => (val - m) ** 2)
        return Table.average(squaredDiffs)
    }

    static std(values) {
        return Math.sqrt(Table.variance(values));
    }

    static variance2(values, effectifs) {
        values = Table.numberArray(values)
        const m = Table.average2(values, effectifs);
        const squaredDiffs = values.map((val) => (val - m) ** 2)
        return Table.average2(squaredDiffs, effectifs);
    }

    static std2(values, effectifs) {
        return Math.sqrt(Table.variance2(values, effectifs));
    }

    static mediane2(values, effectifs) {
        if (!Array.isArray(values) || !Array.isArray(effectifs)) {
            throw new Error(`Les arguments de Table.mediane doivent être des tableaux.`);
        }
        if (values.length !== effectifs.length) {
            throw new Error(`Les tableaux passés à Table.mediane doivent avoir la même taille.`);
        }
        const N = Table.sum(effectifs);
        if (N === 0) {
            throw new Error(`La somme des effectifs est nulle dans Table.mediane.`);
        }
        values = Table.numberArray(values)
        effectifs = Table.numberArray(effectifs)
        let cumulative = 0;
        for (let i = 0; i < effectifs.length; i++) {
            cumulative += effectifs[i]
            if (2*cumulative == N) {
                return (values[i]+values[i+1])/2
            }
            if (2*cumulative > N) {
                return values[i]
            }
        }
    }

    static max(values) {
        values = Table.numberArray(values)
        return Math.max(...values);
    }

    static min(values) {
        values = Table.numberArray(values)
        return Math.min(...values);
    }

    static quantile2(values, effectifs, q) {
        if (!Array.isArray(values) || !Array.isArray(effectifs)) {
            throw new Error(`Les arguments de Table.quantile doivent être des tableaux.`);
        }
        if (values.length !== effectifs.length) {
            throw new Error(`Les tableaux passés à Table.quantile doivent avoir la même taille.`);
        }
        const N = Table.sum(effectifs)
        if (N === 0) {
            throw new Error(`La somme des effectifs est nulle dans Table.quantile.`)
        }
        values = Table.numberArray(values)
        effectifs = Table.numberArray(effectifs)
        let cumulative = 0
        for (let i = 0; i < effectifs.length; i++) {
            cumulative += effectifs[i];
            if (cumulative >= q * N) {
                return values[i]
            }
        }
    }

    /**
     * Renvoie l'effectif des individus ayant une valeur
     * <= value
     * @param {Array} values 
     * @param {Array} effectifs 
     * @param {number} value 
     * @returns 
     */
    static ECC2(values, effectifs, value) {
        if (!Array.isArray(values) || !Array.isArray(effectifs)) {
            throw new Error(`Les arguments de Table.quantile doivent être des tableaux.`)
        }
        if (values.length !== effectifs.length) {
            throw new Error(`Les tableaux passés à Table.quantile doivent avoir la même taille.`)
        }
        value = MyMath.parseFloat(value)
        values = Table.numberArray(values)
        effectifs = Table.numberArray(effectifs)
        let cumulative = 0
        for (let i = 0; i < effectifs.length; i++) {
            if (values[i] > value) {
                return cumulative
            }
            cumulative += effectifs[i]
        }
        return cumulative
    }

    /**
     * renvoie un tableau composé des éléments de values satisfaisant la condition
     * @param {Array} values 
     * @param {string} operator parmi ==, !=, <, <=, >, >=
     * @param {*} value 
     */
    static filter(values, operator, value) {
        if (!Array.isArray(values)) {
            throw new Error(`Les arguments de Table.filter doivent être des tableaux.`)
        }
        value = MyMath.parseFloat(value)
        if (!['==', '!=', '<', '<=', '>', '>='].includes(operator)) {
            throw new Error(`L'opérateur ${operator} passé à Table.filter est invalide.`)
        }
        return values.filter((val) => MyMath.compare(val, value, operator))
    }
}

export default Table;
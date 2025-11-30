import MyNerd from "../mynerd";

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
        'average': Table.average,
        'average2': Table.average2,
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
    };

    static indice(val, arr) {
        if (!Array.isArray(arr)) {
            throw new Error(`Le second argument de Table.indice doit être un tableau.`);
        }
        return arr.indexOf(val);
    }

    static indices(val, arr) {
        if (!Array.isArray(arr)) {
            throw new Error(`Le second argument de Table.indices doit être un tableau.`);
        }
        return arr.reduce((acc, item, index) => {
            if (String(item) === String(val)) {
                acc.push(index);
            }
            return acc;
        }, []);
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
        const arrCopy = arr.slice();
        arrCopy.sort((a, b) => a - b);
        const valeurs = [];
        const effectifs = [];
        let currentValue = null;
        for (const val of arrCopy) {
            if (val !== currentValue) {
                valeurs.push(val);
                effectifs.push(1);
                currentValue = val;
            } else {
                effectifs[effectifs.length - 1]++;
            }
        }
        return [valeurs, effectifs];
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
        const result = [];
        for (let i = 0; i < values.length; i++) {
            for (let j = 0; j < effectifs[i]; j++) {
                result.push(values[i]);
            }
        }
        return result;
    }

    static size(arr) {
        if (!Array.isArray(arr)) {
            throw new Error(`L'argument de Table.size doit être un tableau.`);
        }
        return arr.length;
    }

    static sum(arr) {
        if (!Array.isArray(arr)) {
            throw new Error(`L'argument de Table.sum doit être un tableau.`);
        }
        return arr.reduce((acc, val) => acc + val, 0);
    }

    static product(arr1, arr2) {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
            throw new Error(`Les arguments de Table.product doivent être des tableaux.`);
        }
        if (arr1.length !== arr2.length) {
            throw new Error(`Les tableaux passés à Table.product doivent avoir la même taille.`);
        }
        return arr1.map((val, index) => val * arr2[index]);
    }

    static average(values) {
        if (!Array.isArray(values)) {
            throw new Error(`L'argument de Table.average doit être un tableau.`);
        }
        if (values.length === 0) {
            throw new Error(`Le tableau passé à Table.average est vide.`);
        }
        return Table.sum(values) / values.length;
    }

    static average2(values, effectifs) {
        if (!Array.isArray(values) || !Array.isArray(effectifs)) {
            throw new Error(`Les arguments de Table.average doivent être des tableaux.`);
        }
        if (values.length !== effectifs.length) {
            throw new Error(`Les tableaux passés à Table.average doivent avoir la même taille.`);
        }
        const N = Table.sum(effectifs);
        if (N === 0) {
            throw new Error(`La somme des effectifs est nulle dans Table.average.`);
        }
        return Table.sum(Table.product(values, effectifs)) / N;
    }

    static variance(values) {
        const m = Table.average(values);
        const squaredDiffs = values.map((val) => (val - m) ** 2);
        return Table.average(squaredDiffs);
    }

    static std(values) {
        return Math.sqrt(Table.variance(values));
    }

    static variance2(values, effectifs) {
        const m = Table.average2(values, effectifs);
        const squaredDiffs = values.map((val) => (val - m) ** 2);
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
        let cumulative = 0;
        for (let i = 0; i < effectifs.length; i++) {
            cumulative += effectifs[i];
            if (2*cumulative == N) {
                return (values[i]+values[i+1])/2;
            }
            if (2*cumulative > N) {
                return values[i];
            }
        }
    }

    static max(values) {
        const vf = values.map(v => MyNerd.parseFloat(v));
        return Math.max(...vf);
    }

    static min(values) {
        const vf = values.map(v => MyNerd.parseFloat(v));
        return Math.min(...vf);
    }

    static quantile2(values, effectifs, q) {
        if (!Array.isArray(values) || !Array.isArray(effectifs)) {
            throw new Error(`Les arguments de Table.quantile doivent être des tableaux.`);
        }
        if (values.length !== effectifs.length) {
            throw new Error(`Les tableaux passés à Table.quantile doivent avoir la même taille.`);
        }
        const N = Table.sum(effectifs);
        if (N === 0) {
            throw new Error(`La somme des effectifs est nulle dans Table.quantile.`);
        }
        let cumulative = 0;
        for (let i = 0; i < effectifs.length; i++) {
            cumulative += effectifs[i];
            if (cumulative >= q * N) {
                return values[i];
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
            throw new Error(`Les arguments de Table.quantile doivent être des tableaux.`);
        }
        if (values.length !== effectifs.length) {
            throw new Error(`Les tableaux passés à Table.quantile doivent avoir la même taille.`);
        }
        value = MyNerd.parseFloat(value);
        let cumulative = 0;
        for (let i = 0; i < effectifs.length; i++) {
            if (values[i] > value) {
                return cumulative;
            }
            cumulative += effectifs[i];
        }
        return cumulative;
    }

    /**
     * renvoie un tableau composé des éléments de values satisfaisant la condition
     * @param {Array} values 
     * @param {string} operator parmi ==, !=, <, <=, >, >=
     * @param {*} value 
     */
    static filter(values, operator, value) {
        if (!Array.isArray(values)) {
            throw new Error(`Les arguments de Table.filter doivent être des tableaux.`);
        }
        value = MyNerd.parseFloat(value);
        if (!['==', '!=', '<', '<=', '>', '>='].includes(operator)) {
            throw new Error(`L'opérateur ${operator} passé à Table.filter est invalide.`);
        }
        return values.filter((val) => MyNerd.compare(val, value, operator));
    }
}

export default Table;
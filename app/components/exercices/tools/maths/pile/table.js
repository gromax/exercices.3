class Table {
    static NAME = 'Table';
    static METHODS = {
        'indice': Table.indice,
        'indices': Table.indices,
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
        const m = Table.average(values, effectifs);
        const squaredDiffs = values.map((val) => (val - m) ** 2);
        return Table.average(squaredDiffs, effectifs);
    }

    static std2(values, effectifs) {
        return Math.sqrt(Table.variance(values, effectifs));
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
}

export default Table;
import MyMath from "../mymath"
import { InputType } from "@types"

class Table {
    static readonly NAME = 'Table';
    static readonly METHODS = {
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
        'sort': Table.sort,
    }

    static numberArray(arr:Array<InputType>):Array<number> {
        if (!Array.isArray(arr)) {
            throw new Error(`L'argument de Table.numberArray doit être un tableau.`);
        }
        return arr.map(v => MyMath.parseFloat(v));
    }

    static stringArray(arr:Array<any>):Array<string> {
        if (!Array.isArray(arr)) {
            throw new Error(`L'argument de Table.stringArray doit être un tableau.`)
        }
        return arr.map(v => String(v))
    }


    static indice(val:any, arr:Array<any>):number {
        if (!Array.isArray(arr)) {
            throw new Error(`Le second argument de Table.indice doit être un tableau.`);
        }
        return arr.map(v => String(v)).indexOf(String(val))
    }

    static indices(val:any, arr:Array<any>):Array<number> {
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
    static sortFreqs(arr:Array<InputType>):[Array<number>, Array<number>] {
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
    static toBrut(values:Array<any>, effectifs:Array<InputType>):Array<any> {
        if (!Array.isArray(values) || !Array.isArray(effectifs)) {
            throw new Error(`Les arguments de Table.toBrut doivent être des tableaux.`);
        }
        if (values.length !== effectifs.length) {
            throw new Error(`Les tableaux passés à Table.toBrut doivent avoir la même taille.`);
        }
        const result = []
        const f_effectifs = Table.numberArray(effectifs)
        for (let i = 0; i < values.length; i++) {
            for (let j = 0; j < f_effectifs[i]; j++) {
                result.push(values[i])
            }
        }
        return result
    }

    static size(arr:Array<any>):number {
        if (!Array.isArray(arr)) {
            throw new Error(`L'argument de Table.size doit être un tableau.`);
        }
        return arr.length
    }

    static sum(arr:Array<InputType>):number {
        if (!Array.isArray(arr)) {
            throw new Error(`L'argument de Table.sum doit être un tableau.`)
        }
        const f_arr = Table.numberArray(arr)
        return f_arr.reduce((acc, val) => acc + val, 0)
    }

    static product(arr1:Array<InputType>, arr2:Array<InputType>):Array<number> {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
            throw new Error(`Les arguments de Table.product doivent être des tableaux.`);
        }
        if (arr1.length !== arr2.length) {
            throw new Error(`Les tableaux passés à Table.product doivent avoir la même taille.`);
        }
        const f_arr1 = Table.numberArray(arr1)
        const f_arr2 = Table.numberArray(arr2)
        return f_arr1.map((val, index) => val * f_arr2[index])
    }

    static average(values:Array<InputType>):number {
        if (!Array.isArray(values)) {
            throw new Error(`L'argument de Table.average doit être un tableau.`)
        }
        if (values.length === 0) {
            throw new Error(`Le tableau passé à Table.average est vide.`)
        }
        const f_values = Table.numberArray(values)
        return Table.sum(f_values) / f_values.length
    }

    static average2(values:Array<InputType>, effectifs:Array<InputType>):number {
        if (!Array.isArray(values) || !Array.isArray(effectifs)) {
            throw new Error(`Les arguments de Table.average doivent être des tableaux.`)
        }
        if (values.length !== effectifs.length) {
            throw new Error(`Les tableaux passés à Table.average doivent avoir la même taille.`)
        }
        const f_values = Table.numberArray(values)
        const f_effectifs = Table.numberArray(effectifs)
        const N = Table.sum(f_effectifs)
        if (N === 0) {
            throw new Error(`La somme des effectifs est nulle dans Table.average.`)
        }
        return Table.sum(Table.product(f_values, f_effectifs)) / N
    }

    static covariance(values1:Array<InputType>, values2:Array<InputType>):number {
        if (!Array.isArray(values1) || !Array.isArray(values2)) {
            throw new Error(`Les arguments de Table.covariance doivent être des tableaux.`);
        }
        if (values1.length !== values2.length) {
            throw new Error(`Les tableaux passés à Table.covariance doivent avoir la même taille.`);
        }
        const f_values1 = Table.numberArray(values1)
        const f_values2 = Table.numberArray(values2)
        const m1 = Table.average(f_values1)
        const m2 = Table.average(f_values2)
        let cov = 0;
        for (let i = 0; i < f_values1.length; i++) {
            cov += (f_values1[i] - m1) * (f_values2[i] - m2)
        }
        return cov / f_values1.length
    }

    static variance(values:Array<InputType>):number {
        const f_values = Table.numberArray(values)
        const m = Table.average(f_values)
        const squaredDiffs = f_values.map((val) => (val - m) ** 2)
        return Table.average(squaredDiffs)
    }

    static std(values:Array<InputType>):number {
        return Math.sqrt(Table.variance(values));
    }

    static variance2(values:Array<InputType>, effectifs:Array<InputType>):number {
        const f_values = Table.numberArray(values)
        const m = Table.average2(values, effectifs);
        const squaredDiffs = f_values.map((val) => (val - m) ** 2)
        return Table.average2(squaredDiffs, effectifs);
    }

    static std2(values:Array<InputType>, effectifs:Array<InputType>):number {
        return Math.sqrt(Table.variance2(values, effectifs));
    }

    static mediane2(values:Array<InputType>, effectifs:Array<InputType>):number {
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
        const f_values = Table.numberArray(values)
        const f_effectifs = Table.numberArray(effectifs)
        let cumulative = 0;
        for (let i = 0; i < f_effectifs.length; i++) {
            cumulative += f_effectifs[i]
            if (2*cumulative == N) {
                return (f_values[i]+f_values[i+1])/2
            }
            if (2*cumulative > N) {
                return f_values[i]
            }
        }
    }

    static max(values:Array<InputType>):number {
        const f_values = Table.numberArray(values)
        return Math.max(...f_values);
    }

    static min(values:Array<InputType>):number {
        const f_values = Table.numberArray(values)
        return Math.min(...f_values);
    }

    static quantile2(values:Array<InputType>, effectifs:Array<InputType>, q:number):number {
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
        const f_values = Table.numberArray(values)
        const f_effectifs = Table.numberArray(effectifs)
        let cumulative = 0
        for (let i = 0; i < f_effectifs.length; i++) {
            cumulative += f_effectifs[i];
            if (cumulative >= q * N) {
                return f_values[i]
            }
        }
    }

    /**
     * Renvoie l'effectif des individus ayant une valeur
     * inférieure ou égale à value
     * @param {Array} values 
     * @param {Array} effectifs 
     * @param {number} value 
     * @returns 
     */
    static ECC2(values:Array<InputType>, effectifs:Array<InputType>, value:InputType):number {
        if (!Array.isArray(values) || !Array.isArray(effectifs)) {
            throw new Error(`Les arguments de Table.quantile doivent être des tableaux.`)
        }
        if (values.length !== effectifs.length) {
            throw new Error(`Les tableaux passés à Table.quantile doivent avoir la même taille.`)
        }
        const f_value = MyMath.parseFloat(value)
        const f_values = Table.numberArray(values)
        const f_effectifs = Table.numberArray(effectifs)
        let cumulative = 0
        for (let i = 0; i < f_effectifs.length; i++) {
            if (f_values[i] <= f_value) {
                cumulative += f_effectifs[i]
            }
        }
        return cumulative
    }

    /**
     * renvoie un tableau composé des éléments de values satisfaisant la condition
     * @param {Array} values 
     * @param {string} operator parmi ==, !=, <, <=, >, >=
     * @param {*} value 
     */
    static filter(values:Array<InputType>, operator:string, value: InputType):Array<InputType> {
        if (!Array.isArray(values)) {
            throw new Error(`Les arguments de Table.filter doivent être des tableaux.`)
        }
        const f_value = MyMath.parseFloat(value)
        if (!['==', '!=', '<', '<=', '>', '>='].includes(operator)) {
            throw new Error(`L'opérateur ${operator} passé à Table.filter est invalide.`)
        }
        return values.filter((val) => MyMath.compare(val, f_value, operator))
    }

    /**
     * Renvoi un tableau trié des valeurs
     * @param {Array} values
     * @return {Array} valeurs triées
     */
    static sort(values:Array<InputType>):Array<InputType> {
        if (!Array.isArray(values)) {
            throw new Error(`L'argument de Table.sort doit être un tableau.`)
        }
        // pour éviter de calculer à chaque comparaison le parse des valeurs
        // je les calcule une fois pour toutes puis je trie en utilisant ces valeurs
        const couples = values.map((val) => [val, MyMath.parseFloat(val)])
        couples.sort((a, b) => (a[1] as number) - (b[1] as number))
        return couples.map((c) => c[0])
    }
}

export default Table;
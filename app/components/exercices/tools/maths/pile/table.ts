import MyMath from "../mymath"
import type { InputType } from "@types"
import Decimal from 'decimal.js'
import { toNumber, toDecimal } from "../misc/inputtype"


function prod(tab1:Decimal[], tab2:Decimal[]):Decimal[] {
    return tab1.map( (item,i) => item.mul(tab2[i]))
}

function mean(tab:Decimal[]):Decimal {
    return Decimal.sum(...tab).div(tab.length)
}

class Table {
    static readonly NAME = 'Table';
    static readonly METHODS = {
        'get': Table.get,
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
        'shuffle': Table.shuffle
    }

    static get(arr:Array<InputType>, index:InputType):InputType {
        if (!Array.isArray(arr)) {
            throw new Error(`Le premier argument de Table.get doit être un tableau.`);
        }
        const i = toNumber(index)
        if (!Number.isInteger(i) || i < 0 || i >= arr.length) {
            throw new Error(`L'indice passé à Table.get doit être un entier compris entre 0 et ${arr.length - 1}.`)
        }
        return arr[i]
    }

    static numberArray(arr:Array<InputType>):Array<number> {
        if (!Array.isArray(arr)) {
            throw new Error(`L'argument de Table.numberArray doit être un tableau.`);
        }
        return arr.map(v => toNumber(v));
    }

    static decimalArray(arr:Array<InputType>):Array<Decimal> {
        if (!Array.isArray(arr)) {
            throw new Error(`L'argument de Table.numberArray doit être un tableau.`);
        }
        return arr.map(v => toDecimal(v));
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

    static sum(arr:Array<InputType>):Decimal {
        if (!Array.isArray(arr)) {
            throw new Error(`L'argument de Table.sum doit être un tableau.`)
        }
        const f_arr = Table.decimalArray(arr)
        return Decimal.sum(...f_arr)
    }

    static product(arr1:Array<InputType>, arr2:Array<InputType>):Array<Decimal> {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
            throw new Error(`Les arguments de Table.product doivent être des tableaux.`);
        }
        if (arr1.length !== arr2.length) {
            throw new Error(`Les tableaux passés à Table.product doivent avoir la même taille.`);
        }
        return prod(Table.decimalArray(arr1), Table.decimalArray(arr2))
    }

    static average(values:Array<InputType>):Decimal {
        if (!Array.isArray(values)) {
            throw new Error(`L'argument de Table.average doit être un tableau.`)
        }
        if (values.length === 0) {
            throw new Error(`Le tableau passé à Table.average est vide.`)
        }
        return mean(Table.decimalArray(values))
    }

    static average2(values:Array<InputType>, effectifs:Array<InputType>):Decimal {
        if (!Array.isArray(values) || !Array.isArray(effectifs)) {
            throw new Error(`Les arguments de Table.average doivent être des tableaux.`)
        }
        if (values.length !== effectifs.length) {
            throw new Error(`Les tableaux passés à Table.average doivent avoir la même taille.`)
        }
        const xi = Table.decimalArray(values)
        const ni = Table.decimalArray(effectifs)
        const N = Decimal.sum(...ni)
        if (N.eq(0)) {
            throw new Error(`La somme des effectifs est nulle dans Table.average.`)
        }
        return mean(prod(xi,ni))
    }

    static covariance(values1:Array<InputType>, values2:Array<InputType>):Decimal {
        if (!Array.isArray(values1) || !Array.isArray(values2)) {
            throw new Error(`Les arguments de Table.covariance doivent être des tableaux.`);
        }
        if (values1.length !== values2.length) {
            throw new Error(`Les tableaux passés à Table.covariance doivent avoir la même taille.`);
        }
        const xi = Table.decimalArray(values1)
        const yi = Table.decimalArray(values2)
        const mx = mean(xi)
        const my = mean(yi)
        return mean(prod(xi,yi)).minus(mx.mul(my))
    }

    static variance(values:Array<InputType>):Decimal {
        const xi = Table.decimalArray(values)
        const mx2 = mean(xi).pow(2)
        return mean(prod(xi,xi)).minus(mx2)
    }

    static std(values:Array<InputType>):Decimal {
        const xi = Table.decimalArray(values)
        const mx2 = mean(xi).pow(2)
        return Decimal.sqrt(mean(prod(xi,xi)).minus(mx2))
    }

    static variance2(values:Array<InputType>, effectifs:Array<InputType>):Decimal {
        const xi = Table.decimalArray(values)
        const ni = Table.decimalArray(effectifs)
        const N = Decimal.sum(...ni)
        if (N.eq(0)) {
            throw new Error(`La somme des effectifs est nulle dans Table.variance2.`)
        }
        const mx = Decimal.sum(...prod(xi,ni)).div(N)
        const mx2 = Decimal.sum(...prod(prod(xi, xi), ni)).div(N)
        return mx2.minus(mx.mul(mx))
    }

    static std2(values:Array<InputType>, effectifs:Array<InputType>):Decimal {
        return Decimal.sqrt(Table.variance2(values, effectifs))
    }

    static mediane2(values:Array<InputType>, effectifs:Array<InputType>):Decimal {
        if (!Array.isArray(values) || !Array.isArray(effectifs)) {
            throw new Error(`Les arguments de Table.mediane doivent être des tableaux.`)
        }
        if (values.length !== effectifs.length) {
            throw new Error(`Les tableaux passés à Table.mediane doivent avoir la même taille.`)
        }
        const N = Table.sum(effectifs)
        if (N.eq(0)) {
            throw new Error(`La somme des effectifs est nulle dans Table.mediane.`)
        }
        const Ns2 = N.div(2)
        const xi = Table.decimalArray(values)
        const ni = Table.decimalArray(effectifs)
        let cumulative = new Decimal(0)
        for (let i = 0; i < ni.length; i++) {
            cumulative = cumulative.plus(ni[i])
            if (cumulative.eq(Ns2)) {
                return xi[i].plus(xi[i+1]).div(2)
            }
            if (cumulative.gt(Ns2)) {
                return xi[i]
            }
        }
    }

    static max(values:Array<InputType>):Decimal {
        return Decimal.max(...Table.decimalArray(values))
    }

    static min(values:Array<InputType>):Decimal {
        return Decimal.min(...Table.decimalArray(values))
    }

    static quantile2(values:Array<InputType>, effectifs:Array<InputType>, q:number):Decimal {
        if (!Array.isArray(values) || !Array.isArray(effectifs)) {
            throw new Error(`Les arguments de Table.quantile doivent être des tableaux.`);
        }
        if (values.length !== effectifs.length) {
            throw new Error(`Les tableaux passés à Table.quantile doivent avoir la même taille.`);
        }
        const ni = Table.decimalArray(effectifs)
        const N = Decimal.sum(...ni)
        if (N.eq(0)) {
            throw new Error(`La somme des effectifs est nulle dans Table.quantile.`)
        }
        const xi = Table.decimalArray(values)
        const Nsq = N.div(q)
        let cumulative = new Decimal(0)
        for (let i = 0; i < ni.length; i++) {
            cumulative = cumulative.plus(ni[i])
            if (cumulative.gte(Nsq)) {
                return xi[i]
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
        const f_value = toNumber(value)
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
        const f_value = toNumber(value)
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
        const couples = values.map((val) => [val, toNumber(val)])
        couples.sort((a, b) => (a[1] as number) - (b[1] as number))
        return couples.map((c) => c[0])
    }

    /**
     * Renvoi une copie mélangée du tableau fourni
     * @param {Array} values
     * @return {Array} valeurs mélangées
     */
    static shuffle(values:Array<InputType>):Array<InputType> {
        if (!Array.isArray(values)) {
            throw new Error(`L'argument de Table.shuffle doit être un tableau.`)
        }
        // algorithme de Fisher-Yates
        const shuffled = [...values] as Array<InputType>
        for (let i = shuffled.length - 1; i > 0; i--) {
            const rand = Math.floor(Math.random() * (i + 1))
            const temp:InputType = shuffled[i]
            shuffled[i] = shuffled[rand]
            shuffled[rand] = temp
        }
        return shuffled
    }
}

export default Table;
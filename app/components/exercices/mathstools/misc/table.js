class Table {
    static NAME = 'Table';
    static METHODS = {
        'indice': Table.indice,
        'indices': Table.indices,
        'size': Table.size,
        'sum': Table.sum
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
}

export default Table;
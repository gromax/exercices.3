import Bloc from "../bloc";

class InputBloc extends Bloc {
    constructor(label, paramsString) {
        super(label, paramsString, false);
        if (!paramsString) {
            throw new Error(`<${label}> doit avoir un nom (ex: <${label}:le_nom>)`);
        }
        this._resultView = null;
        this._score = null;
    }

    nombrePts() {
        return 1;
    }

    /**
     * renvoie la vue résultat. La calcule au besoin
     * @param {*} data 
     * @returns {View} la vue résultat
     */
    resultView(data) {
        if (this._resultView === null) {
            if (typeof this._calcResult !== 'function') {
                throw new Error(`La méthode _calcResult doit être définie dans la sous-classe de InputBloc`);
            }
            this._calcResult(data);
        }
        return this._resultView;
    }

    /**
     * Renvoie le score final
     * le calcule au besoin
     * @param {*} data 
     * @returns {number} le score final
     */
    resultScore(data) {
        if (this._score === null) {
            if (typeof this._calcResult !== 'function') {
                throw new Error(`La méthode _calcResult doit être définie dans la sous-classe de InputBloc`);
            }
            this._calcResult(data);
        }
        return this._score;
    }
}

export default InputBloc;
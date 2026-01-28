import Bloc from "./bloc";
import TkzTabView from "../blocsviews/tkztabview";
import Colors from "../colors";
import TkzTab from "../blocsviews/tkztab/tkztab";
import TabVarLineInput from "../blocsviews/tkztab/tabvarlineinput"
class TkzTabBloc extends Bloc {
    static LABELS = ['tkztab']

    constructor(label, paramsString) {
        super(label, paramsString, false)
        this._lines = []
        this._color = 'black'
        this._tkzTab = null
    }

    /**
     * Définir les couleurs à utiliser
     * @param {Colors} colors 
     */
    setColors(colors) {
        this._colors = colors
    }

    /**
     * calcule le tkztab au besoin
     * @returns {TkzTab} le tkztab construit
     */
    _getTkzTab() {
        if (this._params.xlist === undefined) {
            throw new Error("<tkztab/> Le paramètre 'xlist' est obligatoire.")
        }
        if (this._tkzTab === null) {
            const config = this._getConfig()
            this._tkzTab = new TkzTab(this._params.xlist, config)
            this._tkzTab.addLines(this._lines)
        }
        return this._tkzTab
    }

    _getConfig() {
        const config = {
            color: this._color,
            xtag: this._params.tag || "$x$",
        }

        if (this.params.pixelsperline !== undefined) {
            config.pixelsYUnit = Number(this.params.pixelsperline)
        }
        if (this.params.lgt !== undefined) {
            config.lgt = Number(this.params.lgt)
        }
        if (this.params.espcl !== undefined) {
            config.espcl = Number(this.params.espcl)
        }
        if (this.params.margin !== undefined) {
            config.margin = Number(this.params.margin)
        }
        if (this.params.headerheight !== undefined) {
            config.headerHeight = Number(this.params.headerheight)
        }
        return config
    }

    /**
     * renvoie la vue pour l'affichage de l'exercice
     * @param {object} answers 
     * @returns 
     */
    _customView(answers) {
        return new TkzTabView({
            tkzTab: this._getTkzTab(),
        })
    }

    setParam(key, value) {
        if (TkzTab.LINESTYPES.includes(key)) {
            this._lines.push(TkzTab.parseLine(key, value))
            return
        }
        if (key === 'color') {
            const n = parseInt(value)
            if (!isNaN(n)) {
                value = this._colors.getColor(n)
            }
            this._color = value
            return
        }
        super.setParam(key, value)
    }

    /**
     * réalise la validation de la saisie
     * renvoi true si ok, message d'erreur sinon
     * si pas d'argument, renvoie le name à valider
     * @param {string|undefined} userValue 
     * @returns {true|string} true si ok, message d'erreur sinon
     */
    validation(userValue) {
        if (typeof userValue === 'undefined') {
            return this._lines.map(line => line.name || '').filter(name => name !== '')
        }
        // autrement l'input est forcément valide
        return true
    }

    /**
     * renvoie le nombre de points total
     * c'est le nombre de lignes inputvar ou inputsign
     * @returns {number} le nombre de points total
     */
    nombrePts() {
        return this._lines.filter(line => TkzTab.INPUTLABELS.includes(line.type)).length
    }

    /**
     * renvoie la vue résultat. La calcule au besoin
     * @param {*} data 
     * @returns {View} la vue résultat
     */
    resultView(data) {
        if (typeof this._resultView === "undefined") {
            this._calcResult(data)
        }
        return this._resultView
    }

    /**
     * Renvoie le score final
     * le calcule au besoin
     * @param {*} data 
     * @returns {number} le score final
     */
    resultScore(data) {
        for (let line of this._lines) {
            if (line.type === 'inputvar' || line.type === 'inputsign') {
                // on doit calculer le score
                if (typeof data[line.name] === "undefined") {
                    // donnée manquante
                    return 0
                }
            }
        }
        // toutes les données sont présentes
        if (typeof this._score === "undefined") {
            this._calcResult(data)
        }
        return this._score
    }
    
    /**
     * Calcule le score et la vue
     * @param {*} data 
     */
    _calcResult(data) {
        // on va calculer un tableau résultat.
        // les lignes inputvar donneront lieu à une correction
        // en ajoutant une ligne en vert si elle est juste
        // et une ligne en rouge avec la bonne en vert sinon
        // on va calculer de nouvelles lines
        const config = this._getConfig()
        const tkzTab = new TkzTab(this._params.xlist, config)
        let count = 0
        for (let line of this._lines) {
            if (!TkzTab.INPUTLABELS.includes(line.type)) {
                // ligne normale, on la recopie
                tkzTab.addLine(line)
                continue
            }
            // forcémen inputvar ou inputsign
            const newLine = {
                type: line.type === 'inputvar' ? 'var' : 'sign',
                tag: line.tag,
                hauteur: line.hauteur,
                line: line.type === 'inputvar' ? line.solution : line.line
            }
            // on met de toute façon une ligne pour la correction
            tkzTab.addLine(newLine).setSuccess(true)
            const userValue = data[line.name] || ''
            const solution = newLine.line
            if (line.type === 'inputvar' && TabVarLineInput.compare(solution, userValue)) {
                // bonne réponse
                count += 1
                continue
            } else if (line.type === 'inputsign' && solution === userValue) {
                // bonne réponse
                count += 1
                continue
            }
            const wrongLine = { ...newLine }
            wrongLine.line = userValue
            tkzTab.addLine(wrongLine).setSuccess(false)
        }
        this._score = count
        this._resultView = new TkzTabView({
            tkzTab: tkzTab,
            result:true
        })
    }


}

export default TkzTabBloc;


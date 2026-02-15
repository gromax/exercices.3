import _ from "underscore"
import Bloc from "./bloc";
import TkzTabView from "../views/tkztabview";
import TkzTab from "../views/tkztab/tkztab";
import TabVarLineInput from "../views/tkztab/tabvarlineinput"
import { AnyView, InputType, NestedInput, TabLineConfig, TLineType } from "@types";
import FormItemImplementation from "../implementation/formitem"

class TkzTabBloc extends Bloc implements FormItemImplementation {
    readonly IMPLEMENTATION_FORMITEM = true
    static readonly LABELS = ['tkztab']

    private _lines:Array<TabLineConfig>
    private _color:string
    private _tkzTab?:TkzTab
    private _resultView?:AnyView
    private _score?:number
    private _xList?:Array<string>|string

    constructor(tag:string, paramsString:string) {
        super(tag, paramsString, false)
        this._lines = []
        this._color = 'black'
    }

    /**
     * calcule le tkztab au besoin
     * @returns {TkzTab} le tkztab construit
     */
    private _getTkzTab():TkzTab {
        if (this._params.xlist === undefined) {
            throw new Error("<tkztab/> Le paramètre 'xlist' est obligatoire.")
        }
        if (typeof this._tkzTab === "undefined") {
            const config = this._getConfig()
            this._tkzTab = new TkzTab(this._xList, config)
            this._tkzTab.addLines(this._lines)
        }
        return this._tkzTab
    }

    private _getConfig():Record<string,number|string> {
        const config:Record<string,number|string> = {
            color: this._color,
            xtag: this._params.tag
                ? String(this._params.tag)
                : "$x$",
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
    protected _getView(answers:Record<string,string>):AnyView {
        return new TkzTabView({
            tkzTab: this._getTkzTab(),
        })
    }

    setParam(key:string, value:NestedInput):void {
        if (TkzTab.LINESTYPES.includes(key)) {
            if (typeof value !== 'string') {
                throw new Error("<tkztab> format de la ligne invalide : key")
            }
            this._lines.push(TkzTab.parseLine(key, value))
            return
        }
        if (key === 'color') {
            if (Array.isArray(value)) {
                throw new Error(`<tkztab>, le paramètre ${key} ne devrait pas être un tableau.`)
            }
            const stringValue = String(value)
            const n = parseInt(stringValue)
            if (!isNaN(n)) {
                value = this._colors.getColor(n)
            }
            this._color = stringValue
            return
        }
        if (key === "xlist") {
            this._xList = (Array.isArray(value))
                ? _.flatten(value).map(item => String(item))
                : String(value)
        }
        super.setParam(key, value)
    }

    /**
     * réalise la validation de la saisie
     * renvoi true si ok, message d'erreur sinon
     * si pas d'argument, renvoie le name à valider
     * @param {string|undefined} userValue 
     * @returns {boolean|Array<string>} true si ok, message d'erreur sinon
     */
    validation(userValue?:any):Array<string>|boolean {
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
    nombrePts():number {
        return this._lines.filter(line => TkzTab.INPUTLABELS.includes(line.type)).length
    }

    /**
     * renvoie la vue résultat. La calcule au besoin
     * @param {*} userData 
     * @returns {View} la vue résultat
     */
    resultView(userData:Record<string,string>):AnyView {
        if (typeof this._resultView === "undefined") {
            const [view, score] = this._calcResult(userData)
            this._resultView = view
            this._score = score
        }
        return this._resultView
    }

    /**
     * Renvoie le score final
     * le calcule au besoin
     * @param {Record<string,string>} userData 
     * @returns {number} le score final
     */
    resultScore(userData:Record<string,string>):number {
        for (let line of this._lines) {
            if (line.type === 'inputvar' || line.type === 'inputsign') {
                // on doit calculer le score
                if (typeof userData[line.name] === "undefined") {
                    // donnée manquante
                    return 0
                }
            }
        }
        // toutes les données sont présentes
        if (typeof this._score === "undefined") {
            const [view, score] = this._calcResult(userData)
            this._resultView = view
            this._score = score
        }
        return this._score
    }
    
    /**
     * Calcule le score et la vue
     * @param {Record<string,string>} userData 
     */
    protected _calcResult(userData:Record<string,string>):[AnyView,number] {
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
            const newtype:TLineType = line.type === 'inputvar' ? 'var' : 'sign'
            const newLine = {
                type: newtype,
                tag: line.tag,
                hauteur: line.hauteur,
                line: line.type === 'inputvar' ? line.solution : line.line
            }
            // on met de toute façon une ligne pour la correction
            tkzTab.addLine(newLine).setSuccess(true)
            const userValue = userData[line.name] || ''
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
        const resultView = new TkzTabView({
            tkzTab: tkzTab,
            result:true
        })
        return [resultView, count]
    }


}

export default TkzTabBloc;


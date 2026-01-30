import { TabLine, TConfig } from "./tabline"
import createTextForeignObject from "./foreignobject"

class TabHeaderLine extends TabLine {
    static MIN_HAUTEUR = 1
    /**
     * @type {Array} liste des valeurs x
     */
    private _xList:Array<string>

    /**
     * Constructeur de la ligne d'en-tête de tableau
     * @param {Array<string>} xList 
     * @param {string} tag
     * @param {TConfig} config configuration de la ligne
     */
    constructor(xList:Array<string>, tag:string, config:TConfig) {
        super(tag, config.headerHeight, 0, config, -1)
        this._xList = xList
    }

    _renderRight() {
        super._renderRight()
        const d = this._config.espcl // espace entre valeurs, comme dans tkz-tab
        const hl = this.hauteur*this._config.pixelsYUnit // nombre de pixels par unité verticale
        const lgt = this._config.lgt // longueur de la première colonne, comme dans tkz-tab
        const m = this._config.margin
        const x0 = lgt + m // Origine x pour les valeurs du tableau
        const xNumber = this._xList.length

        for (let i = 0; i < xNumber; i++) {
            const x = this._xList[i]
            createTextForeignObject(
                this._svg,
                x0 + d*i - d/2, this._y0,
                d, hl,
                x,
                { color: this._config.color }
            )
        }
    }
}

export default TabHeaderLine
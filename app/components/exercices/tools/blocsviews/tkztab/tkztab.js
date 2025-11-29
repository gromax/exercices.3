import TabHeaderLine from "./header"
import TabVarLine from "./tabvarline"
import TabSignLine from "./tabsignline"

class TkzTab {
    /**
     * Constructeur de la vue tableau de variation
     * @param {Array|string} x_list liste des valeurs x
     * @param {object} config configuration du tableau
     */
    constructor (x_list, config) {
        this._offset = 0 // position du curseur vertical
        const defaultConfig = {
            xtag:"$x$",
            headerHeight:1,
            lgt:100,
            margin:20,
            marginArrow:15,
            espcl:150,
            pixelsYUnit:40,
            color:"#000000"
        }
        this._config = {...defaultConfig, ...config}
        this._xList = typeof x_list === "string"
            ? x_list.split(',').map( x => x.trim() )
            : x_list
        this._config.size = this._xList.length
        this._config.width = this._config.lgt + (this._config.size - 1)*this._config.espcl + 2*this._config.margin
        const x_tag = this._config.xtag
        const header = new TabHeaderLine(this._xList, x_tag, this._config)
        this._offset += header.hauteur
        this._lines = [ header ]
    }

    /**
     * ajoute une ligne de type TabVarLine
     * @param {string|Array} line chaîne décrivant la ligne (ex: "-/2,+/3,R")
     * @param {string} tag tag de la ligne (ex: "f(x)")
     * @param {number} hauteur hauteur de la ligne en nombre d'unités verticales
     * @returns {TkzTab} l'objet courant pour chaînage
     */
    addVarLine (line, tag, hauteur) {
        const tabvarline = new TabVarLine(line, tag, hauteur, this._offset, this._config)
        this._offset += tabvarline.hauteur
        this._lines.push(tabvarline)
        return this;
    }

    /**
     * ajoute une ligne de type TabSignLine
     * @param {string} line chaîne décrivant la ligne (ex: "z,+,z")
     * @param {string} tag tag de la ligne (ex: "f(x)")
     * @param {number} hauteur hauteur de la ligne en nombre d'unités verticales
     * @returns {TkzTab} l'objet courant pour chaînage
     */
    addSignLine (line, tag, hauteur) {
        const tabsignline = new TabSignLine(line, tag, hauteur, this._offset, this._config)
        this._offset += tabsignline.hauteur
        this._lines.push(tabsignline)
        return this;
    }

    render (draw) {
        const lines = this._lines
        const w = this._config.width
        const h = this._offset * this._config.pixelsYUnit
        draw.size(w, h)
        for (let line of lines) {
            line.render(draw)
        }
    }

    get width() {
        return this._config.width
    }

    get height() {
        return this._offset * this._config.pixelsYUnit
    }
}

export default TkzTab
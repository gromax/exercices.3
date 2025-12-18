import createTextForeignObject from "./foreignobject.js";

class TabLine {
    static MIN_HAUTEUR = 1;

    /**
     * @type {object} configuration de la ligne
     */
    _config = null;

    /**
     * @type {string} tag de la ligne (ex: "f(x)")
     */
    _tag = "";

    /**
     * @type {number} hauteur de la ligne en nombre d'unités verticales
     */
    _hauteur;

    /**
     * @type {Array} élément SVG de la ligne
     */
    _svg = null;

    /**
     * @type {JQuery} div contenant le texte de la ligne
     */
    _div = null;

    /**
     * @type {number} décalage vertical de la ligne
     */
    _offset = 0;

    /**
     * Constructeur
     * représente le cadre d'une ligne pour un item de type TabVarLine ou TabSignLine
     * @param {string} tag tag de la ligne (ex: "f(x)")
     * @param {number} hauteur hauteur de la ligne en nombre d'unités verticales, doit être au moins 3
     * @param {number} offset décalage vertical de la ligne
     * @param {object} config configuration de la ligne
     * @param {number} index index de la ligne dans le tableau
     */
    constructor (tag, hauteur, offset, config, index) {
        this._config = {...config} // réalise une copie
        this._index = index
        this._tag = tag
        const minHauteur = this.constructor.MIN_HAUTEUR
        this._hauteur = Math.max(hauteur, minHauteur)
        this._offset = offset
    }

    /**
     * indique que la ligne est un succès
     * @param {boolean} success 
     * @returns {TabLine} l'objet courant pour chaînage
     */
    setSuccess(success) {
        if (success === true) {
            this._config.backgroundColor = "lightgreen"
            this._config.color = "green"
        } else if (success === false) {
            this._config.backgroundColor = "lightcoral"
            this._config.color = "DarkRed"
        }
        return this;
    }

    /**
     * Construit la représentation svg
     * @param {SVG} draw élément SVG de la ligne
     * @param {HTMLElement} divComplement élément HTML complémentaire
     */
    render (draw, divComplement) {
        const backgroundColor = this._config.backgroundColor || "white"
        if (this._svg) this._svg.remove()
        this._y0 = this._offset * this._config.pixelsYUnit
        this._x0 = this._config.lgt + this._config.margin
        this._svg = draw.group()
        const hl = this._hauteur * this._config.pixelsYUnit
        const color = this._config.color
        this._svg
            .rect(this._config.width, hl)
            .attr({x:0, y:this._y0})
            .stroke({ color, 'stroke-width': 2 })
            .fill({ color: backgroundColor })

        this._renderHeader()
        this._renderRight()
    }

    _renderHeader () {
        if (this._divHeader) this._divHeader.remove()
        const backgroundColor = this._config.backgroundColor || "white"
        this._divHeader = $("<div>")
        const hl = this._hauteur * this._config.pixelsYUnit
        const color = this._config.color
        const lgt = this._config.lgt // longueur de la première colonne, comme dans tkz-tab
        this._svg
            .rect(lgt, hl)
            .attr({x:0, y:this._y0})
            .stroke({ color, 'stroke-width': 2 })
            .fill({ color: backgroundColor })


        // Créer un foreignObject pour le texte
        createTextForeignObject(
            this._svg,
            0, this._y0,
            lgt, hl,
            this._tag,
            { color }
        )
    }



    _renderRight() {
        // à redéfinir dans les sous-classes
    }

    get hauteur() {
        return this._hauteur
    }
}

export default TabLine
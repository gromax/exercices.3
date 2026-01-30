import createTextForeignObject from "./foreignobject"
import { Svg, G } from '@svgdotjs/svg.js'

type TConfig = {
    backgroundColor?:string,
    color:string,
    pixelsYUnit:number,
    lgt:number,
    margin:number,
    width:number,
    headerHeight:number,
    espcl:number,
    size:number,
    xtag:string
}

class TabLine {
    static MIN_HAUTEUR:number = 1

    /**
     * @type {TConfig} configuration de la ligne
     */
    protected _config:TConfig

    /**
     * @type {string} tag de la ligne (ex: "f(x)")
     */
    protected _tag:string = ""

    /**
     * @type {number} hauteur de la ligne en nombre d'unités verticales
     */
    protected _hauteur:number

    /**
     * @type {G} élément SVG de la ligne
     */
    protected _svg?:G

    /**
     * @type {JQuery} div contenant le texte de la ligne
     */
    protected _div?:JQuery

    /**
     * @type {JQuery} div contenant l'entête
     */
    protected _divHeader?:JQuery

    /**
     * @type {number} décalage vertical de la ligne
     */
    protected _offset:number = 0

    /**
     * @type {number} numéros d'indice de la ligne
     */
    protected _index:number

    /**
     * @type {number} position x du coin supérieur gauche
     */
    protected _x0?:number

    /**
     * @type {number} position y du coin supérieur gauche
     */
    protected _y0?:number


    /**
     * Constructeur
     * représente le cadre d'une ligne pour un item de type TabVarLine ou TabSignLine
     * @param {string} tag tag de la ligne (ex: "f(x)")
     * @param {number} hauteur hauteur de la ligne en nombre d'unités verticales, doit être au moins 3
     * @param {number} offset décalage vertical de la ligne
     * @param {object} config configuration de la ligne
     * @param {number} index index de la ligne dans le tableau
     */
    constructor (
        tag:string,
        hauteur:number,
        offset:number,
        config:TConfig,
        index:number
    ) {
        this._config = {...config} // réalise une copie
        this._index = index
        this._tag = tag
        const minHauteur = (this.constructor as typeof TabLine).MIN_HAUTEUR
        this._hauteur = Math.max(hauteur, minHauteur)
        this._offset = offset
    }

    /**
     * indique que la ligne est un succès
     * @param {boolean} success 
     * @returns {TabLine} l'objet courant pour chaînage
     */
    setSuccess(success:boolean):TabLine {
        if (success === true) {
            this._config.backgroundColor = "lightgreen"
            this._config.color = "green"
        } else if (success === false) {
            this._config.backgroundColor = "lightcoral"
            this._config.color = "DarkRed"
        }
        return this
    }

    /**
     * Construit la représentation svg
     * @param {Svg} draw élément SVG de la ligne
     * @param {HTMLElement} divComplement élément HTML complémentaire
     */
    render (draw:Svg, divComplement:HTMLElement) {
        const backgroundColor = this._config.backgroundColor || "white"
        if (this._svg) this._svg.remove()
        this._y0 = this._offset * this._config.pixelsYUnit
        this._x0 = this._config.lgt + this._config.margin
        this._svg = draw.group()
        const hl:number = this._hauteur * this._config.pixelsYUnit
        const color:string = this._config.color
        this._svg
            .rect(this._config.width, hl)
            .attr({x:0, y:this._y0})
            .stroke({ color, width: 2 })
            .fill({ color: backgroundColor })

        this._renderHeader()
        this._renderRight()
    }

    private _renderHeader () {
        if (this._divHeader) this._divHeader.remove()
        const backgroundColor = this._config.backgroundColor || "white"
        this._divHeader = $("<div>")
        const hl = this._hauteur * this._config.pixelsYUnit
        const color = this._config.color
        const lgt = this._config.lgt // longueur de la première colonne, comme dans tkz-tab
        this._svg
            .rect(lgt, hl)
            .attr({x:0, y:this._y0})
            .stroke({ color, width: 2 })
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



    protected _renderRight() {
        // à redéfinir dans les sous-classes
    }

    get hauteur():number {
        return this._hauteur
    }
}

export { TabLine, TConfig }
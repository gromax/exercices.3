import { Svg } from '@svgdotjs/svg.js'
import { TConfig } from "./tabline"
import TabSignLine from "./tabsignline"

class TabSignLineInput extends TabSignLine {
    static BUTTON_COLOR = '#ff66ff'
    static BUTTON_SIZE = 30

    protected _name:string
    protected _solution:string

    /**
     * Constructeur de la ligne de signes
     * respecte l'écriture de tkz-tab :
     * @param {string} line texte qui a la forme z,+,z
     * @param {string} tag tag de la ligne (ex: "f(x)")
     * @param {number} offset décalage vertical de la ligne
     * @param {object} config configuration de la ligne
     * @param {number} index index de la ligne dans le tableau
     * @param {string} name nom de l'input
     * @param {string} solution valeur de la solution
     */
    constructor(
        line:string,
        tag:string,
        offset:number,
        config:TConfig,
        index:number,
        name:string
    ) {
        const muteLine = line.replaceAll('-','+')
        super(muteLine, tag, offset, config, index)
        this._name = name
        this._solution = line
    }

    /**
     * Bascule le signe
     * @param {number} xindex 
     */
    toggleItem(xindex:number):void {
        if (xindex < 0 || xindex >= this._tags.length) {
            console.warn(`Invalid xIndex for var line button click: xIndex=${xindex}`)
            return
        }
        const tag = this._tags[xindex]
        const newTag = tag === '+' ? '-' : '+'
        this._tags[xindex] = newTag
    }

    /**
     * trace la ligne et ajoute le champ input
     * @param {Svg} draw élément SVG de la ligne
     * @param {HTMLElement} divComplement élément HTML complémentaire
     */
    render (draw:Svg, divComplement:HTMLElement):void {
        super.render(draw, divComplement)
        this._addInput(divComplement)
    }

    protected _addInput(divComplement:HTMLElement) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = this._name
        input.value = this._tags.join(',')
        divComplement.appendChild(input)
    }

    protected _drawItem(index:number, tag:string, x:number):void {
        // En face d'une zone
        super._drawItem(index, tag, x)
        const hl = this._hauteur * this._config.pixelsYUnit
        const y0 = this._y0 + hl/2
        const svg = this._svg
        svg.circle((this.constructor as typeof TabSignLineInput).BUTTON_SIZE)
            .center(x, y0)
            .stroke({
                color: (this.constructor as typeof TabSignLineInput).BUTTON_COLOR,
                width:1
            })
            .fill({
                color: (this.constructor as typeof TabSignLineInput).BUTTON_COLOR,
                opacity: 0.3
            })
            .addClass('js-signline-button')
            .css('cursor', 'pointer')
            .attr('data-xindex', index)
            .attr('data-lineindex', this._index)
    }
}

export default TabSignLineInput
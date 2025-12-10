import TabSignLine from "./tabsignline"

class TabSignLineInput extends TabSignLine {
    static BUTTON_COLOR = '#ff66ff'
    static BUTTON_SIZE = 30

    /**
     * Constructeur de la ligne de signes
     * respecte l'écriture de tkz-tab :
     * @param {string} line texte qui a la forme z,+,z
     * @param {string} tag tag de la ligne (ex: "f(x)")
     * @param {number} hauteur hauteur de la ligne en nombre d'unités verticales
     * @param {number} offset décalage vertical de la ligne
     * @param {object} config configuration de la ligne
     * @param {number} index index de la ligne dans le tableau
     * @param {string} name nom de l'input
     * @param {string} solution valeur de la solution
     */
    constructor(line, tag, hauteur, offset, config, index, name, solution) {
        super(line, tag, hauteur, offset, config, index)
        this._name = name
        this._solution = solution
        const s = 2 * this._config.size - 1
        if (solution.split(',').length !== s) {
            console.warn(`Invalid solution for sign line input: solution=${solution} and expected size=${s}`)
        }
    }

    /**
     * Bascule le signe
     * @param {number} xindex 
     */
    toggleItem(xindex) {
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
     * @param {SVG} draw élément SVG de la ligne
     * @param {HTMLElement} divComplement élément HTML complémentaire
     */
    render (draw, divComplement) {
        super.render(draw, divComplement)
        this._addInput(divComplement)
    }

    _addInput(divComplement) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = this._name
        input.value = this._tags.join(',')
        divComplement.appendChild(input)
    }

    _renderRight () {
        /* En attente
        for (let item of this._values) {
            item.renderButton(this._hauteur, this._y0, this._svg)
        }
        */
        super._renderRight()
    }

    _drawItem(index, tag, x) {
        // En face d'une zone
        super._drawItem(index, tag, x)
        const hl = this._hauteur * this._config.pixelsYUnit
        const y0 = this._y0 + hl/2
        const svg = this._svg
        svg.circle(this.constructor.BUTTON_SIZE)
            .center(x, y0)
            .stroke({color: this.constructor.BUTTON_COLOR, 'stroke-width':1})
            .fill({color: this.constructor.BUTTON_COLOR, opacity: 0.3})
            .addClass('js-signline-button')
            .css('cursor', 'pointer')
            .attr('data-xindex', index)
            .attr('data-lineindex', this._index)
    }

}

export default TabSignLineInput
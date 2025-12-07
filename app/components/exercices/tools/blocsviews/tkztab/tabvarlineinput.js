import TabVarLine from "./tabvarline"

class TabVarLineInput extends TabVarLine {
    /**
     * Constructeur
     * line est constité d'une chaîne de caractères comme pour tkz-tab
     * de forme -/$12$,+/$y$,...
     * On autorise les formes de tkz-tab :
     * -/val, +/val, R, -D/val, +D/val, D-/val, D+/val, -D-/val/val, -D+/val/val, +D-/val/val, +D+/val/val
     * @param {string|Array} line texte qui a la forme -/val,+/val,R,...
     * @param {string} tag tag de la ligne (ex: "f(x)")
     * @param {number} hauteur hauteur de la ligne en nombre d'unités verticales, doit être au moins 3
     * @param {number} offset décalage vertical de la ligne
     * @param {object} config configuration de la ligne
     * @param {number} index index de la ligne dans le tableau
     * @param {string} name nom de l'input
     * @param {string} solution valeur de la solution
     */
    constructor (line, tag, hauteur, offset, config, index, name, solution) {
        super(line, tag, hauteur, offset, config, index)
        this._name = name
        this._solution = solution
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

    _addInput (divComplement) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = this._name
        input.value = this._items.join(',')
        divComplement.appendChild(input)
    }

    _renderRight () {
        for (let item of this._values) {
            item.renderButton(this._hauteur, this._y0, this._svg)
        }
        super._renderRight()
    }
}

export default TabVarLineInput
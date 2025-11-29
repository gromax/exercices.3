import TabLine from "./tabline.js"
import TabVarItem from "./tabvaritem.js"

class TabVarLine extends TabLine {
    static MIN_HAUTEUR = 3;

    /**
     * @type {Array} liste des items de la ligne
     */
    _values = [];

    /**
     * @type {*} élément DOM des valeurs
     */
    _divRight = null;


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
     */
    constructor (line, tag, hauteur, offset, config) {
        super(tag, hauteur, offset, config)
        const items = typeof line === "string"
            ? line.split(',').map( x => x.trim() )
            : line
        while (items.length < this._config.size) items.push('') // On s'assure une longueur minimum
        while (items.length > this._config.size) items.pop() // On s'assure d'une longueur maximum

        const subItems = _.map(
            items,
            (item, index) => TabVarItem.make(
                    index,
                    item,
                    this._config
                )
            )
        const filtered = subItems.filter( subitem => subitem !== null )
        this._values = _.flatten(filtered)
    }

    _renderRight () {
        for (let item of this._values) {
            item.render(this._hauteur, this._y0,this._svg)
        }
        for (let i=1; i<this._values.length; i++) {
            this._values[i].renderPrevArrow(this._values[i-1], this._svg, this._y0, this._hauteur)
        }
    }

}

export default TabVarLine
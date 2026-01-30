import _ from "underscore"
import { TabLine, TConfig } from "./tabline"
import { TabVarItem } from "./tabvaritem"

class TabVarLine extends TabLine {
    static MIN_HAUTEUR = 1

    /**
     * @type {Array} liste des items de la ligne
     */
    protected _values:Array<TabVarItem>

    protected _items:Array<string>

    /**
     * Constructeur
     * line est constité d'une chaîne de caractères comme pour tkz-tab
     * de forme -/$12$,+/$y$,...
     * On autorise les formes de tkz-tab :
     * -/val, +/val, R, -D/val, +D/val, D-/val, D+/val, -D-/val/val, -D+/val/val, +D-/val/val, +D+/val/val
     * @param {string|Array<string>} line texte qui a la forme -/val,+/val,R,...
     * @param {string} tag tag de la ligne (ex: "f(x)")
     * @param {number} hauteur hauteur de la ligne en nombre d'unités verticales, doit être au moins 3
     * @param {number} offset décalage vertical de la ligne
     * @param {TConfig} config configuration de la ligne
     * @param {number} index index de la ligne dans le tableau
     */
    constructor (
        line:string|Array<string>,
        tag:string,
        hauteur:number,
        offset:number,
        config:TConfig,
        index:number
    ) {
        super(tag, hauteur, offset, config, index)
        const items = typeof line === "string"
            ? line.split(',').map( x => x.trim() )
            : line
        while (items.length < this._config.size) items.push('') // On s'assure une longueur minimum
        while (items.length > this._config.size) items.pop() // On s'assure d'une longueur maximum
        this._values = []
        this._items = items
        this._calcSubItems()
    }

    protected _calcSubItems():void {
        const subItems = _.map(
            this._items,
            (item, index) => TabVarItem.make(
                    index,
                    item,
                    this._config,
                    this._index
                )
            )
        const filtered = subItems.filter( subitem => subitem !== null )
        this._values = _.flatten(filtered)
    }

    protected _renderRight():void {
        for (let item of this._values) {
            item.render(this._hauteur, this._y0, this._svg)
        }
        for (let i=1; i<this._values.length; i++) {
            this._values[i].renderPrevArrow(this._values[i-1], this._svg, this._y0, this._hauteur)
        }
    }

}

export default TabVarLine
import { TabLine, TConfig } from "./tabline"

class TabSignLine extends TabLine {
    static STROKE_WIDTH = 4
    
    /**
     * @type {Array<string>} liste des étiquettes de la ligne : z, d, t, +, -...
     */
    _tags:Array<string>

    /**
     * Constructeur de la ligne de signes
     * respecte l'écriture de tkz-tab :
     * line indique les signes et les zones.
     * Sur les rangs pairs (zones) :  +, -, espace, h = zone interdite, ? = inconnu
     * Sur les rangs impairs (valeurs) : d = double-barre, z = 0, t = pointillé, espace, ? = inconnu
     * @param {string} line texte qui a la forme z,+,z
     * @param {string} tag tag de la ligne (ex: "f(x)")
     * @param {number} offset décalage vertical de la ligne
     * @param {object} config configuration de la ligne
     * @param {number} index index de la ligne dans le tableau
     */
    constructor(
        line:string,
        tag:string,
        offset:number,
        config:TConfig,
        index:number
    ) {
        super(tag, 1, offset, config, index)
        this._tags = typeof line === "string"
            ? line.split(',')
            : []
        const s = 2 * this._config.size - 1
        while (this._tags.length < s) this._tags.push('') // On s'assure une longueur minimum
        while (this._tags.length > s) this._tags.pop() // On s'assure une longueur maximum
    }

    protected _renderRight() {
        const d = this._config.espcl // espace entre valeurs, comme dans tkz-tab
        for (let j=0; j < this._tags.length; j++) {
            const tag = this._tags[j]
            const x = this._x0 + d*j/2
            if (j%2 === 0) {
                // En face de la valeur i
                this._drawVertLines(tag, x)
            } else {
                // En face de la zone i
                this._drawItem(j, tag, x)
            }
        }
    }

    protected _drawVertLines(tag:string, x:number):void {
        const svg = this._svg
        const backgroundColor = this._config.backgroundColor || 'white'
        const hl = this._hauteur * this._config.pixelsYUnit
        const color = this._config.color
        const y0 = this._y0
        switch(tag) {
            case "z":
                // ligne avec zéro
                svg.line(x, y0 ,x, y0 + hl)
                    .stroke({color, width:2})
                svg.circle(15)
                    .attr({stroke: color, fill: backgroundColor, 'stroke-width':2})
                    .center(x, y0 + hl/2)
                return
            case "d":
                // double barre
                svg.line(x-2, y0, x-2, y0 + hl)
                    .stroke({ color, width:1 })
                svg.line(x+2, y0, x+2, y0 + hl)
                    .stroke({ color, width:1 })
                return
            case "t":
                // simple ligne
                svg.line(x, y0, x, y0 + hl)
                    .stroke({color, dasharray:'5 5', width:.5})
        }
    }

    /**
     * Dessine un signe en face d'une zone
     * @param {number} index 
     * @param {string} tag 
     * @param {number} x 
     */
    protected _drawItem(index, tag, x):void {
        // En face d'une zone
        const color = this._config.color
        const hl = this._hauteur * this._config.pixelsYUnit
        const y0 = this._y0 + hl/2
        const svg = this._svg
        if (tag === "+") {
            svg.line(x, y0 - 10, x, y0 + 10).stroke({
                color,
                width:(this.constructor as typeof TabSignLine).STROKE_WIDTH
            })
            svg.line(x - 10, y0 , x + 10, y0).stroke({
                color,
                width:(this.constructor as typeof TabSignLine).STROKE_WIDTH
            })
        } else if (tag === "-") {
            svg.line(x-10, y0, x+10, y0).stroke({
                color,
                width:(this.constructor as typeof TabSignLine).STROKE_WIDTH
            })
        }
    }
}

export default TabSignLine
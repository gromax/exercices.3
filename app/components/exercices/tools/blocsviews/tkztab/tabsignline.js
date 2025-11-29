import TabLine from "./tabline.js"

class TabSignLine extends TabLine {
    /**
     * @type {Array} liste des étiquettes de la ligne : z, d, t, +, -...
     */
    _tags;

    /**
     * Constructeur de la ligne de signes
     * respecte l'écriture de tkz-tab :
     * line indique les signes et les zones.
     * Sur les rangs pairs (zones) :  +, -, espace, h = zone interdite, ? = inconnu
     * Sur les rangs impairs (valeurs) : d = double-barre, z = 0, t = pointillé, espace, ? = inconnu
     * @param {string} line texte qui a la forme z,+,z
     * @param {string} tag tag de la ligne (ex: "f(x)")
     * @param {number} hauteur hauteur de la ligne en nombre d'unités verticales
     * @param {number} offset décalage vertical de la ligne
     * @param {object} config configuration de la ligne
     */
    constructor(line, tag, hauteur, offset, config) {
        super(tag, hauteur, offset, config)
        this._tags = typeof line === "string"
            ? line.split(',')
            : []
        const s = 2 * this._config.size - 1

        while (this._tags.length < s) this._tags.push('') // On s'assure une longueur minimum
        while (this._tags.length > s) this._tags.pop() // On s'assure une longueur maximum
    }

    _renderRight() {
        const d = this._config.espcl // espace entre valeurs, comme dans tkz-tab
        for (let j=0; j < this._tags.length; j++) {
            const tag = this._tags[j]
            const x = this._x0 + d*j/2
            if (j%2 === 0) {
                // En face de la valeur i
                this._drawVertLines(tag, x)
            } else {
                // En face de la zone i
                this._drawItem(tag, x)
            }
        }
    }

    _drawVertLines(tag, x) {
        const svg = this._svg
        const hl = this._hauteur * this._config.pixelsYUnit
        const color = this._config.color
        const y0 = this._y0
        switch(tag) {
            case "z":
                // ligne avec zéro
                svg.line(x, y0 ,x, y0 + hl)
                    .stroke({color, 'stroke-width':2})
                svg.circle(15)
                    .attr({stroke: color, fill: 'white', 'stroke-width':2})
                    .center(x, y0 + hl/2)
                return
            case "d":
                // double barre
                svg.line(x-2, y0, x-2, y0 + hl)
                    .stroke({color, 'stroke-width':1})
                svg.line(x+2, y0, x+2, y0 + hl)
                    .stroke({color, 'stroke-width':1})
                return
            case "t":
                // simple ligne
                svg.line(x, y0, x, y0 + hl)
                    .stroke({color, dasharray:'5 5', 'stroke-width':.5})
        }
    }

    _drawItem(tag, x) {
        // En face d'une zone
        const color = this._config.color
        const hl = this._hauteur * this._config.pixelsYUnit
        const y0 = this._y0 + hl/2
        const svg = this._svg
        if (tag === "+") {
            svg.line(x, y0 - 10, x, y0 + 10).stroke({color, 'stroke-width':2})
            svg.line(x - 10, y0 , x + 10, y0).stroke({color, 'stroke-width':2})
        } else if (tag === "-") {
            svg.line(x-10, y0, x+10, y0).stroke({color, 'stroke-width':2})
        }
    }
}

export default TabSignLine;
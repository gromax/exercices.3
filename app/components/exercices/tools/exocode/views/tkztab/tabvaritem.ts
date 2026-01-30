import { Svg, G } from "@svgdotjs/svg.js"
import { TConfig } from "./tabline"
import createTextForeignObject from "./foreignobject"

type TYPos = "-" | "" | "+" | "D" | "R"
type TXPos = "" | "-" | "+"

class TabVarItem {
    static BUTTON_COLOR = '#ff66ff'
    static BUTTON_SIZE_RATIO = 0.820

    static RATIO = 0.2 // ratio de la taille de la flèche par rapport à la hauteur de la ligne

    private _xIndex:number
    private _xpos:TXPos
    private _ypos:TYPos
    private _tag:string
    private _config:TConfig
    private _lineIndex:number

    /**
     * Constructeur d'un item de TabVar
     * @param {number} xIndex - index de la position en x (0, 1, 2, ...)
     * @param {TXPos} xpos - position horizontale de l'item ("", "+", "-")
     * @param {TYPos} ypos - position verticale de l'item ("+", "-", "R")
     * @param {string} tag - tag de l'item (texte affiché)
     * @param {TConfig} config
     * @param {number} lineIndex
     */
    private constructor (
        xIndex:number,
        xpos:TXPos,
        ypos:TYPos,
        tag:string,
        config:TConfig,
        lineIndex:number
    ) {
        this._xIndex = xIndex
        this._xpos = xpos
        this._ypos = ypos
        this._tag = tag
        this._config = config
        this._lineIndex = lineIndex
    }

    static make(
        index:number,
        tag:string,
        config:TConfig,
        lineIndex:number
    ):TabVarItem|Array<TabVarItem>|null {
        // tag a la forme "+/value" ou encore "-D+/value/value" ou même "+"
        const tabTag = tag.split('/')
        switch(tabTag[0]) {
            case "-":
                return new TabVarItem(index, "", "-", tabTag[1], config, lineIndex)
            case "+":
                return new TabVarItem(index, "", "+", tabTag[1], config, lineIndex)
            case "R":
                return null
            case "-D":
                return [
                    new TabVarItem(index, "-", "-", tabTag[1], config, lineIndex),
                    new TabVarItem(index, "", "D", "", config, lineIndex)
                ]
            case "+D":
                return [
                    new TabVarItem(index, "-", "+", tabTag[1], config, lineIndex),
                    new TabVarItem(index, "", "D", "", config, lineIndex)
                ]
            case "D-":
                return [
                    new TabVarItem(index, "","D", "", config, lineIndex),
                    new TabVarItem(index, "+", "-", tabTag[1], config, lineIndex)
                ]
            case "D+":
                return [
                    new TabVarItem(index, "", "D", tabTag[1], config, lineIndex),
                    new TabVarItem(index, "+", "+", tabTag[1], config, lineIndex)
                ]
            case "-D-":
                return [
                    new TabVarItem(index, "-", "-", tabTag[1], config, lineIndex),
                    new TabVarItem(index, "", "D", "", config, lineIndex),
                    new TabVarItem(index, "+", "-", tabTag[2], config, lineIndex)
                ]
            case "-D+":
                return [
                    new TabVarItem(index, "-", "-", tabTag[1], config, lineIndex),
                    new TabVarItem(index, "", "D", "", config, lineIndex),
                    new TabVarItem(index, "+", "+", tabTag[2], config, lineIndex)
                ]
            case "+D-":
                return [
                    new TabVarItem(index, "-", "+", tabTag[1], config, lineIndex),
                    new TabVarItem(index, "", "D", "", config, lineIndex),
                    new TabVarItem(index, "+", "-", tabTag[2], config, lineIndex)
                ]
            case "+D+":
                return [
                    new TabVarItem(index, "-", "+", tabTag[1], config, lineIndex),
                    new TabVarItem(index, "", "D", "", config, lineIndex),
                    new TabVarItem(index, "+", "+", tabTag[2], config, lineIndex)
                ]
            default:
                return null
        }
    }

    isD() {
        return this._ypos === "D"
    }

    isR() {
        return this._ypos === "R"
    }

    /**
     * construit la représentation svg
     * @param {number} h hauteur de la ligne en unités
     * @param {number} y0 décalage vertical de la ligne
     * @param {SVG|G} svgParent élément SVG parent
     */
    render (h:number, y0:number, svgParent:Svg|G) {
        const d = this._config.espcl
        const m = this._config.margin
        const lgt = this._config.lgt
        const dx = this._xpos === "-"
            ? -d/2 - 5
            : this._xpos === "+" ? d/2 + 5 : 0
        const x = d*this._xIndex + m + lgt + dx
        const hl = h * this._config.pixelsYUnit
        if (this._ypos === "D") {
            // double barre
            svgParent.line(x-2, y0, x-2, y0 + hl)
                .stroke({color: this._config.color, width:1})
            svgParent.line(x+2, y0, x+2, y0 + hl)
                .stroke({color: this._config.color, width:1})
            return
        }


        const xalign = this._xpos === "-"
            ? "flex-end"
            : this._xpos === "+" ? "flex-start" : "center"
        if (this._tag === undefined || this._tag.trim() === "") {
            return
        }
        createTextForeignObject(
            svgParent,
            x - d/2, y0,
            d, hl,
            this._tag,
            {
                color: this._config.color,
                alignItems: this._ypos === "+"
                    ? "flex-start"
                    : "flex-end",
                justifyContent: xalign
            }
        )
        //$(`<div ${xpos}=${x} ${ypos}=${y} class='js-tex'>${this._tag}</div>`).appendTo(divParent)
    }

    /**
     * trace la flèche vers l'item précédent
     * @param {TabVarItem} itemPrev item précédent
     * @param {SVG|G} svgParent élément SVG parent
     * @param {number} y0 décalage vertical de la ligne
     * @param {number} h hauteur de la ligne en unités
     */
    renderPrevArrow(
        itemPrev:TabVarItem,
        svgParent:Svg|G,
        y0:number,
        h:number
    ) {
        if (!itemPrev || itemPrev.isD() || this.isD() || itemPrev.isR() || this.isR()) {
            return
        }
        const color = this._config.color
        const d = this._config.espcl
        const x0 = this._config.lgt + this._config.margin
        const hl = this._config.pixelsYUnit * h
        const xLeft = itemPrev._xpos === "+"
            ? itemPrev._xIndex*d + x0  + 10
            : itemPrev._xIndex*d + x0
        const xRight = this._xpos === "-"
            ? this._xIndex*d + x0 -10
            : this._xIndex*d + x0
        const yleft = itemPrev._ypos === "+"
            ? y0 + 10
            : y0 + hl -10
        const yright = this._ypos === "+"
            ? y0 + 10
            : y0 + hl - 10
        const r = TabVarItem.RATIO
        svgParent.line(
            xLeft + r*(xRight - xLeft),
            yleft + r*(yright - yleft),
            xRight + r*(xLeft - xRight),
            yright + r*(yleft - yright)
        ).stroke({ width:1, color })
            .marker('end', 20, 20, (add) => {
                add.polygon('4,5 4,15 18,10')
                    .fill(color)
                    .stroke({ width: 1, color })
            })
    }

    /**
     * constructruit un bouton svg
     * @param {number} h hauteur de la ligne en unités
     * @param {number} y0 décalage vertical de la ligne
     * @param {Svg|G} svgParent élément SVG parent
     */
    renderButton(
        h:number,
        y0:number,
        svgParent:Svg|G
    ) {
        if (this.isD() || this.isR()) {
            return
        }
        const d = this._config.espcl
        const m = this._config.margin
        const lgt = this._config.lgt
        const size = this._config.pixelsYUnit * TabVarItem.BUTTON_SIZE_RATIO
        const dx = this._xpos === "-"
            ? -size
            : this._xpos === "+" ? size : 0
        const x = d*this._xIndex + m + lgt + dx
        const hl = h * this._config.pixelsYUnit
        const y = this._ypos === "-"
            ? y0 + hl - size
            : y0 + size

        svgParent.circle(size).center(x, y)
            .fill({color: TabVarItem.BUTTON_COLOR, opacity:0.3})
            .addClass('js-varline-button')
            .css('cursor', 'pointer')
            .attr('data-ypos', this._ypos)
            .attr('data-xpos', this._xpos)
            .attr('data-xindex', this._xIndex)
            .attr('data-lineindex', this._lineIndex)
    }

}

export { TabVarItem, TXPos, TYPos }
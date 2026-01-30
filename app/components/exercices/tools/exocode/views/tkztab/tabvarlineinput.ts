import TabVarLine from "./tabvarline"
import { TConfig } from "./tabline"
import { TXPos } from "./tabvaritem"
import { Svg, G } from '@svgdotjs/svg.js'

class TabVarLineInput extends TabVarLine {
    private _name:string
    private _solution:string

    /**
     * compare les positions de deux lignes, sans tenir compte des valeurs
     * @param {string} a 
     * @param {string} b 
     * @returns {boolean} true si les positions sont identiques
     */
    static compare(a:string, b:string):boolean {
        const aTags = a.split(',').map( x => x.trim().split('/')[0] )
        const bTags = b.split(',').map( x => x.trim().split('/')[0] )
        if (aTags.length !== bTags.length) return false
        for (let i=0; i<aTags.length; i++) {
            if (aTags[i] !== bTags[i]) return false
        }
        return true
    }

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
     * @param {string} name nom de l'input
     * @param {string} solution valeur de la solution
     */
    constructor (
        line:string|Array<string>,
        tag:string,
        hauteur:number,
        offset:number,
        config:TConfig,
        index:number,
        name:string,
        solution:string
    ) {
        super(line, tag, hauteur, offset, config, index)
        this._name = name
        this._solution = solution
        const s = this._config.size
        if (solution.split(',').length !== s) {
            console.warn(`Invalid solution for var line input: solution=${solution} and expected size=${s}`)
        }
    }

    /**
     * Bascule la position de l'item d'un tabvar
     * @param {number} xindex 
     * @param {TXPos} xpos 
     */
    togglePosItem(xindex:number, xpos:TXPos):void {
        if (xindex < 0 || xindex >= this._items.length) {
            console.warn(`Invalid xIndex for var line button click: xIndex=${xindex}`)
            return
        }
        const item = this._items[xindex]
        // l'item a potentiellement la forme tag/value/value
        const components = item.split('/')
        const tag = components[0]
        // on lit la position selon xpos
        if ((xpos === '' && tag.length != 1) || (xpos !== '' && tag.length != 3)) {
            console.warn(`Invalid xpos for var line button click: xpos=${xpos} and tag=${tag}`)
            return
        }
        const ypos = xpos === '+'
            ? tag.charAt(2)
            : tag.charAt(0)
        const newYpos = ypos === '+'
            ? '-'
            : '+'
        const newTag = xpos === ''
            ? newYpos
            : xpos === '-'
                ? newYpos + tag.charAt(1) + tag.charAt(2)
                : tag.charAt(0) + tag.charAt(1) + newYpos
        components[0] = newTag
        this._items[xindex] = components.join('/')
        this._calcSubItems()
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

    protected _addInput (divComplement:HTMLElement):void {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = this._name
        input.value = this._items.join(',')
        divComplement.appendChild(input)
    }

    protected _renderRight():void {
        super._renderRight()
        for (let item of this._values) {
            item.renderButton(this._hauteur, this._y0, this._svg)
        }
    }
}

export default TabVarLineInput
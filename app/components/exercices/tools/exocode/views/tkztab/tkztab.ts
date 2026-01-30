import TabHeaderLine from "./header"
import TabVarLine from "./tabvarline"
import TabVarLineInput from "./tabvarlineinput"
import TabSignLine from "./tabsignline"
import TabSignLineInput from "./tabsignlineinput"
import { TConfig } from "./tabline"
import { TXPos } from "./tabvaritem"
import { Svg } from '@svgdotjs/svg.js'


type TLineType = "sign" | "var" | "inputvar" | "inputsign"
type TLineConfig = {
    type:TLineType,
    tag:string,
    hauteur?:number,
    line:string,
    name?:string,
    solution?:string
}
type TLineObject = TabHeaderLine | TabVarLine | TabSignLineInput | TabSignLine | TabSignLineInput

class TkzTab {
    static LINESTYPES = [
        'sign', 'var', 'inputvar', 'inputsign'
    ]
    static INPUTLABELS = ['inputvar', 'inputsign']

    private _offset:number
    private _config:TConfig
    private _xList:Array<string>
    private _lines:Array<TLineObject>

    static parseLine(key:string, value:string):TLineConfig {
        const options = value.split(':').map( x => x.trim() )
        if (key === 'sign' || key === 'inputsign') {
            return TkzTab._parseSign(key, options)
        } else if (key === 'var' || key === 'inputvar') {
            return TkzTab._parseVar(key, options)
        }
        throw new Error(`Type de ligne inconnu : ${key}`)
    }

    private static _parseVar(key:string, options:Array<string>):TLineConfig {
        const goodsize = (key === 'inputvar') ? 5 : 3
        if (options.length !== goodsize) {
            throw new Error(`<${key}:${options.join(':')}/> Le paramètre '${key}' est mal formé.`)
        }
        const tag = options[0]
        const hauteur = parseInt(options[1])
        if (isNaN(hauteur) || hauteur < 1) {
            throw new Error(`<${key}:${options.join(':')}/> La hauteur doit être un entier supérieur ou égal à 1.`)
        }
        const line = options[2]
        if (key === 'inputvar') {
            const name = options[3]
            const solution = options[4]
            return {type: 'inputvar', tag, hauteur, line, name, solution}
        }
        return {type: 'var', tag, hauteur, line}
    }

    private static _parseSign(key:string, options:Array<string>):TLineConfig {
        const goodsize = (key === 'inputsign') ? 3 : 2
        if (options.length !== goodsize) {
            throw new Error(`<${key}:${options.join(':')}/> Le paramètre '${key}' est mal formé.`)
        }
        const tag = options[0]
        const line = options[1]
        if (key === 'inputsign') {
            const name = options[2]
            return {type: 'inputsign', tag, line, name}
        }
        return {type: 'sign', tag, line}
    }

    /**
     * Constructeur de la vue tableau de variation
     * @param {Array<string>|string} x_list liste des valeurs x
     * @param {object} config configuration du tableau
     */
    constructor (
        x_list:string|Array<string>,
        config:TConfig
    ) {
        this._offset = 0 // position du curseur vertical
        const defaultConfig:TConfig = {
            xtag:"$x$",
            headerHeight:1,
            lgt:100,
            margin:20,
            espcl:150,
            pixelsYUnit:40,
            color:"#000000",
            width:0,
            size:0
        }
        this._config = {...defaultConfig, ...config}
        this._xList = typeof x_list === "string"
            ? x_list.split(',').map( x => x.trim() )
            : x_list
        this._config.size = this._xList.length
        this._config.width = this._config.lgt + (this._config.size - 1)*this._config.espcl + 2*this._config.margin

        const x_tag = this._config.xtag
        const header = new TabHeaderLine(this._xList, x_tag, this._config)
        this._offset += header.hauteur
        this._lines = [ header ]
    }

    /**
     * Bascule la position de l'item d'un tabvar
     * @param {number} lineIndex indice de la ligne
     * @param {number} xIndex indice de l'item dans la ligne
     * @param {string} xpos position de l'item '+', '-' ou ''
     */
    togglePosItem(
        lineIndex:number,
        xIndex:number,
        xpos:TXPos
    ):void {
        if (lineIndex < 1 || lineIndex >= this._lines.length) {
            console.warn(`indice de ligne invalide : ${lineIndex}`)
            return
        }
        const line = this._lines[lineIndex]
        if (!(line instanceof TabVarLineInput)) {
            console.warn(`la ligne à l'indice ${lineIndex} n'est pas de type TabVarLineInput`)
            return
        }
        line.togglePosItem(xIndex, xpos)
    }

    /**
     * change le signe d'une ligne de type TabSignLineInput
     * @param {number} lineIndex 
     * @param {number} xIndex 
     * @returns 
     */
    toggleSign(
        lineIndex:number,
        xIndex:number
    ):void {
        if (lineIndex < 1 || lineIndex >= this._lines.length) {
            console.warn(`indice de ligne invalide : ${lineIndex}`)
            return
        }
        const line = this._lines[lineIndex]
        if (!(line instanceof TabSignLineInput)) {
            console.warn(`la ligne à l'indice ${lineIndex} n'est pas de type TabSignLineInput`)
            return
        }
        line.toggleItem(xIndex)
    }

    addLine(line:TLineConfig):TLineObject {
        if (line.type === 'sign') {
            return this.addSignLine(line.line, line.tag)
        } else if (line.type === 'var') {
            return this.addVarLine(line.line, line.tag, line.hauteur)
        } else if (line.type === 'inputvar') {
            return this.addVarLineInput(line.line, line.tag, line.hauteur, line.name, line.solution)
        } else if (line.type === 'inputsign') {
            return this.addSignLineInput(line.line, line.tag, line.name)
        } else {
            console.warn(`Type de ligne inconnu : ${line.type}`)
        }
    }

    addLines(lines:Array<TLineConfig>):void {
        for (let line of lines) {
            this.addLine(line)
        }
    }

    /**
     * ajoute une ligne de type TabVarLine
     * @param {string|Array} line chaîne décrivant la ligne (ex: "-/2,+/3,R")
     * @param {string} tag tag de la ligne (ex: "f(x)")
     * @param {number} hauteur hauteur de la ligne en nombre d'unités verticales
     * @returns {TabVarLine} l'objet créé pour chaînage
     */
    private addVarLine (
        line:string|Array<string>,
        tag:string,
        hauteur:number
    ):TabVarLine {
        const index = this._lines.length
        const tabvarline = new TabVarLine(line, tag, hauteur, this._offset, this._config, index)
        this._offset += tabvarline.hauteur
        this._lines.push(tabvarline)
        return tabvarline
    }

    /**
     * ajoute une ligne de type TabVarLineInput
     * @param {string|Array} line chaîne décrivant la ligne (ex: "-/2,+/3,R")
     * @param {string} tag tag de la ligne (ex: "f(x)")
     * @param {number} hauteur hauteur de la ligne en nombre d'unités verticales
     * @param {string} name nom de l'input
     * @param {string} solution valeur de la solution
     * @returns {TabVarLineInput} l'objet créé pour chaînage
     */
    private addVarLineInput(
        line:string|Array<string>,
        tag:string,
        hauteur:number,
        name:string,
        solution:string
    ):TabVarLineInput {
        const index = this._lines.length
        const tabvarlineInput = new TabVarLineInput(line, tag, hauteur, this._offset, this._config, index, name, solution)
        this._offset += tabvarlineInput.hauteur
        this._lines.push(tabvarlineInput)
        return tabvarlineInput
    }

    /**
     * ajoute une ligne de type TabSignLine
     * @param {string} line chaîne décrivant la ligne (ex: "z,+,z")
     * @param {string} tag tag de la ligne (ex: "f(x)")
     * @returns {TabSignLine} l'objet créé pour chaînage
     */
    private addSignLine (
        line:string,
        tag:string
    ):TabSignLine {
        const index = this._lines.length
        const tabsignline = new TabSignLine(line, tag, this._offset, this._config, index)
        this._offset += tabsignline.hauteur
        this._lines.push(tabsignline)
        return tabsignline
    }

    /**
     * ajoute une ligne de type TabSignLineInput
     * @param {string} line chaîne décrivant la ligne (ex: "z,+,z")
     * @param {string} tag tag de la ligne (ex: "f(x)")
     * @param {string} name nom de l'input
     * @returns {TabSignLineInput} l'objet créé pour chaînage
     */
    private addSignLineInput (
        line:string,
        tag:string,
        name:string,
    ):TabSignLineInput {
        const index = this._lines.length
        const tabsignlineinput = new TabSignLineInput(line, tag, this._offset, this._config, index, name)
        this._offset += tabsignlineinput.hauteur
        this._lines.push(tabsignlineinput)
        return tabsignlineinput
    }

    /**
     * Trace le tableau de variation dans le dessin SVG
     * le complément permet de stocker des éléments HTML (ex: input)
     * @param {Svg} draw 
     * @param {HTMLElement} divComplement 
     */
    render (draw:Svg, divComplement:HTMLElement):void {
        const lines = this._lines
        const w = this._config.width
        const h = this._offset * this._config.pixelsYUnit
        draw.size(w, h)
        for (let line of lines) {
            line.render(draw, divComplement)
        }
    }

    get inputsNumber():number {
        return this._lines.filter( line => (line instanceof TabVarLineInput || line instanceof TabSignLineInput) ).length
    }

    get width():number {
        return this._config.width
    }

    get height():number {
        return this._offset * this._config.pixelsYUnit
    }
}

export default TkzTab
import JXG from 'jsxgraph'
import Bloc from "../bloc"
import Colors from '../../colors'
import MyMath from "@components/exercices/tools/maths/mymath"

abstract class GraphItem {
    protected item:Bloc
    protected _colors?:Colors
    protected _cadre:readonly [number, number, number, number]
    constructor(item:Bloc, cadre:readonly [number, number, number, number], colors:Colors) {
        this.item = item
        this._colors = colors
        this._cadre = cadre
        this._assignColor('strokeColor')
        this._assignColor('color')
    }

    get name():string {
        return this.item.header
    }
    
    abstract createItem(g:JXG.Board, graphObjects:Record<string, JXG.GeometryElement>):JXG.GeometryElement

    /**
     * assume que paramName est un paramètre de type couleur
     * Assigne une couleur à un paramètre donné si celui-ci est défini et est un indice numérique.
     * @param {string} paramName Le nom du paramètre de couleur à assigner.
     */
    protected _assignColor(paramName:string):void {
        if (typeof this.item.params[paramName] !== 'undefined') {
            const color = this.item.params[paramName]
            const i = parseInt(color)
            if (!isNaN(i)) {
                if (!this._colors) {
                    throw new Error(`Colors object is not defined.`)
                }
                this.item.params[paramName] = this._colors.getColor(i)
            }
        }
    }

    /**
     * Analyse une chaîne de caractères représentant une coordonnée.
     * Si la chaîne est un nombre, elle est convertie en nombre.
     * Si la chaîne est une expression, elle est analysée pour déterminer si elle dépend d'autres variables.
     * @param {string} coordString La chaîne de caractères représentant la coordonnée.
     * @returns {number|Function} La valeur numérique de la coordonnée ou une fonction si elle dépend d'une variable.
     */
    protected _parseCoord(coordString:string):number|Function {
        // Un coordonnée peut être un simple nombre
        if (/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?$/.test(coordString)) {
            return Number(coordString.replace(',', '.'))
        }
        // si c'est une expression, il faut savoir si elle dépend d'autre objets
        const n = MyMath.make(coordString)
        const vars = n.variables
        if (vars.length === 0) {
            // pas de dépendance, on évalue directement
            return n.toFloat()
        }
        if ((vars.length === 1) && (vars[0].length === 1)) {
            // fonction simple
            return n.buildFunction()
        }
        return 0
    }
}

export default GraphItem
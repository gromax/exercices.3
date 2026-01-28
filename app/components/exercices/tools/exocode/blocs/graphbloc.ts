import _ from "underscore"
import Bloc from "./bloc.js"
import GraphView from "../views/graphview.js"
import MyMath from "../../maths/mymath.js"
import Colors from "../colors.js"
import { View } from "backbone.marionette"
import JXG from 'jsxgraph'

type AnyView = View<any>|Array<View<any>>

class GraphBloc extends Bloc {
    static readonly LABELS = ['graph', 'graphe']
    private _colors:Colors
    private xmin:number
    private xmax:number
    private ymin:number
    private ymax:number
    private items:Record<string, any>

    /**
     * Définir les couleurs à utiliser
     * @param {Colors} colors 
     */
    setColors(colors:Colors):void {
        this._colors = colors
    }

    protected _getView(answers:Record<string, string>):AnyView {
        this.xmin = this.params.xmin !== undefined ? Number(this.params.xmin) : -5
        this.xmax = this.params.xmax !== undefined ? Number(this.params.xmax) : 5
        this.ymin = this.params.ymin !== undefined ? Number(this.params.ymin) : -5
        this.ymax = this.params.ymax !== undefined ? Number(this.params.ymax) : 5
        this.items = {}
        for (const child of this._children) {
            if (!(child instanceof Bloc)) {
                continue
            }
            const createFunction = this._childToCreateFunction(child)
            if (createFunction !== null) {
                this.items[child.header] = createFunction
            }
        }
        return new GraphView({
            xmin: this.xmin,
            xmax: this.xmax,
            ymin: this.ymin,
            ymax: this.ymax,
            items: this.items
        })
    }

    /**
     * assume que paramName est un paramètre de type couleur
     * @param {Bloc} item 
     * @param {string} paramName
     */
    private _assignColor(item:Bloc, paramName:string):void {
        if (typeof item.params[paramName] !== 'undefined') {
            const color = item.params[paramName]
            const i = parseInt(color)
            if (!isNaN(i)) {
                item.params[paramName] = this._colors.getColor(i)
            }
        }
    }

    private _childToCreateFunction(item:Bloc):Function|null {
        this._assignColor(item, 'strokeColor')
        this._assignColor(item, 'color')
        switch (item.tag) {
            case 'point':
                return this._pointToCeateFunction(item)
            // à compléter avec d'autres types d'éléments graphiques
            case 'function':
                return this._fctToCreateFunction(item)
            default:
                return null
        }
    }

    private _pointToCeateFunction(item:Bloc):Function {
        const x = this._parseCoord(item.params.x || '0')
        const y = this._parseCoord(item.params.y || '0')
        const options = _.pick(item.params, ['name', 'size', 'color', 'fixed'])
        if (item.params.on) {
            // c'est un glider
            const name = item.params.on
            if (!this.items[name]) {
                throw new Error(`L'objet graphique '${name}' n'existe pas.`)
            }
            const f = function(g:JXG.Board, graphObjects:Record<string, any>) {
                return g.create('glider', [x, y, graphObjects[name]], options)
            }
            return f
        }
        const f = function(g:JXG.Board, graphObjects:Record<string, any>) {
            return g.create('point', [x, y], options)
        }
        return f
    }

    private _fctToCreateFunction(item:Bloc):Function {
        const expressionStr = item.params.expression || '0'
        const xmin = item.params.xmin !== undefined ? Number(item.params.xmin) : this.xmin
        const xmax = item.params.xmax !== undefined ? Number(item.params.xmax) : this.xmax
        const options = _.pick(item.params, ['strokeColor', 'strokeWidth', 'dash', 'color'])
        const func = MyMath.buildFunction(expressionStr)
        const f = function(g:JXG.Board, graphObjects:Record<string, any>) {
            return g.create('functiongraph', [func, xmin, xmax], options)
        }
        return f
    }


    private _parseCoord(coordString:string):number|Function {
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

        /*
        La suite me parait trop compliquée pour l'instant


        // il s'agirait de trouver une expression en name.x ou name.y
        const labels = []
        const getters = {}
        const subCoordString = coordString.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\.(x|y)/g, function(match, label, axe) {
            const coord = `${label}_${axe}`
            if (!labels.includes(coord)) {
                labels.push(coord)
                getters[coord] = function(graphObjects) {
                    const obj = graphObjects[label]
                    if (!obj) {
                        throw new Error(`L'objet graphique '${label}' n'existe pas.`)
                    }
                    return axe === 'x' ? obj.X() : obj.Y()
                }
            }
            return coord
        })
        if (labels.length === 0) {
            // pas de dépendance, on évalue directement
            return MyMath.toFloat(coordString)
        }
        // il y a des dépendances, on crée une fonction
        const func = nerdamer(subCoordString).buildFunction(labels)
        return function(graphObjects) {
            const params = {}
        }
        */
    }
}

export default GraphBloc

/* Liste des params qu'il faut envisager

Point
a = board.create('point', [x, y], {name:'A', size:1, color:'red'})
b = board.create('line', [p1, p2])
également 'segment'
var c = board.create('curve', [xarr,yarr])
ou :
  [function(t) {...}, function(t){}, min, max ]
'functiongraph' [function(x) {...}, min, max ]

p.X(), p.Y() accèss to coordinates

function() {...} décide d'une coordonnée

options:
fixed
attractToGrid (attractorDistance, attractorunit)
strokeColor
strokeWidth
dash:val
straightFirst, straightLast [faut il prolonger la ligne]
lastArrow:{type:5} [ajouter une flèche à la fin]
*/
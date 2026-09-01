import _ from "underscore"
import Bloc from "./bloc"
import GraphView from "../views/graphview"
import { View } from "backbone.marionette"
import GraphItem from "./graphitems/item"
import GraphFunction from "./graphitems/function"
import GraphPoint from "./graphitems/point"

type AnyView = View<any>|Array<View<any>>

class GraphBloc extends Bloc {
    static readonly LABELS = ['graph', 'graphe']
    private xmin:number
    private xmax:number
    private ymin:number
    private ymax:number
    private cadre:[number, number, number, number]
    private graphItems:Array<GraphItem>

    protected _getView(answers:Record<string, string>):AnyView {
        this.xmin = this.params.xmin !== undefined ? Number(this.params.xmin) : -5
        this.xmax = this.params.xmax !== undefined ? Number(this.params.xmax) : 5
        this.ymin = this.params.ymin !== undefined ? Number(this.params.ymin) : -5
        this.ymax = this.params.ymax !== undefined ? Number(this.params.ymax) : 5
        this.cadre = [this.xmin, this.xmax, this.ymin, this.ymax]
        this.graphItems = []
        for (const child of this._children) {
            if (!(child instanceof Bloc)) {
                continue
            }
            const graphItem = this._childToGraphItem(child)
            if (graphItem !== null) {
                this.graphItems.push(graphItem)
            }
        }
        return new GraphView({
            xmin: this.xmin,
            xmax: this.xmax,
            ymin: this.ymin,
            ymax: this.ymax,
            items: this.graphItems
        })
    }

    private _childToGraphItem(item:Bloc):GraphItem|null {
        switch (item.tag) {
            case 'point':
                return new GraphPoint(item, this.cadre, this._colors)
            case 'function':
                return new GraphFunction(item, this.cadre, this._colors)
            default:
                return null
        }
    }





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
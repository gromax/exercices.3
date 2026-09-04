import _ from "underscore"
import Bloc from "./bloc"
import GraphView from "../views/graphview"
import { View } from "backbone.marionette"
import GraphItem from "./graphitems/item"
import GraphFunction from "./graphitems/function"
import GraphPoint from "./graphitems/point"
import GraphReels from "./graphitems/reels"
import GraphDroite from "./graphitems/droite"
import FormItemImplementation from "../implementation/formitem"

type AnyView = View<any>|Array<View<any>>

class GraphBloc extends Bloc implements FormItemImplementation {
    static readonly LABELS = ['graph', 'graphe']
    private _cadre:[number, number, number, number]
    private _graphItems:Array<GraphItem>
    private _resultView?:AnyView
    private _score?:number


    protected _getItems():Array<GraphItem> {
        if (this._graphItems !== undefined) {
            return this._graphItems
        }
        this._graphItems = []
        for (const child of this._children) {
            if (!(child instanceof Bloc)) {
                continue
            }
            const graphItem = this._childToGraphItem(child)
            if (graphItem !== null) {
                this._graphItems.push(graphItem)
            }
        }
        return this._graphItems
    }

    protected _getCadre():[number, number, number, number] {
        if (this._cadre === undefined) {
            const xmin = this.params.xmin !== undefined ? Number(this.params.xmin) : -5
            const xmax = this.params.xmax !== undefined ? Number(this.params.xmax) : 5
            const ymin = this.params.ymin !== undefined ? Number(this.params.ymin) : -5
            const ymax = this.params.ymax !== undefined ? Number(this.params.ymax) : 5
            this._cadre = [xmin, xmax, ymin, ymax]
        }
        return this._cadre
    }

    protected _getView(answers:Record<string, string>):AnyView {
        const cadre = this._getCadre()
        return new GraphView({
            xmin: cadre[0],
            xmax: cadre[1],
            ymin: cadre[2],
            ymax: cadre[3],
            items: this._getItems()
        })
    }

    private _childToGraphItem(item:Bloc):GraphItem|null {
        switch (item.tag) {
            case 'point':
                return new GraphPoint(item, this._getCadre(), this._colors)
            case 'function':
                return new GraphFunction(item, this._getCadre(), this._colors)
            case 'reels':
                return new GraphReels(item, this._getCadre(), this._colors)
            case 'droite':
                return new GraphDroite(item, this._getCadre(), this._colors)
            default:
                return null
        }
    }

    /* Implémentation de FormItemImplementation */
    readonly IMPLEMENTATION_FORMITEM = true

    /**
     * renvoie la vue résultat. La calcule au besoin
     * @param {*} userData 
     * @returns {View} la vue résultat
     */
    resultView(userData:Record<string, string>):AnyView {
        if (typeof this._resultView === "undefined") {
            const [view, score] = this._calcResult(userData)
            this._resultView = view
            this._score = score
        }
        return this._resultView
    }

    /**
     * Renvoie le score final
     * le calcule au besoin
     * @param {Record<string,string>} userData 
     * @returns {number} le score final
     */
    resultScore(userData:Record<string, string>):number {
        const names: string[] = this._getItems().flatMap(item => item.inputsNames());
        if (names.filter(name => typeof userData[name] === "undefined").length > 0) {
            // un input demandé n'est pas dans userData
            return 0
        }
        // toutes les données sont présentes
        if (typeof this._score === "undefined") {
            const [view, score] = this._calcResult(userData)
            this._resultView = view
            this._score = score
        }
        return this._score
    }

    /**
     * Calcule le score et la vue
     * @param {Record<string,string>} userData 
     */
    protected _calcResult(userData:Record<string,string>):[AnyView,number] {
        // on va calculer le résultat
        // on commence par assigner les data aux items
        // et à les mettre en mode solution
        for (const item of this._getItems()) {
            item.assignInputsValues(userData)
            item.setSolMode()
        }
        // chaque item va calculer s'il est correct

        let count = 0
        for (const item of this._getItems()) {
            count += item.calcPoint()
        }
        const resultView = this._getView(userData)
        return [resultView, count]
    }

    /**
     * réalise la validation de la saisie
     * renvoi true si ok, message d'erreur sinon
     * si pas d'argument, renvoie le name à valider
     * @param {string|undefined} userValue 
     * @returns {boolean|Array<string>} true si ok, message d'erreur sinon
     */
    validation(userValue?:string|Array<string>):string|Array<string>|boolean|Record<string, string> {
        if (typeof userValue === 'undefined') {
            return this._getItems().flatMap(item => item.inputsNames()).filter(name => name !== '')
        }
        // autrement l'input est forcément valide
        return true
    }

    /**
     * renvoie le nombre de points total
     * c'est le nombre d'item input
     * @returns {number} le nombre de points total
     */
    nombrePts():number {
        return this._getItems().filter(item => item.isInput()).length
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
import JXG from 'jsxgraph'
import GraphItem from "./item"
import _ from "underscore"
import { getNumberOption, getOption, getBooleanOption } from "../../misc"

class GraphVector extends GraphItem {
    static readonly TYPE = 'Vector'
    static readonly KEYWORDS: string[] = ['vector', 'vecteur']
    static readonly AUTHORIZED_PARAMS: string[] = [
        "header", "points", "strokewidth", "strokecolor", "color",
        "solution", "name", "dash", "coords", "start", "fixed", "showsend"
    ]

    public createJXGItem(g:JXG.Board, graphObjects:Record<string, JXG.GeometryElement>):JXG.GeometryElement {
        const points = this._getPoints(graphObjects)
        const strokeColor = getOption(this.item.params, ['strokecolor', 'color'], 'black')
        const strokeWidth = getNumberOption(this.item.params, 'strokewidth', 1)
        const dash = getOption(this.item.params, 'dash', '')

        const fixed = getBooleanOption(this.item.params, 'fixed', false)
        const showsEnd = getBooleanOption(this.item.params, 'showsend', false)
        const options = {
            strokeWidth: strokeWidth,
            strokeColor: strokeColor,
            lastArrow: true
        }

        const _vStart = g.create('point', points[0], {
            name: '',
            visible: false,
            withLabel: false
        });
        
        const _vEnd = g.create('point', points[1], {
            name: '',
            visible: showsEnd,
            fixed: fixed,
            withLabel: false
        });

        if (dash) {
            options['dash'] = dash
        }
        if (fixed) {
            options['fixed'] = true
        }
        if (this.item.params.name) {
            options['name'] = this.item.params.name
            options['withLabel'] = true
        }

        if (getBooleanOption(this.item.params, 'solution', false) && !this._solMode) {
            options["visible"] = false
        }
        const vector = g.create('segment', [_vStart, _vEnd], options) as JXG.Line
        return vector
    }

    /**
     * analyse l'attribut points pour déterminer les coordonnées de deux points du vecteur.
     * @param {Record<string, JXG.GeometryElement>} graphObjects - les objets graphiques existants pour référence
     * @returns {[[number,number]|JXG.Point, [number,number]|JXG.Point]} coordonnées de deux points du vecteur
     */
    protected _getPoints(graphObjects:Record<string, JXG.GeometryElement>): [[number,number], [number,number]] {
        const stringParam = this.item.params.points || this.item.params.coords
        if (typeof stringParam === 'undefined') {
            throw new Error(`Vector ${this.item.header}: le vecteur doit être défini par deux points`)
        }
        const points = stringParam.split('|')
        if ((points.length ==0) || (points.length > 2)) {
            throw new Error(`Vector ${this.item.header}, attribut points ou coords [${stringParam}]: le vecteur doit être défini par 1 paire de coordonnées ou 2 points séparés par '|'`)
        }
        const points2 = points
            .map((p: string) => this._getPoint(graphObjects, p.trim()))
            .map((p: JXG.Point|[number,number]) => {
                if (p instanceof JXG.Point) {
                    return [p.X(), p.Y()]
                }
                return p
            })
        if (points2.length == 1) {
            const startPoint = this._getPoint(
                graphObjects,
                getOption(this.item.params, 'start', "(0;0)")
            )
            const startCoords:[number,number] = startPoint instanceof JXG.Point
                ? [startPoint.X(), startPoint.Y()]
                : startPoint
            const [dx,dy] = points2[0]
            const [x0,y0] = startCoords
            return [startCoords, [x0+dx, y0+dy]]
        }
        return points2
    }
}

export default GraphVector
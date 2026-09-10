import JXG from 'jsxgraph'
import GraphItem from "./item"
import _ from "underscore"
import { getNumberOption, getOption, getBooleanOption } from "../../misc"

class GraphSegment extends GraphItem {
    static readonly TYPE = 'Segment'

    static AUTHORIZED_PARAMS: string[] = [
        "points", "strokewidth", "strokecolor", "color", "fixed", "solution", "name", "dash"
    ]

    public createJXGItem(g:JXG.Board, graphObjects:Record<string, JXG.GeometryElement>):JXG.GeometryElement {
        const points = this._getPoints(graphObjects)
        const strokeColor = getOption(this.item.params, ['strokecolor', 'color'], 'black')
        const strokeWidth = getNumberOption(this.item.params, 'strokewidth', 1)
        const dash = getOption(this.item.params, 'dash', '')

        const fixed = getBooleanOption(this.item.params, 'fixed', false)
        const options = {
            orthoSensivity:true,
            strokeWidth: strokeWidth,
            strokeColor: strokeColor,
            fixed: fixed,
        }
        if (dash) {
            options['dash'] = dash
        }
        if (this.item.params.name) {
            options['name'] = this.item.params.name
            options['withLabel'] = true
        }

        if (getBooleanOption(this.item.params, 'solution', false) && !this._solMode) {
            options["visible"] = false
        }
        const segment = g.create('segment', points, options) as JXG.Line
        return segment
    }

    /**
     * analyse l'attribut points pour déterminer les coordonnées de deux points du segment.
     * @param {Record<string, JXG.GeometryElement>} graphObjects - les objets graphiques existants pour référence
     * @returns {[[number,number]|JXG.Point, [number,number]|JXG.Point]} coordonnées de deux points du segment
     */
    protected _getPoints(graphObjects:Record<string, JXG.GeometryElement>): Array<[number,number]|JXG.Point> {
        const stringPoints = this.item.params.points
        if (typeof stringPoints === 'undefined') {
            throw new Error(`Segment ${this.item.header}: le segment doit être défini par deux points`)
        }
        const points = stringPoints.split('|')
        if (points.length !=2) {
            throw new Error(`Segment ${this.item.header}, attribut points [${stringPoints}]: le segment doit être défini par 2 points séparés par '|'`)
        }
        return points.map((p: string) => this._getPoint(graphObjects, p.trim()))
    }
}

export default GraphSegment
import JXG from 'jsxgraph'
import GraphItem from "./item"
import _ from "underscore"
import { getNumberOption, getOption, getBooleanOption } from "../../misc"

class GraphAngle extends GraphItem {
    _type = 'Angle'
    public createJXGItem(g:JXG.Board, graphObjects:Record<string, JXG.GeometryElement>):JXG.GeometryElement {
        const points = this._getPoints(graphObjects)
        const color = getOption(this.item.params, 'color', 'red')
        const radius = getNumberOption(this.item.params, 'radius', 1)
        const showValue = getBooleanOption(this.item.params, 'showvalue', false)
        const fixed = getBooleanOption(this.item.params, 'fixed', false)
        const options = {
            orthoSensivity:true,
            radius: radius,
            color: color,
            showValue: showValue,
            fixed: fixed,
        }
        if (this.item.params.name) {
            options['name'] = this.item.params.name
            options['withLabel'] = true
        }

        if (this.item.params.solution == "true" && !this._solMode) {
            options["visible"] = false
        }
        const angle = g.create('angle', points, options) as JXG.Angle
        return angle
    }

    /**
     * analyse l'attribut points pour déterminer les coordonnées de trois points de l'angle.
     * @param {Record<string, JXG.GeometryElement>} graphObjects - les objets graphiques existants pour référence
     * @returns {[[number,number]|JXG.Point, [number,number]|JXG.Point, [number,number]|JXG.Point]} coordonnées de trois points de l'angle
     */
    protected _getPoints(graphObjects:Record<string, JXG.GeometryElement>): Array<[number,number]|JXG.Point> {
        const stringPoints = this.item.params.points
        if (typeof stringPoints === 'undefined') {
            throw new Error(`Angle ${this.item.header}: l'angle doit être défini par trois points`)
        }
        const points = stringPoints.split('|')
        if (points.length !=3) {
            throw new Error(`Angle ${this.item.header}, attribut points [${stringPoints}]: l'angle doit être défini par 3 points séparés par '|'`)
        }
        return points.map((p: string) => this._getPoint(graphObjects, p.trim()))
    }
}

export default GraphAngle
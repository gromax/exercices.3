import JXG from 'jsxgraph'
import GraphItem from "./item"
import _ from "underscore"
import { getBooleanOption, getNumberOption, getOption } from "../../misc"

class GraphPolygon extends GraphItem {
    static readonly TYPE = 'Polygon'
    static readonly AUTHORIZED_PARAMS: string[] = [
        'points', 'strokewidth', 'strokecolor', 'color',
        'opacite', 'opacity', 'fixed', 'solution', 'dash',
        'header'
    ]

    public createJXGItem(g:JXG.Board, graphObjects:Record<string, JXG.GeometryElement>):JXG.GeometryElement {
        const points = this._getPoints(graphObjects)
        const strokeWidth:number = getNumberOption(this.item.params, 'strokewidth', 1)
        const strokeColor = this.item.params.strokecolor || this.item.params.color||'black'
        const fillOpacity = getNumberOption(this.item.params, ['opacite', 'opacity'], 50)/100
        const options = {
            vertices: {
                withLabel: false,
                fixed:this.item.params.fixed === "true"
            }
        }
        const dash = getOption(this.item.params, 'dash', '')
        if (strokeWidth !== 0) {
            options['borders'] = {
                strokeColor: strokeColor,
                strokeWidth: strokeWidth
            }
            if (dash) {
                options['borders']['dash'] = dash
            }
            options['withLines'] = true
        } else {
            options['withLines'] = false
        }

        const color = getOption(this.item.params, 'color', '')
        if (!color) {
            options['fillColor'] = 'none'
            options['fillOpacity'] = 0
        } else {
            options['fillColor'] = color
            options['fillOpacity'] = fillOpacity
        }
        if (getBooleanOption(this.item.params, 'solution', false) && !this._solMode) {
            options["visible"] = false
        }
        const polygon = g.create('polygon', points, options) as JXG.Polygon
        return polygon
    }

    /**
     * analyse l'attribut points pour déterminer les coordonnées de deux points du polygone.
     * @param {Record<string, JXG.GeometryElement>} graphObjects - les objets graphiques existants pour référence
     * @returns {[[number,number]|JXG.Point, [number,number]|JXG.Point]} coordonnées de deux points de la droite
     */
    protected _getPoints(graphObjects:Record<string, JXG.GeometryElement>): Array<[number,number]|JXG.Point> {
        const stringPoints = this.item.params.points
        if (typeof stringPoints === 'undefined') {
            throw new Error(`Polygon ${this.item.header}: la polyligne doit être définie par une équation ou deux points`)
        }
        const points = stringPoints.split('|')
        if (points.length < 2) {
            throw new Error(`Polygon ${this.item.header}, attribut points [${stringPoints}]: la polyligne doit avoir au moins deux points séparés par '|'`)
        }
        return points.map((p: string) => this._getPoint(graphObjects, p.trim()))
    }
}

export default GraphPolygon
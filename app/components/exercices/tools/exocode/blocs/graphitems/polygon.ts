import JXG from 'jsxgraph'
import GraphItem from "./item"
import _ from "underscore"
import { getNumberOption } from "../../misc"

class GraphPolygon extends GraphItem {
    _type = 'Polygon'
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
        if (strokeWidth !== 0) {
            options['borders'] = {
                strokeColor: strokeColor,
                strokeWidth: strokeWidth
            }
            options['withLines'] = true
        } else {
            options['withLines'] = false
        }

        if (typeof this.item.params.color == 'undefined') {
            options['fillColor'] = 'none'
            options['fillOpacity'] = 0
        } else {
            options['fillColor'] = this.item.params.color
            options['fillOpacity'] = fillOpacity
        }
        if (this.item.params.solution == "true" && !this._solMode) {
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

    /**
     * helper pour acquérir un point à partir des objets graphiques ou d'une chaîne de coordonnées
     * @param {Record<string, JXG.GeometryElement>} graphObjects - les objets graphiques existants pour référence
     * @param {string} pointName - le nom du point à acquérir
     * @returns {[number, number]|JXG.Point} le point correspondant aux coordonnées ou à l'objet JXG.Point
     */
    protected _getPoint(graphObjects:Record<string, JXG.GeometryElement>, pointName: string): [number, number]|JXG.Point {
        const pt = (graphObjects[pointName] instanceof JXG.Point)
            ? graphObjects[pointName] as JXG.Point
            : this._getXY(pointName)
        return pt
    }

    protected _getXY(coordString: string): [number, number] {
        const result = this._parseFloatCoords(coordString)
        if (result === null) {
            throw new Error(`Polygon ${this.item.header}: Coordonnées invalides: ${coordString}`)
        }
        return result
    }

}

export default GraphPolygon
import JXG from 'jsxgraph'
import GraphItem from "./item"
import _ from "underscore"
import { getStringOption, getBooleanOption, getNumberOption } from '../../misc'

class GraphPolygon extends GraphItem {
    static readonly TYPE = 'Polygon'
    static readonly KEYWORDS: string[] = ['polygon', 'polygone']
    static readonly AUTHORIZED_PARAMS: string[] = [
        'points', 'strokewidth', 'strokecolor', 'color',
        'opacite', 'opacity', 'fixed', 'solution', 'dash',
        'open'
    ]

    public createJXGItem(g:JXG.Board, graphObjects:Record<string, JXG.GeometryElement>):JXG.GeometryElement {
        const open = getBooleanOption(this.params, ['open', 'ouvert'], false)
        const points = this._getPoints(graphObjects)
        const strokeWidth:number = getNumberOption(this.params, 'strokewidth', 1)
        const strokeColor = this.params.strokecolor || this.params.color||'black'
        const fillOpacity = getNumberOption(this.params, ['opacite', 'opacity'], 50)/100
        const options = {
            vertices: {
                withLabel: false,
                fixed:this.params.fixed === "true"
            }
        }
        const dash = getStringOption(this.params, 'dash', '')
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

        const color = getStringOption(this.params, 'color', '')
        if (!color) {
            options['fillColor'] = 'none'
            options['fillOpacity'] = 0
        } else {
            options['hasInnerPoints'] = true
            options['fillColor'] = color
            options['fillOpacity'] = fillOpacity
        }
        if (getBooleanOption(this.params, 'solution', false) && !this._solMode) {
            options["visible"] = false
        }

        const polygon = open
            ? g.create('polygonalchain', points, options) as JXG.PolygonalChain
            : g.create('polygon', points, options) as JXG.Polygon
        if (this._choiceTag) {
            this._attachUniversalPopup(g, polygon, this._choiceTag)
        }
        return polygon
    }

    /**
     * analyse l'attribut points pour déterminer les coordonnées de deux points du polygone.
     * @param {Record<string, JXG.GeometryElement>} graphObjects - les objets graphiques existants pour référence
     * @returns {[[number,number]|JXG.Point, [number,number]|JXG.Point]} coordonnées de deux points de la droite
     */
    protected _getPoints(graphObjects:Record<string, JXG.GeometryElement>): Array<[number,number]|JXG.Point> {
        const stringPoints = getStringOption(this.params, 'points', '')
        if (stringPoints === '') {
            throw new Error(`Polygon ${this._identifiant}: la polyligne doit être définie par une équation ou deux points`)
        }
        const points = stringPoints.split('|')
        if (points.length < 2) {
            throw new Error(`Polygon ${this._identifiant}, attribut points [${stringPoints}]: la polyligne doit avoir au moins deux points séparés par '|'`)
        }
        return points.map((p: string) => this._getPoint(graphObjects, p.trim()))
    }
}

export default GraphPolygon
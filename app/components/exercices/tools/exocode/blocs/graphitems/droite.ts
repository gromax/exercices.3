import JXG from 'jsxgraph'
import GraphItem from "./item"
import _ from "underscore"
import MyMath from "../../../maths/mymath"
import { getBooleanOption, getNumberOption, getStringOption } from "../../misc"
class GraphDroite extends GraphItem {
    static readonly TYPE = 'Droite'
    static readonly KEYWORDS: string[] = ['droite', 'line']
    static readonly AUTHORIZED_PARAMS: string[] = [
        'color', 'strokewidth', 'dash', 'invisible', 'solution',
        'label', 'labelsize', 'equation', 'points', 'fixed'
    ]
    public createJXGItem(g:JXG.Board, graphObjects:Record<string, JXG.GeometryElement>):JXG.GeometryElement {
        const param_equation = getStringOption(this.params, 'equation', '')
        const points = (param_equation !== '')
            ? this._points_from_equation(param_equation)
            : this._points_from_points(graphObjects)
        const dash = getStringOption(this.params, 'dash', '')
        const label = getStringOption(this.params, 'label', '')
        const options = {}
        if (dash) {
            options['dash'] = dash
        }
        options['strokeColor'] = getStringOption(this.params, ['color', 'strokecolor'], 'black')
        options['strokeWidth'] = getNumberOption(this.params, 'strokewidth', 1)

        const labelSize = this.params.labelsize || 14 // taille par défaut des labels
        if (this.params.invisible == "true" || this.params.solution == "true" && !this._solMode) {
            options["visible"] = false
        }
        if (label) {
            options["withLabel"] = true
            options["label"] = {
                strokeColor: this.params.color || 'black',
                autoPosition: true,
                fontSize: labelSize
            }
        }
        const fixed = typeof this.params.fixed !== 'undefined'
            ? getBooleanOption(this.params, 'fixed', false)
            : null
        if (fixed || typeof this.params.equation !== 'undefined') {
            options["fixed"] = true // autrement JXG permet le déplacement
        }
        const line = g.create('line', points, options) as JXG.Line
        if (label) {
            line.label.setText(label)
        }
        if (this._choiceTag) {
            this._attachUniversalPopup(g, line, this._choiceTag)
        }
        return line
    }
    /**
     * Calcule les coordonnées de deux points de la droite à partir de son équation.
     * @param {string} equation 
     * @returns {[[number,number], [number,number]]} coordonnées de deux points de la droite
     */
    protected _points_from_equation(equation:string): [[number,number], [number,number]] {
        if (!equation.includes('=')) {
            throw new Error(`[${equation}]: L'équation doit contenir '='`)
        }
        const parts = equation.split('=')
        if (parts.length !== 2) {
            throw new Error(`[${equation}]: L'équation doit avoir deux membres '...=...'`)
        }
        const left = parts[0].trim()
        const right = parts[1].trim()
        const stringExpression = `(${left})-(${right})`
        const expression = MyMath.make(stringExpression)
        const variables = expression.variables
        if (variables.length === 0) {
            throw new Error(`[${equation}]: L'équation doit contenir au moins une variable`)
        }
        for (const variable of variables) {
            if (variable !== 'x' && variable !== 'y') {
                throw new Error(`[${equation}]:Variable non autorisée: ${variable}`)
            }
        }
        // recherche des coeffs
        const aM = expression.diff('x')
        if (aM.variables.length > 0) {
            throw new Error(`[${equation}]: L'équation devrait être affine en x`)
        }
        const bM = expression.diff('y')
        if (bM.variables.length > 0) {
            throw new Error(`[${equation}]: L'équation devrait être affine en y`)
        }
        const a = aM.toFloat()
        const b = bM.toFloat()
        const c = expression.subs({x:0, y:0}).toFloat()
        if (a === 0 && b === 0) {
            throw new Error(`[${equation}]: les coefficients a et b ne peuvent être simultanément nuls`)
        }
        if (b === 0) {
            return [[-c/a, 0], [-c/a, 1]]
        } else {
            return [[0, -c/b], [1, (-c-a)/b]]
        }
    }

    /**
     * analyse l'attribut points pour déterminer les coordonnées de deux points de la droite.
     * @param {Record<string, JXG.GeometryElement>} graphObjects - les objets graphiques existants pour référence
     * @returns {[[number,number]|JXG.Point, [number,number]|JXG.Point]} coordonnées de deux points de la droite
     */
    protected _points_from_points(graphObjects:Record<string, JXG.GeometryElement>): [[number,number]|JXG.Point, [number,number]|JXG.Point] {
        const stringPoints = getStringOption(this.params, 'points', '')
        if (stringPoints === '') {
            throw new Error(`Droite ${this._identifiant}: la droite doit être définie par une équation ou deux points`)
        }
        const points = stringPoints.split('|')
        if (points.length !== 2) {
            throw new Error(`Droite ${this._identifiant}, attribut points [${stringPoints}]: la droite doit être définie par deux points séparés par '|'`)
        }
        return points.map((p: string) => this._getPoint(graphObjects, p.trim())) as [[number,number]|JXG.Point, [number,number]|JXG.Point]
    }
}

export default GraphDroite
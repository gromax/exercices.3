import JXG from 'jsxgraph'
import GraphItem from "./item"
import _ from "underscore"
import { getOption, getBooleanOption } from '../../misc'

class GraphIntegrale extends GraphItem {
    static readonly TYPE = 'Integrale'
    static AUTHORIZED_PARAMS = [
        'color', 'hidelabel', 'fixleft', 'fixright', 'fixed',
        'solution', 'abscisses', 'fct', 'header'
    ]
    public createJXGItem(g:JXG.Board, graphObjects:Record<string, JXG.GeometryElement>):JXG.GeometryElement {
        const abscisses = this._getAbscisses()
        const fctName = getOption(this.item.params, 'fct', '')
        if (!fctName) {
            throw new Error(`Intégrale ${this.item.header}: la fonction doit être définie dans un objet intégrale (paramètres fct)`)
        }
        if (typeof graphObjects[fctName] === 'undefined') {
            throw new Error(`Intégrale ${this.item.header}: la fonction ${fctName} n'existe pas dans les objets graphiques`)
        }
        if (!(graphObjects[fctName] instanceof JXG.Curve)) {
            throw new Error(`Intégrale ${this.item.header}: l'objet ${fctName} n'est pas une fonction graphique`)
        }
        const fctObject = graphObjects[fctName] as JXG.Curve
        const options = {
            "color": getOption(this.item.params, 'color', 'red')
        }
        // label donnant la valeur de l'intégrale : masqué sauf si label="true"
        if (getBooleanOption(this.item.params, 'hidelabel', false)) {
            options["withLabel"] = false
        }
        // points de construction de l'intégrale : on les masque et on les fixe
        const hiddenPoint = { visible: false, fixed: true, name: '' }
        options["baseLeft"] = hiddenPoint
        options["baseRight"] = hiddenPoint
        const fixed = getBooleanOption(this.item.params, 'fixed', false)
        if (getBooleanOption(this.item.params, 'fixleft', false) || fixed) {
            options["curveLeft"] = hiddenPoint
        }
        if (getBooleanOption(this.item.params, 'fixright', false) || fixed) {
            options["curveRight"] = hiddenPoint
        }
        if (getBooleanOption(this.item.params, 'solution', false) && !this._solMode) {
            options["visible"] = false
        }
        const object = g.create('integral', [abscisses, fctObject], options) as JXG.Line
        return object
    }

    /**
     * analyse l'attribut points pour déterminer les coordonnées de deux points de la droite.
     * @returns {[number,number]} abscisses de début et fin de l'intégrale
     */
    protected _getAbscisses(): [number, number] {
        if (typeof this.item.params.abscisses === 'undefined') {
            return [this._cadre[0], this._cadre[1]]
        }
        const param = this.item.params.abscisses
        const stringItems = param.split('|')
        if (stringItems.length !== 2) {
            throw new Error(`Intégrale ${this.item.header}, les abscisses doivent être séparées par '|'`)
        }
        return [this._getX(stringItems[0].trim()), this._getX(stringItems[1].trim())]
    }

    protected _getX(coordString: string): number {
        const x = parseFloat(coordString)
        if (isNaN(x)) {
            throw new Error(`Intégrale ${this.item.header}: Coordonnée invalide: ${coordString}`)
        }
        return x
    }

}

export default GraphIntegrale
import JXG from 'jsxgraph'
import GraphItem from "./item"
import _ from "underscore"
import { getStringOption, getBooleanOption } from '../../misc'

class GraphIntegrale extends GraphItem {
    static readonly TYPE = 'Integrale'
    static readonly KEYWORDS: string[] = ['integrale', 'integral']
    static readonly AUTHORIZED_PARAMS = [
        'color', 'hidelabel', 'fixleft', 'fixright', 'fixed',
        'solution', 'abscisses', 'fct', 'header'
    ]
    public createJXGItem(g:JXG.Board, graphObjects:Record<string, JXG.GeometryElement>):JXG.GeometryElement {
        const abscisses = this._getAbscisses()
        const fctName = getStringOption(this.params, 'fct', '')
        if (!fctName) {
            throw new Error(`Intégrale ${this.header}: la fonction doit être définie dans un objet intégrale (paramètres fct)`)
        }
        if (typeof graphObjects[fctName] === 'undefined') {
            throw new Error(`Intégrale ${this.header}: la fonction ${fctName} n'existe pas dans les objets graphiques`)
        }
        if (!(graphObjects[fctName] instanceof JXG.Curve)) {
            throw new Error(`Intégrale ${this.header}: l'objet ${fctName} n'est pas une fonction graphique`)
        }
        const fctObject = graphObjects[fctName] as JXG.Curve
        const options = {
            "color": getStringOption(this.params, 'color', 'red')
        }
        // label donnant la valeur de l'intégrale : masqué sauf si label="true"
        if (getBooleanOption(this.params, 'hidelabel', false)) {
            options["withLabel"] = false
        }
        // points de construction de l'intégrale : on les masque et on les fixe
        const hiddenPoint = { visible: false, fixed: true, name: '' }
        options["baseLeft"] = hiddenPoint
        options["baseRight"] = hiddenPoint
        const fixed = getBooleanOption(this.params, 'fixed', false)
        if (getBooleanOption(this.params, 'fixleft', false) || fixed) {
            options["curveLeft"] = hiddenPoint
        }
        if (getBooleanOption(this.params, 'fixright', false) || fixed) {
            options["curveRight"] = hiddenPoint
        }
        if (getBooleanOption(this.params, 'solution', false) && !this._solMode) {
            options["visible"] = false
        }
        const object = g.create('integral', [abscisses, fctObject], options) as JXG.Line
        if (this._choiceTag) {
            this._attachUniversalPopup(g, object, this._choiceTag)
        }
        return object
    }

    /**
     * analyse l'attribut points pour déterminer les coordonnées de deux points de la droite.
     * @returns {[number,number]} abscisses de début et fin de l'intégrale
     */
    protected _getAbscisses(): [number, number] {
        const abscissesStr = getStringOption(this.params, 'abscisses', '')
        if (abscissesStr === '') {
            return [this._cadre[0], this._cadre[1]]
        }
        const stringItems = abscissesStr.split('|')
        if (stringItems.length !== 2) {
            throw new Error(`Intégrale ${this.header}, les abscisses doivent être séparées par '|'`)
        }
        return [this._getX(stringItems[0].trim()), this._getX(stringItems[1].trim())]
    }

    protected _getX(coordString: string): number {
        const x = parseFloat(coordString)
        if (isNaN(x)) {
            throw new Error(`Intégrale ${this.header}: Coordonnée invalide: ${coordString}`)
        }
        return x
    }

}

export default GraphIntegrale
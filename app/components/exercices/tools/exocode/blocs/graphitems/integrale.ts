import JXG from 'jsxgraph'
import GraphItem from "./item"
import _ from "underscore"

class GraphIntegrale extends GraphItem {
    _type = 'Function'
    public createJXGItem(g:JXG.Board, graphObjects:Record<string, JXG.GeometryElement>):JXG.GeometryElement {
        const abscisses = this._getAbscisses()
        if (typeof this.item.params.fct === 'undefined') {
            throw new Error(`Intégrale ${this.item.header}: la fonction doit être définie dans un objet intégrale (paramètres fct)`)
        }
        const fctName = this.item.params.fct
        if (typeof graphObjects[fctName] === 'undefined') {
            throw new Error(`Intégrale ${this.item.header}: la fonction ${fctName} n'existe pas dans les objets graphiques`)
        }
        if (!(graphObjects[fctName] instanceof JXG.Curve)) {
            throw new Error(`Intégrale ${this.item.header}: l'objet ${fctName} n'est pas une fonction graphique`)
        }
        const fctObject = graphObjects[fctName] as JXG.Curve
        const options = _.pick(this.item.params, ['color'])
        // label donnant la valeur de l'intégrale : masqué sauf si label="true"
        if (this.item.params.hidelabel == "true") {
            options["withLabel"] = false
        }
        // points de construction de l'intégrale : on les masque et on les fixe
        const hiddenPoint = { visible: false, fixed: true, name: '' }
        options["baseLeft"] = hiddenPoint
        options["baseRight"] = hiddenPoint
        if (this.item.params.fixleft == "true" || this.item.params.fixed == "true") {
            options["curveLeft"] = hiddenPoint
        }
        if (this.item.params.fixright == "true" || this.item.params.fixed == "true") {
            options["curveRight"] = hiddenPoint
        }

        
        if (this.item.params.solution == "true" && !this._solMode) {
            options["visible"] = false
        }
        const object = g.create('integral', [[abscisses[0], abscisses[1]], fctObject], options) as JXG.Line
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
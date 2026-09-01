import GraphItem from "./item"
import JXG from 'jsxgraph'
import _ from "underscore"

class GraphPoint extends GraphItem {
    public createItem(g:JXG.Board, graphObjects:Record<string, any>):JXG.GeometryElement {
        const x = this._parseCoord(this.item.params.x || '0')
        const y = this._parseCoord(this.item.params.y || '0')
        const options = _.pick(this.item.params, ['name', 'size', 'color', 'fixed'])
        if (this.item.params.on) {
            // c'est un glider
            const name = this.item.params.on
            if (!graphObjects[name]) {
                throw new Error(`L'objet graphique '${name}' n'existe pas.`)
            }
            return g.create('glider', [x, y, graphObjects[name]], options)
        }
        return g.create('point', [x, y], options)
    }
}

export default GraphPoint
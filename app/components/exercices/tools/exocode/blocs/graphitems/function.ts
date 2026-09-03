import JXG from 'jsxgraph'
import GraphItem from "./item"
import MyMath from "../../../maths/mymath"
import _ from "underscore"

class GraphFunction extends GraphItem {
    _type = 'Function'
    public createJXGItem(g:JXG.Board, graphObjects:Record<string, JXG.GeometryElement>):JXG.GeometryElement {
        const expressionStr = this.item.params.expression || '0'
        const xmin = this.item.params.xmin !== undefined ? Number(this.item.params.xmin) : this._cadre[0]
        const xmax = this.item.params.xmax !== undefined ? Number(this.item.params.xmax) : this._cadre[1]
        const options = _.pick(this.item.params, ['strokeColor', 'strokeWidth', 'dash', 'color'])
        if (this.item.params.solution == "true" && !this._solMode) {
            options["visible"] = false
        }
        const func = MyMath.buildFunction(expressionStr)
        return g.create('functiongraph', [func, xmin, xmax], options)
    }
}

export default GraphFunction
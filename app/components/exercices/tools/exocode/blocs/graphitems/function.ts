import JXG from 'jsxgraph'
import GraphItem from "./item"
import MyMath from "../../../maths/mymath"
import _ from "underscore"

import { getNumberOption, getOption, getBooleanOption } from "../../misc"

class GraphFunction extends GraphItem {
    static readonly TYPE = 'Function'
    static readonly KEYWORDS: string[] = ['function', 'fonction']
    static readonly AUTHORIZED_PARAMS = [
        'strokecolor', 'strokewidth', 'dash', 'expression',
        'xmin', 'xmax', 'solution', 'header', 'color'
    ]
    public createJXGItem(g:JXG.Board, graphObjects:Record<string, JXG.GeometryElement>):JXG.GeometryElement {
        const expressionStr = getOption(this.item.params, 'expression', '0')
        const xmin = getNumberOption(this.item.params, 'xmin', this._cadre[0])
        const xmax = getNumberOption(this.item.params, 'xmax', this._cadre[1])
        const dash = getOption(this.item.params, 'dash', '')
        const options = {
            'strokeWidth': getNumberOption(this.item.params, 'strokewidth', 1),
            'strokeColor': getOption(this.item.params, ['strokecolor', 'color'], 'black')
        }
        if (dash) {
            options['dash'] = dash
        }
        if (getBooleanOption(this.item.params, 'solution', false) && !this._solMode) {
            options["visible"] = false
        }
        const func = MyMath.buildFunction(expressionStr)
        return g.create('functiongraph', [func, xmin, xmax], options)
    }
}

export default GraphFunction
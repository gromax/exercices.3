import JXG from 'jsxgraph'
import GraphItem from "./item"
import MyMath from "../../../maths/mymath"
import _ from "underscore"

import { getNumberOption, getStringOption, getBooleanOption } from "../../misc"

class GraphFunction extends GraphItem {
    static readonly TYPE = 'Function'
    static readonly KEYWORDS: string[] = ['function', 'fonction']
    static readonly AUTHORIZED_PARAMS = [
        'strokecolor', 'strokewidth', 'dash', 'expression',
        'xmin', 'xmax', 'solution', 'header', 'color'
    ]
    public createJXGItem(g:JXG.Board, graphObjects:Record<string, JXG.GeometryElement>):JXG.GeometryElement {
        const expressionStr = getStringOption(this.params, 'expression', '0')
        const xmin = getNumberOption(this.params, 'xmin', this._cadre[0])
        const xmax = getNumberOption(this.params, 'xmax', this._cadre[1])
        const dash = getStringOption(this.params, 'dash', '')
        const options = {
            'strokeWidth': getNumberOption(this.params, 'strokewidth', 1),
            'strokeColor': getStringOption(this.params, ['strokecolor', 'color'], 'black')
        }
        if (dash) {
            options['dash'] = dash
        }
        if (getBooleanOption(this.params, 'solution', false) && !this._solMode) {
            options["visible"] = false
        }
        const func = MyMath.buildFunction(expressionStr)
        const f = g.create('functiongraph', [func, xmin, xmax], options)
        if (this._choiceTag) {
            this._attachUniversalPopup(g, f as JXG.GeometryElement, this._choiceTag)
        }
        return f as JXG.GeometryElement
    }
}

export default GraphFunction
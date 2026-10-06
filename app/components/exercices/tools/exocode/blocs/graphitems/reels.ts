import JXG from 'jsxgraph'
import GraphItem from "./item"
import _ from "underscore"
import { getNumberOption, getStringOption } from "../../misc"

class GraphReels extends GraphItem {
    static readonly TYPE = 'Réels'

    static readonly KEYWORDS: string[] = ['réels', 'reels', 'reals']
    static readonly AUTHORIZED_PARAMS: string[] = [
        'y', 'color', 'titlesize', 'ticksize', 'majorheight',
        'minorheight', 'minorticks', 'strokewidth'
    ]

    public createJXGItem(g:JXG.Board, graphObjects:Record<string, JXG.GeometryElement>):JXG.GeometryElement {
        const y = getNumberOption(this.params, 'y', 0)
        const color = getStringOption(this.params, 'color', 'black')
        const titleSize = getNumberOption(this.params, 'titlesize', 20)
        const tickSize = getNumberOption(this.params, 'ticksize', 12)
        const majorHeight = getNumberOption(this.params, 'majorheight', 10)
        const minorHeight = getNumberOption(this.params, 'minorheight', 5)
        const minorTicks = getNumberOption(this.params, 'minorticks', 4)
        const strokeWidth = getNumberOption(this.params, 'strokewidth', 1)
        
        const options = {
            withLabel: true,
            lastArrow:true,
            strokeColor: color,
            strokeWidth: strokeWidth,
            ticks: {
                drawLabels: true,
                majorHeight: majorHeight,
                minorHeight: minorHeight,
                minorTicks: minorTicks,
                drawZero: true,  // ← force l'affichage du 0
                strokeColor: color,
                label: {
                    offset: [0,-tickSize],
                    fontSize: tickSize,
                    color: color
                }
            },
            label: {
                position: "rt",
                offset: [-10,titleSize-10],
                fontSize: titleSize,
                color: color
            }

        }

        const axe = g.create('axis', [[0, y], [1, y]], options) as JXG.Axis
        axe.label.setText("ℝ")
        if (this._choiceTag) {
            this._attachUniversalPopup(g, axe, this._choiceTag)
        }
        return axe
    }
}

export default GraphReels
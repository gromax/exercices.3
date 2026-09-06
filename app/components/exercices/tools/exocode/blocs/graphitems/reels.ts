import JXG from 'jsxgraph'
import GraphItem from "./item"
import _ from "underscore"
import { getNumberOption, getOption } from "../../misc"

class GraphReels extends GraphItem {
    _type = 'Function'
    public createJXGItem(g:JXG.Board, graphObjects:Record<string, JXG.GeometryElement>):JXG.GeometryElement {
        const y = getNumberOption(this.item.params, 'y', 0)
        const color = getOption(this.item.params, 'color', 'black')
        const titleSize = getNumberOption(this.item.params, 'titlesize', 20)
        const tickSize = getNumberOption(this.item.params, 'ticksize', 12)
        const majorHeight = getNumberOption(this.item.params, 'majorheight', 10)
        const minorHeight = getNumberOption(this.item.params, 'minorheight', 5)
        const minorTicks = getNumberOption(this.item.params, 'minorticks', 4)
        const strokeWidth = getNumberOption(this.item.params, 'strokewidth', 1)
        
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
        return axe
    }
}

export default GraphReels
import JXG from 'jsxgraph'
import GraphItem from "./item"
import _ from "underscore"

class GraphReels extends GraphItem {
    _type = 'Function'
    public createJXGItem(g:JXG.Board, graphObjects:Record<string, JXG.GeometryElement>):JXG.GeometryElement {
        const y = this.item.params.y !== undefined ? Number(this.item.params.y) : 0
        const color = this.item.params.color || 'black'
        const titleSize = this.item.params.titlesize || 20
        const tickSize = this.item.params.ticksize || 12
        const options = {
            withLabel: true,
            lastArrow:true,
            strokeColor: color,
            ticks: {
                drawLabels: true,
                majorHeight: 10,
                minorHeight: 5,
                minorTicks: 4,
                strokeColor: color,
                label: {
                    position: "rt",
                    offset: [0,-10],
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
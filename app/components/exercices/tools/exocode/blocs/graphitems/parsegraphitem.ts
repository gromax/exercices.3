import type { GraphItemBloc } from "./graphitembloc"
import type Color from "../../colors"
import GraphItem from "./item"
import GraphFunction from "./function"
import GraphPoint from "./point"
import GraphReels from "./reels"
import GraphDroite from "./droite"
import GraphIntegrale from "./integrale"
import GraphPolygon from "./polygon"
import GraphAngle from "./angle"
import GraphSegment from "./segment"
import GraphVector from "./vector"

const GRAPHS_CLASS = [
    GraphPoint,
    GraphFunction,
    GraphReels,
    GraphDroite,
    GraphIntegrale,
    GraphPolygon,
    GraphAngle,
    GraphSegment,
    GraphVector
]


function childToGraphItem(item:GraphItemBloc, cadre:[number, number, number, number], colors:Color):GraphItem {
    for (const classe of GRAPHS_CLASS) {
        if (classe.KEYWORDS.includes(item.tag)) {
            return new classe(item, cadre, colors)
        }
    }
    throw new Error(`Unknown graph item type: ${item.tag}`)
}

const GRAPHS_KEYWORDS = GRAPHS_CLASS.flatMap(classe => classe.KEYWORDS)

export { childToGraphItem, GRAPHS_KEYWORDS }

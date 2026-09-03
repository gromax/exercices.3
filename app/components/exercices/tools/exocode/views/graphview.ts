import { View } from 'backbone.marionette'
import graph_tpl from '@templates/exercices/run/exercice-graph.jst'
import * as JXG from "jsxgraph"
import GraphItem from "../blocs/graphitems/item"
import GraphPoint from "../blocs/graphitems/point"

type GraphOptions = {
    boundingbox:[number,number,number,number],
    axis:boolean,
    showCopyright:boolean,
    showNavigation?:boolean,
    pan?:{ enabled:boolean },
    zoom?:{
        enabled:boolean,
        wheel:boolean
    }
}

const GraphView = View.extend({
    template: graph_tpl,
    items:null, // tableau de items graphiques
    onRender() {
        const container = this.el.querySelector('.js-jsx')
        const xmin = this.getOption("xmin") || -5
        const xmax = this.getOption("xmax") || 5
        const ymin = this.getOption("ymin") || -5
        const ymax = this.getOption("ymax") || 5
        const axis = typeof this.getOption("axis") !== "undefined"
            ? Boolean(this.getOption("axis"))
            : true
        const zoom = typeof this.getOption("zoom") !== "undefined"
            ? Boolean(this.getOption("zoom"))
            : false
        const pan = typeof this.getOption("pan") !== "undefined"
            ? Boolean(this.getOption("pan"))
            : false
        const options:GraphOptions = {
            boundingbox: [xmin, ymax, xmax, ymin],
            axis: axis,
            showCopyright: false
        }
        if (!pan) {
            options.pan = {
                enabled:false,
            }
            options.showNavigation = false
        }
        if (!zoom) {
            options.zoom = {
                enabled:false,
                wheel: false,
            }
        }
        const graph = JXG.JSXGraph.initBoard(container, options)
        const graphObjects: Record<string, JXG.GeometryElement> = {}
        const items = this.getOption("items") || []
        for (const graphItem of items) {
            if (!(graphItem instanceof GraphItem)) {
                console.warn("GraphView: item non valide", graphItem)
                continue
            }
            const createdItem = graphItem.createJXGItem(graph, graphObjects)
            if (createdItem instanceof JXG.GeometryElement) {
                graphObjects[graphItem.name] = createdItem
            } else {
                for (const [key, value] of Object.entries(createdItem)) {
                    graphObjects[key] = value
                }
            }
        }
        // On refait un passage pour les distincts
        for (const graphItem of items) {
            if (!(graphItem instanceof GraphPoint)) {
                continue
            }
            graphItem.setDistinct(graphObjects)
        }


        this.graphObjects = graphObjects
        // ajout des inputs
        const divComplement = this.el.querySelector('.js-complement')
        for (const graphItem of items) {
            if (!(graphItem instanceof GraphItem)) {
                continue
            }
            const inputNodes = graphItem.inputNodesNeeded(this.graphObjects[graphItem.name])
            for (const [inputName, value] of Object.entries(inputNodes)) {
                const inputElement = document.createElement("input")
                inputElement.type = "hidden"
                inputElement.name = inputName
                inputElement.value = value
                divComplement?.appendChild(inputElement)
            }
        }

    },

    

    children(name:string):any|undefined {
        if (!this.graphObjects) {
            return undefined
        }
        return this.graphObjects[name]
    }
})

export default GraphView
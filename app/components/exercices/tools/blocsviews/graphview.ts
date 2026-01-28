import { View } from 'backbone.marionette';
import graph_tpl from '@templates/exercices/run/exercice-graph.jst';
const JXG = require('jsxgraph');

const GraphView = View.extend({
  template: graph_tpl,
  items:null, // tableau de fonction de création recevant graph comme paramètre
              // et les objets déjà créés
  onRender() {
    const container = this.el.querySelector('.js-jsx');
    const xmin = this.getOption("xmin") || -5;
    const xmax = this.getOption("xmax") || 5;
    const ymin = this.getOption("ymin") || -5;
    const ymax = this.getOption("ymax") || 5;
    const axis = typeof this.getOption("axis") !== "undefined"
      ? Boolean(this.getOption("axis"))
      : true;
    const zoom = typeof this.getOption("zoom") !== "undefined"
      ? Boolean(this.getOption("zoom"))
      : false;
    const pan = typeof this.getOption("pan") !== "undefined"
      ? Boolean(this.getOption("pan"))
      : false;
    const options = {
      boundingbox: [xmin, ymax, xmax, ymin],
      axis: axis,
      showCopyright: false
    };
    if (!pan) {
      options.pan = {
        enabled:false,
      };
      options.showNavigation = false;
    }
    if (!zoom) {
      options.zoom = {
        enabled:false,
        wheel: false,
      };
    }
    const graph = JXG.JSXGraph.initBoard(container, options);
    const graphObjects = {};
    for (const key in this.getOption("items") || {}) {
      const item = this.getOption("items")[key];
      if (typeof item !== 'function' || item.length !== 2) {
        console.warn("GraphView: item non valide", item);
        continue;
      }
      graphObjects[key] = item(graph, graphObjects);
    }
    this.graphObjects = graphObjects;
  },

  children(name) {
    if (!this.graphObjects) {
      return undefined;
    }
    return this.graphObjects[name];
  }
});

export default GraphView;
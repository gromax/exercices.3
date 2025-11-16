import { View } from 'backbone.marionette';
import graph_tpl from '@templates/exercices/run/exercice-graph.jst';
const JXG = require('jsxgraph');

const GraphView = View.extend({
  template: graph_tpl,
  onRender() {
    const container = this.el.querySelector('.js-content');
    const xmin = this.getOption("xmin") || -5;
    const xmax = this.getOption("xmax") || 5;
    const ymin = this.getOption("ymin") || -5;
    const ymax = this.getOption("ymax") || 5;
    const graph = JXG.JSXGraph.initBoard(container, {
      boundingbox: [xmin, ymax, xmax, ymin],
      axis: true
    });

    for (const element of this.getOption("elements") || []) {
      if (element.type == "function") {
        graph.create("functiongraph", [
          element.function,
          element.xmin || xmin,
          element.xmax || xmax
        ], element.options || {});
      }
    }
  }
});

export default GraphView;
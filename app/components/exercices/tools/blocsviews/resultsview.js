import { View } from 'backbone.marionette';
import exercice_results_tpl from '@templates/exercices/run/exercice-results.jst';
import { def } from 'jsxgraph';

const ResultsView = View.extend({
  template: exercice_results_tpl,
  templateContext() {
    return {
      items: this.getOption("items")
    };
  }
});

export default ResultsView;

import { View } from 'backbone.marionette';
import results_tpl from '@templates/exercices/bloc/results.jst';

const ResultsView = View.extend({
  template: results_tpl,
});

export default ResultsView;

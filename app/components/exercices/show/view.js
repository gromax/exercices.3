import { View } from 'backbone.marionette'
import show_item_tpl from '@templates/exercices/show/show-exercice.jst'

const ShowExerciceView = View.extend({
  template: show_item_tpl,
});

export { ShowExerciceView }
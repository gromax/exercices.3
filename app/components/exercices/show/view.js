import { View } from 'backbone.marionette'
import show_item_tpl from '@templates/exercices/show/show-exercice.jst'

const ShowExerciceView = View.extend({
  template: show_item_tpl,
  templateContext() {
    return {
      showId: this.options.showId || false,
      showModButton: this.options.showModButton || false
    }
  },
  regions: {
    exercice: ".js-exercice",
  }
});

export { ShowExerciceView }
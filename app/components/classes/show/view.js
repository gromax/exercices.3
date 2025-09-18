import { View } from 'backbone.marionette'
import show_item_tpl from 'templates/classes/show/show-classe.jst'

const ShowClasseView = View.extend({
  template: show_item_tpl,
  events: {
    "click a.js-edit": "editClicked"
  },
  editClicked(e) {
    e.preventDefault();
    this.trigger("classe:edit", this.model);
  }
});

export { ShowClasseView }

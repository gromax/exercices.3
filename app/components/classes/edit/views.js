import { View } from 'backbone.marionette'
import { SubmitClicked, EditItem } from '../../behaviors.js'
import edit_tpl from '@templates/classes/edit/classe-form-edit.jst'
import fill_tpl from '@templates/classes/list/classe-fill-form.jst'

const EditClasseView = View.extend({
  template: edit_tpl,
  behaviors: [SubmitClicked, EditItem],
  title: "Modification de la classe",
  templateContext() {
    return {
      title: this.getOption('title')
    }
  }
});

const FillClasseView = View.extend({
  template: fill_tpl,
  behaviors: [
    SubmitClicked,
    {
      behaviorClass: EditItem,
      updatingFunctionName: "fill"
    }
  ],
  initialize: function() {
    this.title = "Nouvelle classe pour " + this.getOption('nomProf');
  }

});

export { EditClasseView, FillClasseView }
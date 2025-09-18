import { View } from 'backbone.marionette'
import { SubmitClicked, EditItem } from '../../behaviors.js'
import edit_tpl from '@templates/classes/common/classe-form.jst'
import new_tpl from '@templates/classes/common/classe-form.jst'
import fill_tpl from '@templates/classes/list/classe-fill-form.jst'

const EditClasseView = View.extend({
  template: edit_tpl,
  behaviors: [SubmitClicked, EditItem],
  title: "Modification de la classe",

  onRender: function() {
    // en attente
  }
});

const NewClasseView = View.extend({
  title: "Nouvelle classe",
  template: new_tpl,
  behaviors: [SubmitClicked, EditItem]
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

export { EditClasseView, NewClasseView, FillClasseView }

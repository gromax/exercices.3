import { View } from 'backbone.marionette'
import { Modal } from 'bootstrap'
import { SubmitClicked, EditItem } from '../../behaviors.js'
import edit_tpl from '@templates/classes/edit/classe-form-edit.jst'
import edit_modal_tpl from '@templates/classes/edit/classe-form-edit-modal.jst'
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

const NewClasseView = View.extend({
  template: edit_modal_tpl,
  isModal: true,
  behaviors: [SubmitClicked, EditItem],
  onRender() {
    const modalEl = this.el.querySelector('.modal');
    if (modalEl) {
      const modal = new Modal(modalEl);
      modal.show();
    } else {
      console.warn("Aucun élément .modal trouvé dans la vue !");
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

export { EditClasseView, NewClasseView, FillClasseView }

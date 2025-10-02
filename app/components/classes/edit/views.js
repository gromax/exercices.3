import { View } from 'backbone.marionette'
import { Form } from '../../behaviors.js'
import edit_tpl from '@templates/classes/edit/classe-form-edit.jst'

const EditClasseView = View.extend({
  template: edit_tpl,
  behaviors: [Form],
  title: "Modification de la classe",
  templateContext() {
    return {
      title: this.getOption('title')
    }
  }
});

export { EditClasseView }
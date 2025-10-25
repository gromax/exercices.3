import { View } from 'backbone.marionette'
import { Form } from '../../behaviors.js'
import edit_tpl from '@templates/devoirs/edit/devoir-form-edit.jst'

const EditDevoirView = View.extend({
  template: edit_tpl,
  behaviors: [Form],
  templateContext() {
    return {
      title: this.getOption("title"),
      classes: this.getOption("classes"),
    };
  }
});

export { EditDevoirView }

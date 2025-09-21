import { View } from 'backbone.marionette';
import { Modal } from 'bootstrap';
import { SubmitClicked, EditItem } from '../../behaviors.js';

import edit_user_modal_tpl from '@templates/users/edit/user-form-modal.jst'

const NewUserView = View.extend ({
  title: "Nouvel Utilisateur",
  showPWD: true,
  showPref: true,
  ranks: 1,
  editorIsAdmin: true,
  template: edit_user_modal_tpl,
  behaviors: [SubmitClicked, EditItem],
  templateContext() {
    return {
      showPWD: this.getOption("showPWD"),
      showPref: this.getOption("showPref"),
      ranks: this.getOption("ranks"),
      editorIsAdmin: this.getOption("editorIsAdmin"),
      title: this.getOption("title")
    };
  },

  onRender() {
    const modalEl = this.el.querySelector('.modal');
    const modal = new Modal(modalEl);
    modal.show();
  }

});

export { NewUserView };
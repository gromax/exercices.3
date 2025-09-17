import { Modal } from 'bootstrap';
import { View } from 'backbone.marionette';
import { SubmitClicked, EditItem } from '../../behaviors.js';
import edit_user_tpl from '@templates/users/edit/user-form.jst'
import edit_user_tpl_modal from '@templates/users/edit/user-form-modal.jst'
import edit_pwd_user_tpl from '@templates/users/edit/userpwd-form.jst'


const EditUserView = View.extend ({
  showPref: true,
  showPWD: false,
  ranks: false,
  editorIsAdmin: false,
  getTemplate() {
    if (this.getOption("isModal")) {
      return edit_user_tpl_modal;
    } else {
      return edit_user_tpl;
    }
  },
  behaviors: [SubmitClicked, EditItem],
  initialize () {
    this.title = `Modifier ${this.model.get('prenom')} ${this.model.get('nom')}`;
  },
  templateContext() {
    return {
      title: this.title,
      showPWD: this.getOption("showPWD"),
      showPref: this.getOption("showPref"),
      ranks: this.getOption("ranks"),
      editorIsAdmin: this.getOption("editorIsAdmin")
    };
  },
  onRender() {
    if (this.getOption("isModal")) {
      const modalEl = this.el.querySelector('.modal');
      const modal = new Modal(modalEl);
      modal.show();
    }
  }
});

const EditPwdUserView = View.extend ({
  template: edit_pwd_user_tpl,
  behaviors: [SubmitClicked, EditItem],
  title: "Modifier le mot de passe",
  generateTitle: false,
  onRender() {
    if (this.getOption("generateTitle")) {
      const $title = $("<h1>", { text: this.title });
      this.$el.prepend($title);
    }
  }
});



export { EditUserView, EditPwdUserView }

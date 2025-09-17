import { Modal } from 'bootstrap';
import { View } from 'backbone.marionette';
import { SubmitClicked, EditItem } from '../../behaviors.js';
import edit_user_tpl from '@templates/users/edit/user-form.jst'
import edit_user_tpl_modal from '@templates/users/edit/user-form-modal.jst'
import edit_pwd_user_tpl from '@templates/users/edit/userpwd-form.jst'
import edit_pwd_user_tpl_modal from '@templates/users/edit/userpwd-form-modal.jst'

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
  behaviors: [SubmitClicked, EditItem],
  title: "Modifier le mot de passe",
  templateContext() {
    return {
      title: this.title
    };
  },
  getTemplate() {
    if (this.getOption("isModal")) {
      return edit_pwd_user_tpl_modal;
    } else {
      return edit_pwd_user_tpl;
    }
  },
  onRender() {
    if (this.getOption("isModal")) {
      const modalEl = this.el.querySelector('.modal');
      const modal = new Modal(modalEl);
      modal.show();
    }
  }
});



export { EditUserView, EditPwdUserView }

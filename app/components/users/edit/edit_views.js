import { View } from 'backbone.marionette';
import { SubmitClicked, EditItem } from '../../behaviors.js';
import edit_user_tpl from '@templates/users/edit/user-form.jst'
import edit_pwd_user_tpl from '@templates/users/edit/userpwd-form.jst'

const EditUserView = View.extend ({
  showPref: true,
  showPWD: false,
  ranks: false,
  editorIsAdmin: false,
  template: edit_user_tpl,
  behaviors: [SubmitClicked, EditItem],
  initialize () {
    this.title = `Modifier ${this.model.get('prenom')} ${this.model.get('nom')}`;
  },
  templateContext() {
    return {
      title: this.getOption("title"),
      showPWD: this.getOption("showPWD"),
      showPref: this.getOption("showPref"),
      ranks: this.getOption("ranks"),
      editorIsAdmin: this.getOption("editorIsAdmin")
    };
  },
});

const EditPwdUserView = View.extend ({
  behaviors: [SubmitClicked, EditItem],
  title: "Modifier le mot de passe",
  templateContext() {
    return {
      title: this.getOption("title")
    };
  },
  template: edit_pwd_user_tpl
});



export { EditUserView, EditPwdUserView }

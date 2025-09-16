import { View } from 'backbone.marionette';
import { SubmitClicked, EditItem } from '@apps/common/behaviors.js';

import edit_user_tpl from '@templates/users/edit/user-form.jst'
import edit_pwd_user_tpl from '@templates/users/edit/userpwd-form.jst'


const EditUserView = View.extend ({
  showPref: true,
  showPWD: false,
  ranks: false,
  editorIsAdmin: false,
  generateTitle: false,
  template: edit_user_tpl,
  behaviors: [SubmitClicked, EditItem],
  initialize () {
    this.title = `Modifier ${this.model.get('prenom')} ${this.model.get('nom')}`;
  },
  templateContext() {
    return {
      showPWD: this.getOption("showPWD"),
      showPref: this.getOption("showPref"),
      ranks: this.getOption("ranks"),
      editorIsAdmin: this.getOption("editorIsAdmin")
    };
  },
  onRender() {
    if (this.getOption("generateTitle")) {
      const $title = $("<h1>", { text: this.title });
      this.$el.prepend($title);
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



export { EditUserView, EditPwdUserView, NewUserView }

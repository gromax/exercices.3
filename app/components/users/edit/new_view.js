import { View } from 'backbone.marionette';
import { SubmitClicked, EditItem } from '@apps/common/behaviors.js';

import edit_user_tpl from '@templates/users/edit/user-form.jst'

const NewUserView = View.extend ({
  title: "Nouvel Utilisateur",
  showPWD: true,
  showPref: true,
  ranks: 1,
  editorIsAdmin: true,
  template: edit_user_tpl,
  behaviors: [SubmitClicked, EditItem],
  templateContext() {
    return {
      showPWD: this.getOption("showPWD"),
      showPref: this.getOption("showPref"),
      ranks: this.getOption("ranks"),
      editorIsAdmin: this.getOption("editorIsAdmin")
    };
  }
});

export { NewUserView };
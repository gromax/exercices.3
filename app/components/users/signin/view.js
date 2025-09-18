import { View } from 'backbone.marionette'
import { SubmitClicked, EditItem } from '../../behaviors.js'

import signin_tpl from '@templates/users/signin/signin-form.jst'
//import signin_tpl from '@templates/classes/show/userpwd-form.jst'

const SigninView = View.extend ({
  title: "Rejoindre une classe",
  template: signin_tpl,
  errorCode: "026",
  behaviors: [SubmitClicked, EditItem],
  initialize() {
    this.title = `Rejoindre la classe ${this.model.get("nomClasse")}`;
  },
  templateContext() {
    return {
      showPWD: true,
      showPref: false,
      ranks: false,
      editorIsAdmin: false
    };
  }
});

export { SigninView }
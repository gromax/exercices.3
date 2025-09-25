import { View } from 'backbone.marionette';
import { Form } from '../../behaviors.js';

import edit_user_tpl from '@templates/users/edit/user-form.jst'
import signin_classe_tpl from '@templates/users/edit/user-classe-signin.jst'
import change_classe_tpl from '@templates/users/edit/eleve-classe-change.jst'

const NewUserView = View.extend ({
  title: "Nouvel Utilisateur",
  showPWD: true,
  showPref: true,
  ranks: 1,
  editorIsAdmin: true,
  template: edit_user_tpl,
  behaviors: [Form],
  templateContext() {
    return {
      showPWD: this.getOption("showPWD"),
      showPref: this.getOption("showPref"),
      ranks: this.getOption("ranks"),
      editorIsAdmin: this.getOption("editorIsAdmin"),
      title: this.getOption("title")
    };
  },
});

const ClasseSignin = View.extend ({
  template: signin_classe_tpl,
  behaviors: [Form],
  templateContext() {
    const classe = this.getOption("classe");
    if (classe) {
      return {
        title: `Rejoindre la classe ${classe.get("nom")}`,
        description: classe.get("description")
      };
    }
    return {
      title: "Rejoindre une classe"
    };
  },
});

const ClasseChange = View.extend ({
  template: change_classe_tpl,
  behaviors: [Form],
  templateContext() {
    const classe = this.getOption("classe");
    if (classe) {
      return {
        title: `Rejoindre la classe ${classe.get("nom")}`,
        description: classe.get("description")
      };
    }
    return {
      title: "Changer de classe"
    };
  },
});

export { NewUserView, ClasseSignin, ClasseChange };
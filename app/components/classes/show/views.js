import { View } from 'backbone.marionette'
import show_item_tpl from '@templates/classes/show/show-classe.jst'
import test_mdp_classe_tpl from '@templates/classes/show/test-mdp-classe-form.jst'
import no_classe_tpl from '@templates/classes/show/signin-no-classe.jst'
import classe_item_tpl from '@templates/classes/show/signin-classe-item.jst'

//import signin_tpl from '@templates/classes/show/userpwd-form.jst'

const ShowClasseView = View.extend({
  template: show_item_tpl,
  events: {
    "click a.js-edit": "editClicked"
  },
  editClicked(e) {
    e.preventDefault();
    this.trigger("classe:edit", this.model);
  }
});

const TestMdpView = View.extend ({
  template: test_mdp_classe_tpl,
  behaviors: [SubmitClicked],
  initialize() { 
    this.title = `Rejoindre la classe ${this.model.get("nomClasse")}`;
  }
});

const SigninNoClasseView = View.extend ({
  template: no_classe_tpl
});

const SigninClasseItemView = View.extend({
  template: classe_item_tpl,
  tagName: "a",
  className: "list-group-item list-group-item-action js-join",
  triggers: {
    "click": "join"
  }
});

const SigninClassesCollectionView = CollectionView.extend({
  tagName: "div",
  className: "list-group",
  childView: SigninClasseItemView,
  emptyView: SigninNoClasseView,
  childViewEventPrefix: "item"
});


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





export { ShowClasseView, TestMdpView, SigninView, SigninClassesCollectionView }

import { View, CollectionView } from 'backbone.marionette'
import { SubmitClicked, EditItem } from 'apps/common/behaviors.coffee'
import test_mdp_tpl from 'templates/users/signin/test-mdp-form.tpl'
import signin_tpl from 'templates/users/edit/userpwd-form.tpl'
import no_classe_tpl from 'templates/users/signin/signin-no-classe.tpl'
import classe_item_tpl from 'templates/users/signin/signin-classe-item.tpl'


const TestMdpView = View.extend ({
  template: test_mdp_tpl,
  behaviors: [SubmitClicked],
  initialize() { 
    this.title = `Rejoindre la classe ${this.model.get("nomClasse")}`;
  }
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


export { TestMdpView, SigninView, SigninClassesCollectionView }

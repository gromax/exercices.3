import { View } from 'backbone.marionette'
import test_mdp_classe_tpl from '@templates/classes/signin/test-mdp-classe-form.jst'
import no_classe_tpl from '@templates/classes/signin/signin-no-classe.jst'
import classe_item_tpl from '@templates/classes/signin/signin-classe-item.jst'

const ClasseMotdepasseVerifyView = View.extend ({
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

export { ClasseMotdepasseVerifyView, SigninClassesCollectionView }

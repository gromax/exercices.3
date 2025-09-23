import { View, CollectionView } from 'backbone.marionette'
import no_classe_tpl from '@templates/classes/signin/signin-no-classe.jst'
import classe_item_tpl from '@templates/classes/signin/signin-classe-item.jst'

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

export { SigninClassesCollectionView }

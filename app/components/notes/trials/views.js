import { View, CollectionView } from 'backbone.marionette'

import item_tpl from 'templates/notes/trials/item.jst'
import noitem_tpl from 'templates/notes/trials/noitem.jst'


const NoItemView = View.extend({
  template: noitem_tpl,
  tagName: "a",
  className: "list-group-item"
});

const ItemView = View.extend({
  tagName: "a",
  className() {
    if (!this.model.get('finished')) {
      return "list-group-item list-group-item-warning";
    }
    return "list-group-item";
  },
  template: item_tpl,
  triggers: {
    "click": "trial:show"
  },
});

const TrialsCollectionView = CollectionView.extend({
  className: "list-group",
  emptyView: NoItemView,
  childView: ItemView,
  childViewEventPrefix: "item",
});

export { TrialsCollectionView }
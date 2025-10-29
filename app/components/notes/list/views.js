import { View, CollectionView } from 'backbone.marionette'
import { SortList } from '../../behaviors.js'
import no_item_tpl from '@templates/notes/list/noitem.jst'
import item_tpl from '@templates/notes/list/item.jst'
import list_tpl from '@templates/notes/list/list.jst'

const NoItemView = View.extend({
  template: no_item_tpl,
  tagName: "tr",
  className: "alert",
  templateContext() {
    return {
      ncols: this.getOption("ncols") || 1
    };
  }
});

const ItemView = View.extend({
  tagName: "tr",
  template: item_tpl,
  templateContext() {
    return {
      showId: this.getOption("showId"),
      showUser: this.getOption("showUser"),
      showDevoir: this.getOption("showDevoir"),
      showNomOwner: this.getOption("showNomOwner"),
      showTimeLeft: this.getOption("showTimeLeft")
    };
  }
});

const NotesCollectionView = CollectionView.extend({
  tagName: 'table',
  className: "table table-hover",
  template: list_tpl,
  childView: ItemView,
  emptyView: NoItemView,
  behaviors: [SortList],
  childViewEventPrefix: "item",
  childViewContainer: "tbody",

  templateContext() {
    return {
      ncols: this.getOption("ncols") || 1,
      showUser: this.getOption("showUser")||false,
      showDevoir: this.getOption("showDevoir")||false,
      showNomOwner: this.getOption("showNomOwner")||false,
      showTimeLeft: this.getOption("showTimeLeft")||false
    };
  },

  childViewOptions(model) {
    return {
      ncols: this.getOption("ncols") || 1,
      showUser: this.getOption("showUser")||false,
      showDevoir: this.getOption("showDevoir")||false,
      showNomOwner: this.getOption("showNomOwner")||false,
      showTimeLeft: this.getOption("showTimeLeft")||false
    };
  }
});


export { NotesCollectionView };
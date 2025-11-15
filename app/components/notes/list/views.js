import { View, CollectionView } from 'backbone.marionette'
import { SortList } from '../../behaviors.js'
import no_item_tpl from '@templates/notes/list/noitem.jst'
import item_tpl from '@templates/notes/list/item.jst'
import list_tpl from '@templates/notes/list/list.jst'
import item_for_eleve_tpl from '@templates/notes/list/item-for-eleve.jst'
import no_item_for_eleve_tpl from '@templates/notes/list/noitem-for-eleve.jst'

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

const NoItemForEleveView = View.extend({
  template: no_item_for_eleve_tpl,
  tagName: "div",
  className: "alert alert-info"
});


const ItemView = View.extend({
  tagName: "tr",
  template: item_tpl,
  triggers: {
    "click": "show"
  },
  templateContext() {
    return {
      showUser: this.getOption("showUser"),
      showDevoir: this.getOption("showDevoir"),
      showNomOwner: this.getOption("showNomOwner"),
      showTimeLeft: this.getOption("showTimeLeft")
    };
  }
});

const ItemViewForEleve = View.extend({
  tagName: "a",
  template: item_for_eleve_tpl,
  triggers: {
    "click": "show"
  },
  className() {
    if (this.model.get('notEnded')) {
      // en cours
      return "list-group-item";
    }
    // terminé
    return "list-group-item list-group-item-danger";
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

const NotesCollectionViewForEleve = CollectionView.extend({
  tagName: "div",
  className: "list-group",
  childView: ItemViewForEleve,
  emptyView: NoItemForEleveView,
  childViewEventPrefix: "item",
});



export { NotesCollectionView, NotesCollectionViewForEleve };
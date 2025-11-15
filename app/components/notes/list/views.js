import { View, CollectionView } from 'backbone.marionette'
import { SortList } from '../../behaviors.js'
import no_item_tpl from '@templates/notes/list/noitem.jst'
import item_tpl from '@templates/notes/list/item.jst'
import list_tpl from '@templates/notes/list/list.jst'
import item_for_eleve_tpl from '@templates/notes/list/item-for-eleve.jst'
import no_item_for_eleve_tpl from '@templates/notes/list/noitem-for-eleve.jst'
import panel_devoir_tpl from '@templates/notes/list/panel-devoir.jst'

const PanelDevoirView = View.extend({
  template: panel_devoir_tpl,
  templateContext() {
    return {
      showOwner: this.getOption('showOwner') || false,
    };
  }
});

const NoItemView = View.extend({
  template: no_item_tpl,
  tagName: "tr",
  className: "alert",
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
  className: "table table-hover table-striped",
  template: list_tpl,
  childView: ItemView,
  emptyView: NoItemView,
  behaviors: [SortList],
  childViewEventPrefix: "item",
  childViewContainer: "tbody",
});

const NotesCollectionViewForEleve = CollectionView.extend({
  tagName: "div",
  className: "list-group",
  childView: ItemViewForEleve,
  emptyView: NoItemForEleveView,
  childViewEventPrefix: "item",
});



export { NotesCollectionView, NotesCollectionViewForEleve, PanelDevoirView };
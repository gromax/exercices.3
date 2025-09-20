import { View, CollectionView } from 'backbone.marionette'
import { DestroyWarn, FlashItem, FilterList } from '../../behaviors.js';
import no_item_tpl from '@templates/classes/list/classe-list-none.jst'
import item_view_tpl from '@templates/classes/list/classe-list-item.jst'
import classes_view_tpl from '@templates/classes/list/classe-list.jst'
import panel_tpl from '@templates/classes/list/classe-list-panel.jst'
import classe_list_layout_tpl from '@templates/users/list/user-list-layout.jst';

const ListLayout = View.extend ({
  template: classe_list_layout_tpl,
  regions: {
    panelRegion: "#panel-region",
    itemsRegion: "#items-region"
  }
});

const NoItemView = View.extend({
  template: no_item_tpl,
  tagName: "tr",
  className: "alert"
});

const ItemView = View.extend({
  tagName: "tr",
  template: item_view_tpl,
  behaviors: [
    DestroyWarn,
    {
      behaviorClass: FlashItem,
      preCss: "table-"
    }
  ],
  
  triggers: {
    "click td a.js-edit": "edit",
    "click td a.js-fill": "fill",
    "click td a.js-classe-prof": "classes:prof",
    "click": "show"
  },

  templateContext() {
    const showProfName = this.getOption("showProfName");
    return {
      showProfName: showProfName,
      linkProf: showProfName,
      showFillClassButton: this.getOption("showFillClassButton")
    };
  }
});

const ClassesCollectionView = CollectionView.extend({
  tagName: 'table',
  className: "table table-hover",
  template: classes_view_tpl,
  behaviors: [FilterList],
  childView: ItemView,
  emptyView: NoItemView,
  childViewEventPrefix: "item",
  childViewContainer: "tbody",
  templateContext() {
    return {
      showProfName: this.getOption("showProfName")
    };
  },
  childViewOptions(model) {
    return {
      showFillClassButton: this.getOption("showFillClassButton"),
      showProfName: this.getOption("showProfName")
    };
  }
});

const ClassesPanel = View.extend({
  template: panel_tpl,
  showAddButton: false,
  addToProf: false,
  templateContext() {
    return {
      showAddButton: this.getOption("showAddButton"),
      addToProf: this.getOption("addToProf")
    };
  },
  triggers: {
    "click button.js-new": "classe:new"
  }
});

export { ClassesCollectionView, ClassesPanel, ListLayout }

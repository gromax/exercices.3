import { View, CollectionView } from 'backbone.marionette'
import DestroyWarn from '../../behaviors/destroy.js'
import { FlashItem, FilterList, SortList } from '../../behaviors.js'

import panel_tpl from '@templates/devoirs/list/devoirs-list-panel.jst'
import no_devoir_tpl from '@templates/devoirs/list/devoir-list-none.jst'
import devoir_item_tpl from '@templates/devoirs/list/devoir-list-item.jst'
import devoirs_list_tpl from '@templates/devoirs/list/devoir-list.jst'




const DevoirsPanel = View.extend({
  adminMode: false,
  showInactifs: true,
  template: panel_tpl,
  templateContext() {
    return {
      showAddButton: this.getOption("showAddButton"),
    };
  },
  triggers: {
    "click button.js-new": "devoir:new"
  }
});

const NoDevoirView = View.extend({
  template: no_devoir_tpl,
  tagName: "tr",
  className: "alert"
});

const DevoirItemView = View.extend({
  adminMode: false,
  tagName: "tr",
  className() {
    return this.model.get('notStarted')
      ? "table-warning"
      : (this.model.get('notEnded') ? "" : "table-danger");
  },
  template: devoir_item_tpl,
  behaviors: [
    DestroyWarn,
    FlashItem
  ],

  triggers: {
    "click .js-clone": "clone"
  },

  templateContext() {
    return {
      showNomOwner: this.getOption("showNomOwner")
    };
  }
});

const DevoirsCollectionView = CollectionView.extend({
  adminMode: false,
  tagName: "table",
  className: "table table-hover",
  template: devoirs_list_tpl,
  childView: DevoirItemView,
  emptyView: NoDevoirView,
  behaviors: [FilterList, SortList],
  childViewEventPrefix: "item",
  childViewContainer: "tbody",
  filterKeys: ["nom", "nomProf"],
  childViewOptions() {
    return {
      showNomOwner: this.getOption("showNomOwner")
    };
  },
  templateContext() {
    return {
      showNomOwner: this.getOption("showNomOwner")
    };
  }
});


export {
  DevoirsPanel,
  DevoirsCollectionView
};
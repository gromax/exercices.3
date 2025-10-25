import { View, CollectionView } from 'backbone.marionette'
import { DestroyWarn, FlashItem, FilterList, SortList, ToggleItemValue } from '../../behaviors.js'

import panel_tpl from '@templates/devoirs/list/devoirs-list-panel.jst'
import no_devoir_tpl from '@templates/devoirs/list/devoir-list-none.jst'
import devoir_item_tpl from '@templates/devoirs/list/devoir-list-item.jst'
import devoirs_list_tpl from '@templates/devoirs/list/devoir-list.jst'
import devoirs_list_layout_tpl from '@templates/devoirs/list/devoirs-list-layout.jst'

const ListLayout = View.extend ({
  template: devoirs_list_layout_tpl,
  regions: {
    panelRegion: "#panel-region",
    itemsRegion: "#items-region"
  }
});


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
  template: devoir_item_tpl,
  errorCode: "021",
  behaviors: [
    DestroyWarn,
    FlashItem,
    ToggleItemValue
  ],
  
  triggers: {
    "click": "show"
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

export { DevoirsPanel, DevoirsCollectionView, ListLayout }

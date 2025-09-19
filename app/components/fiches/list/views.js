import { View, CollectionView } from 'backbone.marionette'
import { DestroyWarn, FlashItem, FilterList, SortList, ToggleItemValue } from '../../behaviors.coffee'

import panel_tpl from '@templates/fiches/list/list-fiches-panel.jst'
import no_fiche_tpl from '@templates/fiches/list/fiche-list-none.jst'
import fiche_item_tpl from '@templates/fiches/list/fiche-list-item.jst'
import fiches_list_tpl from '@templates/fiches/list/fiche-list.jst'
import fiches_list_layout_tpl from '@templates/users/list/user-list-layout.jst'

const ListLayout = View.extend ({
  template: fiches_list_layout_tpl,
  regions: {
    panelRegion: "#panel-region",
    itemsRegion: "#items-region"
  }
});


const FichesPanel = View.extend({
  adminMode: false,
  showInactifs: true,
  template: panel_tpl,
  templateContext() {
    return {
      adminMode: this.getOption("adminMode"),
      showInactifs: this.getOption("showInactifs")
    };
  },
  triggers: {
    "click button.js-new": "fiche:new",
    "click button.js-inactive-filter": "fiche:toggle:showInactifs"
  }
});

const NoFicheView = View.extend({
  template: no_fiche_tpl,
  tagName: "tr",
  className: "alert"
});

const FicheItemView = View.extend({
  adminMode: false,
  tagName: "tr",
  template: fiche_item_tpl,
  errorCode: "021",
  behaviors: [
    DestroyWarn,
    FlashItem,
    ToggleItemValue
  ],
  
  triggers: {
    "click button.js-actif": "toggle:activity",
    "click button.js-visible": "toggle:visibility",
    "click": "show"
  },

  templateContext() {
    return {
      adminMode: this.getOption("adminMode")
    };
  }
});

const FichesCollectionView = CollectionView.extend({
  adminMode: false,
  tagName: "table",
  className: "table table-hover",
  template: fiches_list_tpl,
  childView: FicheItemView,
  emptyView: NoFicheView,
  behaviors: [FilterList, SortList],
  childViewEventPrefix: "item",
  childViewContainer: "tbody",
  filterKeys: ["nom", "nomProf"],
  childViewOptions() {
    return {
      adminMode: this.getOption("adminMode")
    };
  },
  templateContext() {
    return {
      adminMode: this.getOption("adminMode")
    };
  }
});

export { FichesPanel, FichesCollectionView, ListLayout }

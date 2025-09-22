import { View, CollectionView } from 'backbone.marionette';
import { DestroyWarn, FlashItem, FilterList, SortList, FilterPanel } from '../../behaviors.js';
import users_panel_tpl from '@templates/users/list/user-list-panel.jst';
import no_item_tpl from '@templates/users/list/user-list-none.jst';
import item_admin_view_tpl from '@templates/users/list/user-list-admin-item.jst';
import item_prof_view_tpl from '@templates/users/list/user-list-prof-item.jst';
import users_admin_view_tpl from '@templates/users/list/user-list-admin.jst';
import users_prof_view_tpl from '@templates/users/list/user-list-prof.jst';
import user_list_layout_tpl from '@templates/users/list/user-list-layout.jst';

const ListLayout = View.extend ({
  template: user_list_layout_tpl,
  regions: {
    panelRegion: "#panel-region",
    itemsRegion: "#items-region"
  }
});


const UsersPanel = View.extend ({
  template: users_panel_tpl,
  showAddButton: false,
  behaviors: [FilterPanel],
  triggers: {
    "click button.js-new": "user:new"
  },
  templateContext() {
    return {
      filterCriterion: this.getOption("filterCriterion") || "",
      showAddButton: this.getOption("showAddButton")
    };
  }
});

const NoUserView = View.extend ({
  template: no_item_tpl,
  tagName: "tr",
  className: "alert"
});

const UserView = View.extend ({
  tagName: "tr",
  adminMode: false,
  behaviors: [DestroyWarn, FlashItem],
  getTemplate(data) {
    if (this.getOption("adminMode")) {
      return item_admin_view_tpl;
    } else {
      return item_prof_view_tpl;
    }
  },
  triggers: {
    "click button.js-forgotten": "forgotten",
    "click button.js-sudo": "sudo",
    "click": "show"
  }
});

const UsersCollectionView = CollectionView.extend ({
  adminMode: false,
  tagName: "table",
  className: "table table-hover",
  childView: UserView,
  emptyView: NoUserView,
  behaviors: [FilterList, SortList],
  childViewEventPrefix: "item",
  childViewContainer: "tbody",
  filterKeys: ["nom", "prenom", "nomClasse"],
  childViewOptions() {
    return {
      adminMode: this.getOption("adminMode")
    };
  },
  getTemplate(data) {
    if (this.getOption("adminMode")) {
      return users_admin_view_tpl;
    } else {
      return users_prof_view_tpl;
    }
  }
});

export { UsersPanel, UsersCollectionView, ListLayout }

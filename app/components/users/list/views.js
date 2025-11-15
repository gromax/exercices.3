import { View, CollectionView } from 'backbone.marionette';
import DestroyWarn from '../../behaviors/destroy.js';
import { FlashItem, FilterList, SortList, FilterPanel } from '../../behaviors.js';
import users_panel_tpl from '@templates/users/list/user-list-panel.jst';
import no_item_tpl from '@templates/users/list/user-list-none.jst';
import item_admin_view_tpl from '@templates/users/list/user-list-admin-item.jst';
import item_prof_view_tpl from '@templates/users/list/user-list-prof-item.jst';
import users_admin_view_tpl from '@templates/users/list/user-list-admin.jst';
import users_prof_view_tpl from '@templates/users/list/user-list-prof.jst';

const UsersPanel = View.extend ({
  template: users_panel_tpl,
  showAddButton: false,
  behaviors: [FilterPanel],
  triggers: {
    "click button.js-new": "user:new",
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
  templateContext() {
    return {
      adminMode: this.getOption("adminMode"),
      showClasse: this.getOption("showClasse")
    };
  },
  triggers: {
    "click button.js-forgotten": "forgotten",
    "click button.js-sudo": "sudo",
    "click a.js-classe": "classe",
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
      adminMode: this.getOption("adminMode"),
      showClasse: this.getOption("showClasse")
    };
  },
  templateContext() {
    return {
      adminMode: this.getOption("adminMode"),
      showClasse: this.getOption("showClasse")
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

export { UsersPanel, UsersCollectionView }

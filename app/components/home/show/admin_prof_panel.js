import { View } from 'backbone.marionette';
import admin_prof_tpl from '@templates/home/show/home-admin-prof.jst';

const AdminProfPanel = View.extend({
  className: "jumbotron",
  template: admin_prof_tpl,

  triggers: {
    "click a.js-promote": "session:promote",
    "click a.js-demote": "session:demote"
  },

  templateContext() {
    return {
      showPromoteButton: this.getOption("showPromoteButton") === true,
      showDemoteButton: this.getOption("showDemoteButton") === true,
      adminMode: this.getOption("adminMode") === true,
      unread: this.getOption('unread')
    };
  }
});

export { AdminProfPanel };
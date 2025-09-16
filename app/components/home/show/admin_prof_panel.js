import { View } from 'backbone.marionette';
import admin_prof_tpl from '@templates/home/show/home-admin-prof.jst';

const AdminProfPanel = View.extend({
  className: "jumbotron",
  template: admin_prof_tpl,
  events: {
    "click a.js-menu-item": "clickMenuItem"
  },

  clickMenuItem(e) {
    e.preventDefault();
    let cible = $(e.currentTarget).attr("cible");
    this.trigger(`show:list`, cible);
  },

  templateContext() {
    return {
      adminMode: this.getOption("adminMode") === true,
      unread: this.getOption('unread')
    };
  }
});

export { AdminProfPanel };
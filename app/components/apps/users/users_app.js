import { MnObject } from 'backbone.marionette';

import Radio from 'backbone.radio';

const arianeRadio = Radio.channel('ariane');
const sessionRadio = Radio.channel('session');

const Controller = MnObject.extend ({
  channelName: 'navigation',
  radioEvents: {
    "users:list": "onListUsers",
    "users:filter": "onFilterUsers",
    "user:show": "onShowUser",
    "user:edit": "onEditUser",
    "user:editPwd": "onEditUserPwd"
  },

  onListUsers(criterion) {
    Backbone.history.navigate("users", {});
    this.listUsers(criterion);
  },

  onFilterUsers(criterion) {
    if (criterion) {
      Backbone.history.navigate(`users/filter/criterion:${criterion}`, {});
    } else {
      Backbone.history.navigate("users", {});
    }
  },

  onUserShow(id) {
    Backbone.history.navigate(`user:${id}`, {});
    this.showUser(id);
  },

  onUserEdit(id) {
    Backbone.history.navigate(`user:${id}/edit`, {});
    this.editUser(id);
  },

  onUserEditPwd(id) {
    Backbone.history.navigate(`user:${id}/password`, {});
    this.editUserPwd(id);
  },

  listUsers(criterion) {
    const logged = sessionRadio.request("get");
    const channel = this.getChannel();
    const forProf = () => {
      arianeRadio.trigger("reset", [{ text:"Utilisateurs", e:"users:list", link:"users"}]);
      require("@apps/users/list/list_users_controller.js").controller.listUsers(criterion)
    };

    const todo = logged.mapItem({
      "Admin": forProf,
      "Prof": forProf,
      "Eleve": () => channel.trigger("notFound"),
      "def": () => channel.trigger("home:login")
    });
    todo();
  },

  showUser(id) {
    const logged = sessionRadio.request("get");
    /*
    if (logged.get("id") === id) {
      arianeRadio.trigger("reset", []);
      require("@apps/users/show/show_user_controller.js").controller.showUser(id, true);
    } else if (logged.isAdmin() || logged.isProf()) {
      arianeRadio.trigger("reset", [{ text:"Utilisateurs", e:"users:list", link:"users"}]);
      require("@apps/users/show/show_user_controller.js").controller.showUser(id, false);
    } else {
      this.channel().trigger("notFound");
    }
    */
  },

  editUser(id) {
    const logged = sessionRadio.request("get");
    /*
    if (logged.get("id") === id) {
      arianeRadio.trigger("reset", []);
      require("@apps/users/edit/edit_user_controller.js").controller.editUser(id, true, logged.isAdmin(), false);
    } else if (logged.isAdmin() || logged.isProf()) {
      arianeRadio.trigger("reset", [{ text:"Utilisateurs", e:"users:list", link:"users"}]);
      require("@apps/users/edit/edit_user_controller.js").controller.editUser(id, false, logged.isAdmin(), false);
    } else {
      this.channel().trigger("notFound");
    }
    */
  },

  editUserPwd(id) {
    const logged = sessionRadio.request("get");
    /*
    id = id ? logged.get("id") : id;
    if (logged.get("id") === id) {
      arianeRadio.trigger("reset", []);
      require("@apps/users/edit/edit_user_controller.js").controller.editUser(id, true, logged.isAdmin(), true);
    } else if (logged.isAdmin() || logged.isProf()) {
      arianeRadio.trigger("reset", [{ text:"Utilisateurs", e:"users:list", link:"users"}]);
      require("@apps/users/edit/edit_user_controller.js").controller.editUser(id, false, logged.isAdmin(), true);
    } else {
      this.channel().trigger("notFound");
    }
    */
  }
});

const controller = new Controller();

const Router = Backbone.Router.extend({
  routes: {
    "users(/filter/criterion::criterion)": "listUsers",
    "user::id": "showUser",
    "user::id/edit": "editUser",
    "user::id/password": "editUserPwd"
  },

  listUsers(criterion) {
    controller.listUsers(criterion);
  },

  showUser(id) {
    controller.showUser(id);
  },

  editUser(id) {
    controller.editUser(id);
  },

  editUserPwd(id) {
    controller.editUserPwd(id);
  }
});

new Router();
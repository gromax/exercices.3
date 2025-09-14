import { MnObject } from 'backbone.marionette';

const Controller = MnObject.extend ({
  channelName: 'app',
  radioEvents: {
    "users:list": "onListUsers",
    "users:filter": "onFilterUsers",
    "user:show": "onShowUser",
    "user:edit": "onEditUser",
    "user:editPwd": "onEditUserPwd"
  },

  onListUsers(criterion) {
    console.log("onListUsers", criterion);
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
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    console.log(logged);
    const forProf = () => {
      channel.trigger("ariane:reset", [{ text:"Utilisateurs", e:"users:list", link:"users"}]);
      require("@apps/users/list/list_users_controller.js").controller.listUsers(criterion)
    };

    const todo = logged.mapItem({
      "admin": forProf,
      "prof": forProf,
      "eleve": () => channel.trigger("notFound"),
      "def": () => channel.trigger("home:login")
    });
    console.log(todo);
    todo();
  },

  showUser(id) {
    const logged = channel.request("logged:get");
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
    const logged = channel.request("logged:get");
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
    const logged = channel.request("logged:get");
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
import { MnObject } from 'backbone.marionette';

const Controller = MnObject.extend ({
  channelName: 'app',
  radioEvents: {
    "users:list": "onUsersList",
    "users:filter": "onUsersFilter",
    "user:show": "onUserShow",
    "user:edit": "onUserEdit",
    "user:editPwd": "onUserEditPwd",
    "user:sudo":"onUserSudo"
  },

  radioRequests: {
    "user:edit:modal": "onUserEditModal",
    "user:editPwd:modal": "onUserEditPwdModal",
    "new:user:modal": "onNewUserModal"
  },

  onUsersList(criterion) {
    Backbone.history.navigate("users", {});
    this.listUsers(criterion);
  },

  onUsersFilter(criterion) {
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

  onUserEditModal(model, pwd = false) {
    const logged = this.getChannel().request("logged:get");
    if (!logged.isAdmin() && !logged.isProf()) {
      return;
    }
    return require("./edit/controller.js").controller.editUser(model.get("id"), model, pwd, true);
  },

  onUserEditPwd(id) {
    Backbone.history.navigate(`user:${id}/password`, {});
    this.editUserPwd(id);
  },

  onUserEditPwdModal(model) {
    return this.onUserEditModal(model, true);
  },

  onNewUserModal() {
    const User = require("./entity.js").Item;
    const newUser = new User();
    return require("./edit/controller.js").controller.NewUserView(newUser);
  },

  listUsers(criterion) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    const forProf = () => {
      channel.trigger("ariane:reset", [{ text:"Utilisateurs", e:"users:list", link:"users"}]);
      channel.trigger("loading:up");
      const fetchingUsers = channel.request("custom:entities", ["users"]);
      $.when(fetchingUsers).done((users) => {
        require("./list/controller.js").controller.listUsers(users, logged.get("rank"), criterion);
      }).fail((response) => {
        channel.trigger("data:fetch:fail", response);
      }).always(() => {
        channel.trigger("loading:down");
      });
    };

    const todo = logged.mapItem({
      "admin": forProf,
      "prof": forProf,
      "eleve": () => channel.trigger("not:found"),
      "def": () => channel.trigger("home:login")
    });
    todo();
  },

  showUser(id) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    const isMe = (logged.get("id") === Number(id));

    if (!isMe && !(logged.isAdmin() || logged.isProf())) {
      channel.trigger("not:found");
      return;
    }
    channel.trigger("loading:up");
    if (isMe) {
      channel.trigger("ariane:reset", []);
    } else {
      channel.trigger("ariane:reset", [{ text:"Utilisateurs", e:"users:list", link:"users"}]);
    }
    const fetchingUser = isMe ? channel.request("user:me") : channel.request("user:entity", id);
    $.when(fetchingUser).done( (user) => {
      require("./show/controller.js").controller.showUser(id, user, isMe);
    }).fail( (response) => {
      channel.trigger("data:fetch:fail", response);
    }).always( () => {
      channel.trigger("loading:down");
    });
  },

  editUser(id, pwd = false) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    const isMe = (logged.get("id") === Number(id));
    if (!isMe && !(logged.isAdmin() || logged.isProf())) {
      channel.trigger("not:found");
      return;
    }
    if (isMe) {
      channel.trigger("ariane:reset", []);
    } else {
      channel.trigger("ariane:reset", [{ text:"Utilisateurs", e:"users:list", link:"users"}]);
    }
    channel.trigger("loading:up");
    const fetchingUser = isMe ? channel.request("user:me") : channel.request("user:entity", id);
    $.when(fetchingUser).done( (user) => {
      if (isMe) {
        require("./edit/controller.js").controller.editMe(id, user, pwd);
      } else {
        const view = require("./edit/controller.js").controller.editUser(id, user, pwd, false);
        view.on("success", function (model, data) {
          channel.trigger("user:show", id);
        });
      }
    }).fail( (response) => {
      channel.trigger("data:fetch:fail", response);
    }).always( () => {
      channel.trigger("loading:down");
    });
  },

  editUserPwd(id) {
    this.editUser(id, true);
  },

  onUserSudo(id) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    channel.trigger("loading:up");
    const connecting = logged && logged.sudo(id);
    $.when(connecting).done( (data) => {
      channel.trigger("home:show");
    }).fail( (response) => {
      switch (response.status) {
        case 404:
          channel.trigger("popup:alert", "Page inconnue !");
          break;
        case 403:
          channel.trigger("popup:alert", "Non autorisé !");
          break;
        default:
          channel.trigger("popup:alert", `Erreur inconnue. Essayez à nouveau ou prévenez l'administrateur [code ${response.status}/035]`);
      }
    }).always( () => {
      channel.trigger("loading:down");
    });
  },
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
    console.log("Router showUser", id);
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
import { MnObject } from 'backbone.marionette';

const Controller = MnObject.extend ({
  channelName: 'app',
  radioEvents: {
    "users:filter": "onUsersFilter",
    "user:show": "onShowUser",
    "user:classe:signin":"onUserClasseSignin"
  },

  onUsersFilter(criterion) {
    if (criterion) {
      Backbone.history.navigate(`users/filter/criterion:${criterion}`, {});
    } else {
      Backbone.history.navigate("users", {});
    }
  },

  onShowUser(id) {
    Backbone.history.navigate(`user:${id}`, {});
    this.showUser(id);
  },

  /*onNewUser() {
    const User = require("./entity.js").Item;
    const newUser = new User();
    return require("./edit/controller.js").controller.NewUserView(newUser);
  },*/

  onUserClasseSignin(id) {
    Backbone.history.navigate(`user/classe:${id}/signin`, {});
    this.classeSignin(id);
  },

  classeSignin(idClasse) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (logged.isAdmin() || logged.isProf()) {
      channel.trigger("not:found");
      return;
    }
    const fetchingClasses = channel.request("classes:tojoin:fetch");
    channel.trigger("loading:up");
    $.when(fetchingClasses).done( (classes) => {
      const classe = classes.get(idClasse);
      if (!classe) {
        channel.trigger("not:found");
        return;
      }
      require("./edit/controller.js").controller.classeSignin(idClasse, classe);
    }).fail( (response) => {
      channel.trigger("data:fetch:fail", response);
    }).always( () => {
      channel.trigger("loading:down");
    });
  },

  listUsers(criterion) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    const forProf = () => {
      channel.trigger("ariane:reset", [{ text:"Utilisateurs", link:"users"}]);
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
      channel.trigger("ariane:reset", [{ text:"Utilisateurs", link:"users"}]);
    }
    channel.trigger("loading:up");
    const fetchingUser = isMe ? channel.request("user:me") : channel.request("user:entity", id);
    $.when(fetchingUser).done( (user) => {
      if (isMe) {
        require("./edit/controller.js").controller.editMe(id, user, pwd);
      } else {
        require("./edit/controller.js").controller.editUser(id, user, pwd, false);
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

  newUser() {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");

    if (!(logged.isAdmin())) {
      channel.trigger("not:found");
      return;
    }
    require("./edit/controller.js").controller.NewUserView();
  }

});

const controller = new Controller();

const Router = Backbone.Router.extend({
  routes: {
    "users(/filter/criterion::criterion)": "listUsers",
    "user::id": "showUser",
    "user::id/edit": "editUser",
    "user::id/password": "editUserPwd",
    "user/classe::id/signin": "classeSignin",
    "user/new": "NewUserView",
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
  },

  classeSignin(id) {
    controller.classeSignin(id);
  },

  NewUserView() {
    controller.newUser();
  }
});

new Router();
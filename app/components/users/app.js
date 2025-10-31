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
      channel.trigger("ariane:push", { text: classe.get("nom"), link: `user/classe:${idClasse}/signin` });
      require("./edit/controller.js").controller.classeSignin(classe);
    }).fail( (response) => {
      channel.trigger("data:fetch:fail", response);
    }).always( () => {
      channel.trigger("loading:down");
    });
  },

  listUsers(criterion) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isAdmin() && !logged.isProf()) {
      channel.trigger("not:found");
      return;
    }

    channel.trigger("ariane:push", {
      text:logged.isProf() ? "Vos élèves" : "Utilisateurs",
      link:"users"
    });
    channel.trigger("loading:up");
    const fetchingUsers = channel.request("custom:entities", ["users"]);
    $.when(fetchingUsers).done((data) => {
      const {users} = data;
      require("./list/controller.js").controller.listUsers(users, logged.get("rank"), criterion);
    }).fail((response) => {
      channel.trigger("data:fetch:fail", response);
    }).always(() => {
      channel.trigger("loading:down");
    });
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
    const fetchingUser = isMe ? channel.request("user:me") : channel.request("data:getitem", "users", id);
    $.when(fetchingUser).done( (user) => {
      if (!user) {
        channel.trigger("not:found");
        return;
      }
      if (isMe) {
        channel.trigger("ariane:reset", [
          { text: "Mon compte", link: `user:${id}` }
        ]);
      } else {
        channel.trigger("ariane:push", { text: user.get("nomComplet"), link: `user:${id}` });
      }
      require("./show/controller.js").controller.showUser(user);
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
    channel.trigger("loading:up");
    const fetchingUser = isMe ? channel.request("user:me") : channel.request("data:getitem", "users", id);
    $.when(fetchingUser).done( (user) => {
      if (!user) {
        channel.trigger("not:found");
        return;
      }
      if (isMe) {
        channel.trigger("ariane:reset", []);
      }
      channel.trigger("ariane:push", {
        text: pwd === true ? "Modification du mot de passe" : "Modification des informations",
        link: `user:${id}/edit`
      });
      require("./edit/controller.js").controller.editUser(user, pwd);
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
    channel.trigger("ariane:push", { text:"Nouvel utilisateur", link:"user/new" });
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
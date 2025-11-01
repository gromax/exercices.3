import { MnObject } from 'backbone.marionette';

const Controller = MnObject.extend ({
  channelName: 'app',
  radioEvents: {
    "user:show": "onShowUser",
    "user:show:me": "onShowUserMe",
    "users:classe:show": "onUsersClasseShow",
    "user:classe:signin":"onUserClasseSignin"
  },

  onShowUser(id) {
    Backbone.history.navigate(`user:${id}`, {});
    this.showUser(id);
  },

  onShowUserMe() {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged) {
      return;
    }
    this.showUser(logged.get("id"));
  },

  onUsersClasseShow(idClasse) {
    Backbone.history.navigate(`users/classe:${idClasse}`, {});
    this.listUsers(idClasse);
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

  listUsers(idClasse = null) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isAdmin() && !logged.isProf()) {
      channel.trigger("not:found");
      return;
    }
    channel.trigger("loading:up");
    const dataToLoad = idClasse ? ["users", "classes"] : ["users"];
    const fetchingUsers = channel.request("custom:entities", dataToLoad);
    $.when(fetchingUsers).done((data) => {
      const classe = idClasse ? data.classes.get(idClasse) : null;
      if (idClasse !== null && !classe) {
        channel.trigger("not:found");
        return;
      }
      const {users} = data;
      const filteredUsers = idClasse ? new users.constructor(users.filter(u => u.get("idClasse") === Number(idClasse))) : users;
      if (classe) {
        channel.trigger("ariane:push", { text: `Élèves de ${classe.get("nom")}`, link: `users/classe:${classe.id}` });
      } else if (logged.isProf()) {
        channel.trigger("ariane:push", { text: "Vos élèves", link: "users" });
      } else {
        channel.trigger("ariane:push", { text: "Utilisateurs", link: "users" });
      }
      require("./list/controller.js").controller.listUsers(filteredUsers, classe);
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
        channel.trigger("ariane:push", { text: "Mon compte", link: `user:${id}`, fragile: true });
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
    const isMe = (logged.id === Number(id));
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
        channel.trigger("ariane:push", {
          text: pwd === true ? "Modification de votre mot de passe" : "Modification de vos informations",
          link: `user:${id}/edit`,
          fragile: true
        });
      } else {
        channel.trigger("ariane:push", {
          text: pwd === true ? "Modification du mot de passe" : "Modification des informations",
          link: `user:${id}/edit`,
          fragile: true
        });
      }
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
    channel.trigger("ariane:push", { text:"Nouvel utilisateur", link:"user/new", fragile:true });
    require("./edit/controller.js").controller.NewUserView();
  }

});

const controller = new Controller();

const Router = Backbone.Router.extend({
  routes: {
    "users": "listUsers",
    "user::id": "showUser",
    "user::id/edit": "editUser",
    "user::id/password": "editUserPwd",
    "user/classe::id/signin": "classeSignin",
    "users/classe::id": "listUsers",
    "user/new": "NewUserView",
  },

  listUsers(idClasse = null) {
    controller.listUsers(idClasse);
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
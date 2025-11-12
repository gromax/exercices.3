import { MnObject } from 'backbone.marionette';

const HomeApp = MnObject.extend({
  channelName:"app",
  radioEvents: {
    "home:show": "onShow",
    "home:login": "onLogin",
    "home:relogin":"onRelogin",
    "home:logout":"onLogout"
  },

  onShow() {
    Backbone.history.navigate("home", {});
    this.showHome();
  },

  onLogin() {
    Backbone.history.navigate("login", {});
    this.showLogin();
  },

  onRelogin(options) {
    this.showReLogin(options);
  },

  onLogout() {
    this.logout();
    this.getChannel().trigger("home:show");
  },

  showHome() {
    const channel = this.getChannel();
    let logged = this.getChannel().request("logged:get");
    if (logged.isAdmin()) {
      require("./show/controller.js").controller.showAdminHome();
    } else if(logged.isProf()) {
      require("./show/controller.js").controller.showProfHome();
    } else if(logged.isEleve()) {
      channel.trigger("notes:my", logged.id);
    } else {
      require("./show/controller.js").controller.showOffHome();
    }
  },

  showLogin() {
    const channel = this.getChannel();
    const logged = this.getChannel().request("logged:get");
    if (!logged.isOff()) {
      this.showHome();
    } else {
      channel.trigger("ariane:reset", [{text:"Connexion", link:"login"}]);
      require("./login/controller.js").controller.showLogin();
    }
  },

  showReLogin() {
    require("./login/controller.js").controller.showReLogin();
  },

  logout() {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isOff()) {
      channel.trigger("session:logout");
    }
  },

  forgotten(key) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isOff()) {
      channel.trigger("notFound");
    } else {
      channel.trigger("ariane:reset", [{text:"Réinitialisation de mot de passe"}]);
      this.getChannel().trigger("loading:up");
      let showController = require("./show/controller.js").controller;
      let fetching = logged.getWithForgottenKey(key);
      $.when(fetching).done( function(){
        showController.showLogOnForgottenKey(true);
      }).fail( function(response){
        if (response.status === 401){
          showController.showLogOnForgottenKey(false);
        } else {
          alert(`Erreur inconnue. Essayez à nouveau ou prévenez l'administrateur [code ${response.status}/034]`);
        }
      }).always( function(){
        channel.trigger("loading:down");
      });
    }
  }
});

const homeApp = new HomeApp();

const Router = Backbone.Router.extend({
  routes: {
    "" : "showHome",
    "home" : "showHome",
    "login" : "showLogin",
    "logout" : "logout",
    "forgotten::key": "forgotten"
  },

  showHome(){
    homeApp.showHome();
  },
  showLogin(){
    homeApp.showLogin();
  },
  logout(){
    homeApp.logout();
  },
  forgotten(){
    homeApp.forgotten();
  }
});


new Router();
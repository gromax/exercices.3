import { MnObject } from 'backbone.marionette';
import Radio from 'backbone.radio';

const arianeChannel = Radio.channel("ariane");
const headerChannel = Radio.channel("header");
const sessionChannel = Radio.channel("session");

const HomeApp = MnObject.extend({
  channelName:"navigation",
  radioEvents: {
    "home:show": "onShow",
    "home:login": "onLogin",
    "home:relogin":"onRelogin",
    "home:logout":"onLogout"
  },

  onShow() {
    console.log("Navigation vers l'accueil");
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
    arianeChannel.trigger("reset", []);
    let controller = require("@apps/home/show/home_show_controller.js").controller;
    let logged = sessionChannel.request("get");
    if (logged.isAdmin()) {
      controller.showAdminHome();
    } else if(logged.isProf()) {
      controller.showProfHome();
    } else if(logged.isEleve()) {
      controller.showEleveHome();
    } else {
      controller.showOffHome();
    }
  },

  showLogin() {
    let logged = sessionChannel.request("get");
    if (logged.get("logged_in")) {
      this.showHome();
    } else {
      arianeChannel.trigger("reset", [{text:"Connexion", link:"login", e:"home:login"}]);
      require("@apps/home/login/login_controller.js").controller.showLogin();
    }
  },

  showReLogin(options) {
    require("@apps/home/login/login_controller.js").controller.showReLogin();
  },

  logout() {
    let self = this;
    let logged = sessionChannel.request("get");
    if(logged.get("logged_in")) {
      let closingSession = logged.destroy();
      $.when(closingSession).done( function(response) {
        // En cas d'échec de connexion, l'api server renvoie une erreur
        // Le delete n'occasione pas de raffraichissement des données
        // Il faut donc le faire manuellement
        logged.refresh(response.logged);
        self.showHome();
      }).fail( function(response) {
        console.error(`Erreur inconnue. Essayez à nouveau ou prévenez l'administrateur [code ${response.status}/024]`);
      });
    }
  },

  forgotten(key) {
    let logged = sessionChannel.request("get");
    if (logged.get("logged_in")) {
      Radio.channel("app").trigger("notFound");
    } else {
      arianeChannel.trigger("reset", [{text:"Réinitialisation de mot de passe"}]);
      headerChannel.trigger("loading:up");
      let showController = require("@apps/home/show/home_show_controller.js").controller;
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
        headerChannel.trigger("loading:down");
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
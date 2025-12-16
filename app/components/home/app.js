import { MnObject } from 'backbone.marionette';

const HomeApp = MnObject.extend({
    channelName:"app",
    radioEvents: {
        "home:show": "onShow",
        "home:login": "onLogin",
        "home:relogin":"onRelogin",
    },

    onShow() {
        Backbone.history.navigate("home", {})
        this.showHome()
    },

    onLogin() {
        Backbone.history.navigate("login", {})
        this.showLogin()
    },

    onRelogin(options) {
        this.showReLogin(options)
    },

    showHome() {
        const channel = this.getChannel()
        let logged = this.getChannel().request("logged:get")
        if (logged.isAdmin()) {
            require("./show/controller.js").controller.showAdminHome()
        } else if(logged.isProf()) {
            require("./show/controller.js").controller.showProfHome()
        } else if(logged.isEleve()) {
            channel.trigger("notes:my", logged.id)
        } else {
            require("./show/controller.js").controller.showOffHome()
        }
    },

    showLogin() {
        const channel = this.getChannel()
        const logged = this.getChannel().request("logged:get")
        if (!logged.isOff()) {
            this.showHome()
        } else {
            channel.trigger("ariane:reset", [{text:"Connexion", link:"login"}])
            require("./login/controller.js").controller.showLogin()
        }
    },

    showReLogin() {
        require("./login/controller.js").controller.showReLogin()
    },

    logout() {
        const channel = this.getChannel()
        const logged = channel.request("logged:get")
        if (!logged.isOff()) {
            channel.trigger("session:logout")
        }
    },

    forgottenAsk() {
        const channel = this.getChannel()
        const logged = channel.request("logged:get")
        if (!logged.isOff()) {
            channel.trigger("notFound")
        }
        channel.trigger("ariane:reset", [{text:"Réinitialisation de mot de passe", link:"forgotten:ask"}])
        require("./login/controller.js").controller.showForgottenAsk()
    },

    forgottenWithKey(key) {
        const channel = this.getChannel()
        const logged = channel.request("logged:get")
        if (!logged.isOff()) {
            channel.trigger("notFound")
            return
        }
        this.getChannel().trigger("loading:up")
        let fetching = logged.getWithForgottenKey(key)
        $.when(fetching).done( function(){
            channel.trigger("popup:info", "Vous pouvez maintenant choisir un nouveau mot de passe.")
            channel.trigger("home:show")
        }).fail( function(response){
            if (response.status === 404) {
                channel.trigger("not:found")
            } else {
                channel.trigger("popup:error", "Clé invalide ou expirée.")
            }
        }).always( function(){
            channel.trigger("loading:down")
        })
    }
});

const homeApp = new HomeApp();

const Router = Backbone.Router.extend({
    routes: {
        "" : "showHome",
        "home" : "showHome",
        "login" : "showLogin",
        "logout" : "logout",
        "forgotten/ask": "forgottenAsk",
        "forgotten/:key": "forgottenWithKey",
    },

    showHome(){
        homeApp.showHome()
    },
    
    showLogin(){
        homeApp.showLogin()
    },

    logout(){
        homeApp.logout()
    },

    forgottenWithKey(key){
        homeApp.forgottenWithKey(key)
    },

    forgottenAsk(){
        homeApp.forgottenAsk()
    }

});


new Router();
import { View } from 'backbone.marionette';
import header_tpl from '@templates/header/show/header-navbar.jst';
import Radio from 'backbone.radio';


const HeaderView = View.extend({
  channelName: "header",
  template: header_tpl,
  logged: { isOff: true },
  triggers: {
    "click a.js-home": "home:show",
    "click a.js-edit-me": "home:editme",
    "click a.js-login": "home:login",
    "click a.js-logout": "home:logout",
    "click a.js-message": "messages:list",
  },

  showSpinner(){
    $("span.js-spinner", this.$el).html("<i class='fa fa-spinner fa-spin'></i>");
  },

  hideSpinner(){
    $("span.js-spinner", this.$el).html("");
  },

  templateContext() {
    let logged = _.clone(Radio.channel("session").request("get").attributes);

    return {
      isAdmin: (logged.isAdmin === true),
      isProf: (logged.isProf === true),
      isEleve: (logged.isEleve === true),
      isOff: (logged.isOff === true),
      nomComplet: logged.isOff ? "Déconnecté" : `${logged.prenom} ${logged.nom}`,
      unread: (logged.unread || 0),
      version: APP_VERSION
    };
  },



});

export { HeaderView };

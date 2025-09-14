import { MnObject } from 'backbone.marionette';
import { Session } from '@entities/session.js';


const SessionApp = MnObject.extend({
  channelName: "app",
  radioEvents: {
    'forgotten:password':'onSendForgottenEmail',
    'load:error':'onLoadError'
  },

  radioRequests: {
    'logged:get':'onGet'
  },

  initialize() {
    const channel = this.getChannel();
    this.logged = new Session();
    const logged = this.logged;
    this.logged.load();

    this.logged.on("destroy", function() {
        this.unset("id");
        localStorage.removeItem('jwt');
        channel.trigger("logged:destroy");
    });
    this.logged.on("change", function(){
        localStorage.setItem('jwt', logged.get("token"));
        console.log("Token set to", logged.get("token"));
        channel.trigger("logged:changed");
    });
  },

  onGet() {
    return this.logged;
  },

  onSendForgottenEmail(email) {
    return request = $.ajax(
      "api/forgotten",
      {
        method:'POST',
        dataType:'json',
        data: { email:email }
      }
    )
  },

  onLoadError(data) {
    console.error("Load logged :" + data.status);
  }
});

export const sessionApp = new SessionApp();
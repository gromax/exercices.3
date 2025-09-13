import { MnObject } from 'backbone.marionette';
import { Session } from '@entities/session.js';
import Radio from 'backbone.radio';


const SessionApp = MnObject.extend({
  channelName: "session",
  radioEvents: {
    'forgotten:password':'onSendForgottenEmail',
    'load:success':'onLoadSuccess',
    'load:error':'onLoadError'
  },

  radioRequests: {
    'get':'onGet'
  },

  initialize() {
    this.logged = new Session();
    this.logged.load();
    this.logged.on("destroy", function() {
        this.unset("id");
        Radio.channel("data").request("purge");
    });
    this.logged.on("change", function(){
        Radio.channel("header").trigger("logged:changed");
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

  onLoadSuccess() {
    Radio.channel("header").trigger("logged:changed");
  },

  onLoadError(data) {
    console.error("Load logged :" + data.status);
  }
});

export const sessionApp = new SessionApp();
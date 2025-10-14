import { MnObject } from 'backbone.marionette';
import { Session } from './entity.js';


const SessionApp = MnObject.extend({
  channelName: "app",
  radioEvents: {
    'forgotten:password':'onSendForgottenEmail',
    'load:error':'onLoadError',
    'session:logout':'logout'
  },

  radioRequests: {
    'logged:get':'onGet',
    'jwt:get':'onGetToken'
  },

  initialize() {
    const channel = this.getChannel();
    this.logged = new Session();
    this.logged.load(this.getOption("callBack"));
    this.logged.on("change", function(){
        channel.trigger("logged:changed");
    });
  },

  onGet() {
    return this.logged;
  },

  onGetToken() {
    return localStorage.getItem('jwt');
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
  },

  logout() {
    const channel = this.getChannel();
    channel.request("data:purge");
    this.logged.kill();
    channel.trigger("logged:destroy");
    this.logged.load(function(){
      channel.trigger("home:show");
    });
  }
});

export { SessionApp }
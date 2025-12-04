import { MnObject } from 'backbone.marionette';
import { Session } from './entity.js';


const SessionApp = MnObject.extend({
  channelName: "app",
  radioEvents: {
    'forgotten:password':'onSendForgottenEmail',
    'load:error':'onLoadError',
    'session:logout':'logout',
    'session:promote':'onPromote',
    'session:demote':'onDemote',
    'session:refresh': 'onRefresh'
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

  onRefresh() {
    const channel = this.getChannel();
    channel.trigger("data:purge");
    channel.trigger("header:refresh");
    channel.trigger("ariane:reset", []);
    channel.trigger("home:show");
  },

  onPromote() {
    const channel = this.getChannel();
    const token = localStorage.getItem('jwt');
    const request = $.ajax(
      "api/session/promote",
      {
        method:'GET',
        dataType:'json',
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      }
    );
    channel.trigger("loading:up");
    request.done( (response) => {
        if (response && response.token) {
            localStorage.setItem('jwt', response.token);
        }
        this.logged.set("adminMode", true);
        channel.trigger("session:refresh");
    } ).fail( (response) => {
        channel.trigger("popup:alert", "Échec de la promotion");
    } ).always( () => {
        channel.trigger("loading:down");
    } );
  },

  onDemote() {
    const channel = this.getChannel();
    const token = localStorage.getItem('jwt');
    const request = $.ajax(
      "api/session/demote",
      {
        method:'GET',
        dataType:'json',
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      }
    );
    channel.trigger("loading:up");
    request.done( (response) => {
        if (response && response.token) {
            localStorage.setItem('jwt', response.token);
        }
        this.logged.set("adminMode", false);
        channel.trigger("session:refresh");
    } ).fail( (response) => {
        channel.trigger("popup:alert", "Échec de la rétrogradation");
    } ).always( () => {
        channel.trigger("loading:down");
    } );
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
    this.logged.kill();
    channel.trigger("data:purge");
    this.logged.load(function(){
      channel.trigger("home:show");
    });
  }
});

export { SessionApp }
import { MnObject, Region } from 'backbone.marionette';
import { AlertView, PopupView } from './views.js'

const messageRegion = new Region({
  el: '#message-region'
});

const Controller = MnObject.extend({
  channelName: "app",
  radioEvents: {
    "show:message:success":"showMessageSuccess",
    "show:message:error":"showMessageError",
    "data:fetch:fail":"dataFetchFail",
    "not:found": "notFound",
    "popup:alert": "popupAlert",
    "popup:error": "popupError",
    "popup:info": "popupInfo",
    "popup:success": "popupSuccess"
  },
  showMessageSuccess(message) {
    let view;
    if (typeof message === "object") {
      message.type = "success"
      view = new AlertView(message);
    } else {
      view = new AlertView({
        type: "success",
        message: message,
        title: "Succès !"
      });
    }
    messageRegion.show(view);
  },

  showMessageError(message) {
    const view = new AlertView({
      message: message
    });
    messageRegion.show(view);
  },

  dataFetchFail(xhr, errorCode) {
    const channel = this.getChannel();
    let messages = '';
    if (xhr.responseText) {
      let items = JSON.parse(xhr.responseText);
      if (items.ajaxMessages) {
        messages = _.reduce(items.ajaxMessages, function(memo, item){
          return item.message + ' ' + memo;
        }, '');
      }
    }
    switch(xhr.status) {
      case 401:
        alert("Vous devez vous (re)connecter !");
        this.getChannel().trigger("home:logout");
        break;
      case 404:
        const mView = new MissingView();
        messageRegion.show(mView);
        break;
      case 422:
        channel.trigger("popup:alert", {
          title: "Erreur",
          message: messages?messages:"Impossible d'exécuter la commande."
        });
        break;
      default:
        let message;
        if (errorCode) {
          message = `Essayez à nouveau ou prévenez l'administrateur [code ${xhr.status}/${errorCode}]`;
        } else {
          message = `Essayez à nouveau ou prévenez l'administrateur [code ${xhr.status}]`
        }
        channel.trigger("popup:error", {
          title:"",
          message: messages?`${messages} ${message}`:message
        });
    }
  },
  notFound() {
    const channel = this.getChannel();
    const view = new AlertView({
      message: "Page introuvable",
      dismiss: false
    });
    channel.trigger("ariane:push", { text:"Page introuvable", link:"", fragile:true });
    channel.request("region:main").show(view);
  },

  popup(data) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const strHour = `${hours}:${minutes}`;
    data.time = strHour;
    const view = new PopupView(data);
    view.render();
    document.getElementById('toast-region').appendChild(view.el);
  },

  popupAlert(data) {
    if (typeof data == "string") {
      data = { message: data };
    }
    if (!data.title) {
      data.title = "Alerte";
    }
    data.type = "alert";
    this.popup(data);
  },

  popupError(data) {
    if (typeof data == "string") {
      data = { message: data };
    }
    if (!data.title) {
      data.title = "Erreur";
    }
    data.type = "error";
    this.popup(data);
  },

  popupInfo(data) {
    if (typeof data == "string") {
      data = { message: data };
    }
    if (!data.title) {
      data.title = "Information";
    }
    data.type = "info";
    this.popup(data);
  },

  popupSuccess(data) {
    if (typeof data == "string") {
      data = { message: data };
    }
    if (!data.title) {
      data.title = "Succès";
    }
    data.type = "success";
    this.popup(data);
  }
});




new Controller();
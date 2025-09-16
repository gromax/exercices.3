import { MnObject, Region } from 'backbone.marionette';
import { AlertView, MissingView } from './views.js'

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
    "missing:item": "missingItem"
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
        const fView = new AlertView({
          message:messages?messages:"Impossible d'exécuter la commande.",
          title: "Échec !"
        });
        messageRegion.show(fView);
        break;
      default:
        let message;
        if (errorCode) {
          message = `Essayez à nouveau ou prévenez l'administrateur [code ${xhr.status}/${errorCode}]`;
        } else {
          message = `Essayez à nouveau ou prévenez l'administrateur [code ${xhr.status}]`
        }
        const aView = new AlertView({
          message: message,
          title: "Erreur inconnue"
        });
        messageRegion.show(aView);
    }
  },
  notFound() {
    const view = new AlertView({
      message: "Page introuvable",
      dismiss: false
    });
    this.getChannel().trigger("ariane:reset", [
      { text:"Page introuvable", e:"", link:"" }
    ]);
    new Region({ el: '#main-region' }).show(view);
  },

  missingItem(item) {
    const view = new MissingView();
    new Region({ el: '#main-region' }).show(view);
  }
});




new Controller();
import Backbone from "backbone";
import {MnObject} from "backbone.marionette"

const Controller = MnObject.extend({
  channelName: "app",
  radioEvents: {
    "notes:devoir:user:show": "onShowNotesForDevoirUser"
  },

  onShowNotesForDevoirUser(idDevoir, idUser) {
    Backbone.history.navigate(`devoir:${idDevoir}/notes/user:${idUser}`, { trigger: false });
    this.showNotesExosForDevoirUser(idDevoir, idUser);
  },

  showNotesForDevoir(idDevoir) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (logged.isOff() || logged.isEleve()) {
      channel.trigger("not:found");
      return;
    }
    channel.trigger("loading:up");
    const fetching = channel.request("custom:entities", ["notes", "devoirs"]);
    $.when(fetching).done( (notes, devoirs) => {
      // récupérer le bon devoir
      idDevoir = Number(idDevoir);
      const devoir = devoirs.find(d => d.id === idDevoir);

      if (devoir === undefined) {
        channel.trigger("not:found");
        return;
      }
      const notesDuDevoir = notes.filter(a => a.get('idDevoir') === idDevoir);
      const collecNotes = new notes.constructor(notesDuDevoir);
      require("./list/controller.js").controller.showNotesListForDevoir(idDevoir, devoir, collecNotes);
    }).fail( (response) => {
      channel.trigger("data:fetch:fail", response);
    }).always( () => {
      channel.trigger("loading:down");
    });
  },

  showNotesExosForDevoirUser(idDevoir, idUser) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (logged.isOff() || logged.isEleve()) {
      channel.trigger("not:found");
      return;
    }
    channel.trigger("loading:up");
    const fetching = channel.request("custom:entities", ["notesexos", "devoirs", "users"]);
    $.when(fetching).done( (notesexos, devoirs, users) => {
      // récupérer le bon devoir
      idDevoir = Number(idDevoir);
      idUser = Number(idUser);
      const devoir = devoirs.find(d => d.id === idDevoir);
      const user = users.find(u => u.id === idUser);
      if (devoir === undefined || user === undefined) {
        channel.trigger("not:found");
        return;
      }
      // si un user peut charger le devoir, c'est qu'il a le droit de le voir
      const notesExosDuDevoirUser = notesexos.filter(a => a.get('idDevoir') === idDevoir && a.get('idUser') === idUser);
      const collecNotesExo = new notesexos.constructor(notesExosDuDevoirUser);
      require("./exolist/controller.js").controller.showNotesExosListForDevoirUser(idDevoir, idUser, devoir, collecNotesExo, user);
    }).fail( (response) => {
      channel.trigger("data:fetch:fail", response);
    }).always( () => {
      channel.trigger("loading:down");
    });
  }
});

const controller = new Controller();

const Router = Backbone.Router.extend({
  routes: {
    "devoir::id/notes": "showNotesForDevoir",
    "devoir::idDevoir/notes/user::idUser": "showNotesExosForDevoirUser"
  },

  showNotesForDevoir(id) {
    controller.showNotesForDevoir(id);
  },

  showNotesExosForDevoirUser(idDevoir, idUser) {
    controller.showNotesExosForDevoirUser(idDevoir, idUser);
  }
});

new Router();

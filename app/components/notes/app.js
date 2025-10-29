import Backbone from "backbone";
import {MnObject} from "backbone.marionette"

const Controller = MnObject.extend({
  channelName: "app",
  radioEvents: {
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
  }
});

const controller = new Controller();

const Router = Backbone.Router.extend({
  routes: {
    "devoir::id/notes": "showNotesForDevoir",
  },
  showNotesForDevoir(id) {
    controller.showNotesForDevoir(id);
  }
});

new Router();

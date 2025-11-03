import Backbone from "backbone";
import {MnObject} from "backbone.marionette"

const Controller = MnObject.extend({
  channelName: "app",
  radioEvents: {
    "notes:devoir:user:show": "onShowNotesForDevoirUser",
    "notes:my": "onShowMyNotes",
    "notes:my:devoir": "onShowMyNotesForDevoir",
  },

  onShowNotesForDevoirUser(idDevoir, idUser) {
    Backbone.history.navigate(`devoir:${idDevoir}/notes/user:${idUser}`, { trigger: false });
    this.showNotesExosForDevoirUser(idDevoir, idUser);
  },

  onShowMyNotes() {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isEleve()) {
      return;
    }
    Backbone.history.navigate("home", { trigger: false });
    this.showNotesListForEleve(logged.id);
  },

  onShowMyNotesForDevoir(idDevoir) {
    Backbone.history.navigate(`mynotes:${idDevoir}`, { trigger: false });
    this.showMyNotesExosForDevoir(idDevoir);
  },

  showNotesForDevoir(idDevoir) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (logged.isOff() || logged.isEleve()) {
      channel.trigger("not:found");
      return;
    }
    channel.trigger("loading:up");
    const fetching = channel.request("custom:entities", ["notes", `devoirs:${idDevoir}`]);
    $.when(fetching).done( (data) => {
      const {notes} = data;
      // récupérer le bon devoir
      idDevoir = Number(idDevoir);
      const devoir = data[`devoirs:${idDevoir}`];
      if (!devoir) {
        channel.trigger("not:found");
        return;
      }
      const notesDuDevoir = notes.filter(a => a.get('idDevoir') === idDevoir);
      const collecNotes = new notes.constructor(notesDuDevoir);
      channel.trigger("ariane:push", { text: `Notes de ${devoir.get('nom')}`, link: `#devoir:${idDevoir}/notes` });
      require("./list/controller.js").controller.showNotesListForDevoir(devoir, collecNotes);
    }).fail( (response) => {
      channel.trigger("data:fetch:fail", response);
    }).always( () => {
      channel.trigger("loading:down");
    });
  },

  showMyNotesExosForDevoir(idDevoir) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isEleve()) {
      channel.trigger("not:found");
      return;
    }
    this.showNotesExosForDevoirUser(idDevoir, logged.id);
  },

  showNotesExosForDevoirUser(idDevoir, idUser) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (logged.isOff()) {
      channel.trigger("not:found");
      return;
    }
    channel.trigger("loading:up");
    const fetching = channel.request("custom:entities", ["notesexos", "notes", `users:${idUser}`]);
    $.when(fetching).done( (data) => {
      // récupérer le bon devoir
      idDevoir = Number(idDevoir);
      idUser = Number(idUser);
      const {notesexos, notes} = data;
      const note = notes.find(d =>  d.get('idDevoir') === idDevoir);
      const user = data[`users:${idUser}`];
      if (!note || !user) {
        channel.trigger("not:found");
        return;
      }
      // si un user peut charger le devoir, c'est qu'il a le droit de le voir
      const notesExosDuDevoirUser = notesexos.filter(a => a.get('idDevoir') === idDevoir && a.get('idUser') === idUser);
      const collecNotesExo = new notesexos.constructor(notesExosDuDevoirUser);
      if (user.get('id') !== logged.get('id')) {
        // prof / admin qui regarde les notes d'un élève
        channel.trigger("ariane:push", { text: `Notes de ${user.get('nomComplet')} pour ${note.get('nom')}`, link: `#devoir:${idDevoir}/notes/user:${idUser}` });
      } else {
        // élève qui regarde ses propres notes
        channel.trigger("ariane:push", { text: `Notes pour ${note.get("nom")}`, link: `#mynotes:${idDevoir}` });
      }
      require("./exolist/controller.js").controller.showNotesExosListForDevoirUser(note, collecNotesExo, user);
    }).fail( (response) => {
      channel.trigger("data:fetch:fail", response);
    }).always( () => {
      channel.trigger("loading:down");
    });
  },

  showNotesListForEleve(idUser) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    channel.trigger("loading:up");
    const fetching = channel.request("custom:entities", ["notes", `users:${idUser}`]);
    $.when(fetching).done( (data) => {
      const {notes} = data;
      const user = data[`users:${idUser}`];
      if (!user) {
        channel.trigger("not:found");
        return;
      }
      const notesUser = notes.filter(a => a.get('idUser') === user.id);
      const collecNotes = new notes.constructor(notesUser);

      if (logged.id === idUser) {
        // si utilisateur est user alors se sont ses notes et c'est le home
        channel.trigger("ariane:reset", []);
      } else {
        channel.trigger("ariane:push", { text: `Notes de ${user.get('nomComplet')}`, link: `#user:${idUser}/notes` });
      }

      require("./list/controller.js").controller.showNotesListForEleve(user, collecNotes);
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
    "devoir::idDevoir/notes/user::idUser": "showNotesExosForDevoirUser",
    "mynotes::id": "showMyNotesExosForDevoir",
  },

  showNotesForDevoir(id) {
    controller.showNotesForDevoir(id);
  },

  showNotesExosForDevoirUser(idDevoir, idUser) {
    controller.showNotesExosForDevoirUser(idDevoir, idUser);
  },

  showMyNotesExosForDevoir(idDevoir) {
    controller.showMyNotesExosForDevoir(idDevoir);
  }
});

new Router();

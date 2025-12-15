import Backbone from "backbone";
import {MnObject} from "backbone.marionette"

const Controller = MnObject.extend({
  channelName: "app",
  radioEvents: {
    "exercices:list": "onExercicesList",
    "sujet:exercice:show": "onSujetExerciceShow",
    "exercice:apercu": "onExerciceApercu",
    "exodevoir:run": "onExoDevoirRun",
    "exodevoir:run:bynumber": "onExoDevoirRunByNumber",
    "trial:run": "onTrialRun",
  },

  onExercicesList() {
    Backbone.history.navigate(`exercices`, {});
    Backbone.trigger("exercices:list");
    this.exercicesList();
  },

  onSujetExerciceShow(id) {
    Backbone.history.navigate(`sujet-exercice:${id}`, {});
    this.sujetExerciceShow(id);
  },

  onExerciceApercu(sujetExo, region) {
    require("./run/controller.js").controller.showApercu(sujetExo, region);
  },

  onTrialRun(idTrial, idExoDevoir, idExo, idDevoir, idUser) {
    Backbone.history.navigate(`trial:${idTrial}/${idExoDevoir}/${idExo}/${idDevoir}/${idUser}`, {});
    this.trialRun(idTrial, idExoDevoir, idExo, idDevoir, idUser);
  },

  onExoDevoirRun(idExoDevoir, idExo, idDevoir, idUser) {
    Backbone.history.navigate(`exodevoir:${idExoDevoir}/${idExo}/${idDevoir}/${idUser}/run`, {});
    this.exoDevoirRun(idExoDevoir, idExo, idDevoir, idUser);
  },

  onExoDevoirRunByNumber(idDevoir, num) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isEleve()) {
      return;
    }
    // il faut charger les exodevoirs pour voir celui qui a le bon idDevoir et le bon num
    channel.trigger("loading:up");
    const fetching = channel.request("custom:entities", ["exodevoirs"]);
    $.when(fetching).done( (data) => {
      const {exodevoirs} = data;
      const exoDevoir = exodevoirs.find(ed => ed.get('idDevoir') === Number(idDevoir) && ed.get('num') === Number(num));
      if (!exoDevoir) {
        channel.trigger("not:found");
        return;
      }
      this.onExoDevoirRun(exoDevoir.id, exoDevoir.get("idExo"), exoDevoir.get("idDevoir"), logged.id);
    }).fail( (response) => {
      console.error("Erreur chargement exodevoirs", response);
    }).always( () => {
      channel.trigger("loading:down");
    });
  },

  exercicesList(criterion) {
    const channel = this.getChannel();
    channel.trigger("loading:up");
    const fetching = channel.request("custom:entities", ["sujetsexercices"]);
    $.when(fetching).done((data) => {
      const {sujetsexercices} = data;
      channel.trigger("ariane:push", { text:"Exercices", link:"exercices"});
      require("./list/controller.js").controller.list(sujetsexercices, criterion);
    }).fail((response) => {
      channel.trigger("data:fetch:fail", response);
    }).always(() => {
      channel.trigger("loading:down");
    });
  },

  sujetExerciceShow(id) {
    const channel = this.getChannel();
    channel.trigger("loading:up");
    const fetching = channel.request("data:getitem", "sujetsexercices", id);
    $.when(fetching).done((sujetExo) => {
      if (!sujetExo) {
        channel.trigger("not:found");
        return;
      }
      channel.trigger("ariane:push", { text: sujetExo.get("title"), link: `sujet-exercice:${id}` });
      require("./show/controller.js").controller.show(sujetExo);
    }).fail((response) => {
      channel.trigger("data:fetch:fail", response);
    }).always(() => {
      channel.trigger("loading:down");
    });
  },

  sujetExerciceEdit(id) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isAdmin() && !logged.isProf()) {
      channel.trigger("not:found");
      return;
    }
    channel.trigger("loading:up");
    const fetching = channel.request("data:getitem", "sujetsexercices", id);
    $.when(fetching).done((sujetExo) => {
      if (!sujetExo) {
        channel.trigger("not:found");
        return;
      }
      channel.trigger("ariane:push", { text:`Modification de #${sujetExo.get('id')}:${sujetExo.get("title")}`, link:`sujet-exercice:${id}/edit` });
      require("./edit/controller.js").controller.edit(sujetExo);
    }).fail((response) => {
      channel.trigger("data:fetch:fail", response);
    }).always(() => {
      channel.trigger("loading:down");
    });
  },

  sujetExerciceClone(id) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isAdmin() && !logged.isProf()) {
      channel.trigger("not:found");
      return;
    }
    channel.trigger("loading:up");
    const fetching = channel.request("data:getitem", "sujetsexercices", id);
    $.when(fetching).done((sujetExo) => {
      if (!sujetExo) {
        channel.trigger("not:found");
        return;
      }
      channel.trigger("ariane:push", { text:`Clone de #${sujetExo.get('id')}:${sujetExo.get("title")}`, link:`sujet-exercice:${id}/clone` });
      const SujetExo = require("./sujetexo.js").Item;
      const newSujetExo = new SujetExo({
        title: `Clone de #${sujetExo.get('id')}:${sujetExo.get("title")}`,
        description: sujetExo.get("description"),
        published: false,
        idOwner: logged.get("id"),
        nomOwner: logged.get("nom"),
        keywords: sujetExo.get("keywords"),
        options: sujetExo.get("options"),
        code: sujetExo.get("code"),
        init: sujetExo.get("init")
      });
      require("./edit/controller.js").controller.edit(newSujetExo);
    }).fail((response) => {
      channel.trigger("data:fetch:fail", response);
    }).always(() => {
      channel.trigger("loading:down");
    });
  },

  sujetExerciceNew() {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isAdmin() && !logged.isProf()) {
      channel.trigger("not:found");
      return;
    }
    const SujetExo = require("./sujetexo.js").Item;
    const newSujetExo = new SujetExo({
      title: "Nouvel exercice",
      description: "Description de l'exercice",
      published: false,
      idOwner: logged.get("id"),
      nomOwner: logged.get("nom")
    });
    channel.trigger("ariane:push", { text:"Création", link:`sujet-exercice/new`, fragile:true });
    require("./edit/controller.js").controller.edit(newSujetExo);
  },

  exoDevoirRun(idExoDevoir, idExo, idDevoir, idUser) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (logged.isOff()) {
      channel.trigger("not:found");
      return;
    }
    channel.trigger("loading:up");
    const fetching = channel.request("custom:entities", [
      `notesexos:${idUser}_${idExoDevoir}`,
      `sujetsexercices:${idExo}`,
      `notes:${idUser}_${idDevoir}`,
      `users:${idUser}`,
      `unfinished:${idUser}_${idExoDevoir}`
    ]);
    $.when(fetching).done((data) => {
      const noteexo = data[`notesexos:${idUser}_${idExoDevoir}`];
      const note = data[`notes:${idUser}_${idDevoir}`];
      const sujet = data[`sujetsexercices:${idExo}`];
      const user = data[`users:${idUser}`];
      const trial = data[`unfinished:${idUser}_${idExoDevoir}`];
      if (!noteexo||!note||!sujet||!user
        || noteexo.get("idExo") != sujet.id
        || noteexo.get("idDevoir") != note.get("idDevoir")
      ) {
        channel.trigger("not:found");
        return;
      }
      channel.trigger("ariane:push", { text: `Exo ${noteexo.get("num")}/${note.get("exosCount")}`, link: `exodevoir:${idExoDevoir}/${idExo}/${idDevoir}/${idUser}/run` });
      const region = channel.request("region:main");
      require("./run/controller.js").controller.runExoDevoirForEleve(noteexo, sujet, note, user, trial, region);
    }).fail((response) => {
      channel.trigger("data:fetch:fail", response);
    }).always(() => {
      channel.trigger("loading:down");
    });
  },

  trialRun(idTrial, idExoDevoir, idExo, idDevoir, idUser) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isProf() && !logged.isAdmin()) {
      channel.trigger("not:found");
      return;
    }
    channel.trigger("loading:up");
    const fetching = channel.request("custom:entities", [
      `trials:${idTrial}`,
      `notesexos:${idUser}_${idExoDevoir}`,
      `sujetsexercices:${idExo}`,
      `notes:${idUser}_${idDevoir}`,
      `users:${idUser}`
    ]);
    $.when(fetching).done((data) => {
      const trial = data[`trials:${idTrial}`];
      const noteexo = data[`notesexos:${idUser}_${idExoDevoir}`];
      const note = data[`notes:${idUser}_${idDevoir}`];
      const sujet = data[`sujetsexercices:${idExo}`];
      const user = data[`users:${idUser}`];
      if (!noteexo||!note||!sujet||!user||!trial
        || noteexo.get("idExo") != sujet.id
        || noteexo.get("idDevoir") != note.get("idDevoir")
        || trial.get("idExoDevoir") != noteexo.get("idExoDevoir")
        || trial.get("idUser") != noteexo.get("idUser")
      ) {
        channel.trigger("not:found");
        return;
      }
      channel.trigger("ariane:push", { text: `Essai #${idTrial} &mdash; ${user.get("nomComplet")} &mdash; Exo ${noteexo.get("num")}/${note.get("exosCount")}`, link: `exodevoir:${idExoDevoir}/${idExo}/${idDevoir}/${idUser}/run`, fragile:true });
      const region = channel.request("region:main");
      require("./run/controller.js").controller.showTrialForProf(noteexo, sujet, note, user, trial, region);
    }).fail((response) => {
      channel.trigger("data:fetch:fail", response);
    }).always(() => {
      channel.trigger("loading:down");
    });
  }


});

const controller = new Controller();

const Router = Backbone.Router.extend({
  routes: {
    "exercices(/filter/criterion::criterion)": "exercicesList",
    "sujet-exercice::id": "sujetExerciceShow",
    "sujet-exercice::id/edit": "sujetExerciceEdit",
    "sujet-exercice::id/clone": "sujetExerciceClone",
    "sujet-exercice/new": "sujetExerciceNew",
    "exodevoir::id/:id/:id/:id/run": "exoDevoirRun",
    "trial::id/:id/:id/:id/:id": "trialRun",
  },

  exercicesList(criterion) {
    controller.exercicesList(criterion);
  },
  sujetExerciceShow(id) {
    controller.sujetExerciceShow(id);
  },
  sujetExerciceEdit(id) {
    controller.sujetExerciceEdit(id);
  },
  sujetExerciceClone(id) {
    controller.sujetExerciceClone(id);
  },
  sujetExerciceNew() {
    controller.sujetExerciceNew();
  },
  exoDevoirRun(idExoDevoir, idExo, idDevoir, idUser) {
    controller.exoDevoirRun(idExoDevoir, idExo, idDevoir, idUser);
  },
  trialRun(idTrial, idExoDevoir, idExo, idDevoir, idUser) {
    controller.trialRun(idTrial, idExoDevoir, idExo, idDevoir, idUser);
  }

});

new Router();
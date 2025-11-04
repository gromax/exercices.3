import Backbone from "backbone";
import {MnObject} from "backbone.marionette"

const Controller = MnObject.extend({
  channelName: "app",
  radioEvents: {
    "exercices:list": "onExercicesList",
    "sujet:exercice:show": "onSujetExerciceShow",
    "exercice:apercu": "onExerciceApercu",
    "exodevoir:run": "onExoDevoirRun"
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

  onExoDevoirRun(idExoDevoir, idExo, idDevoir, idUser) {
    Backbone.history.navigate(`exodevoir:${idExoDevoir}/${idExo}/${idDevoir}/${idUser}/run`, {});
    this.exoDevoirRun(idExoDevoir, idExo, idDevoir, idUser);
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
      channel.trigger("ariane:push", { text: sujetExo.get("title"), link: `exercice:${id}` });
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
      channel.trigger("ariane:push", { text:"Modification", link:`exercice:${id}/edit` });
      require("./edit/controller.js").controller.edit(sujetExo);
    }).fail((response) => {
      channel.trigger("data:fetch:fail", response);
    }).always(() => {
      channel.trigger("loading:down");
    });
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
      `exodevoirs:${idExoDevoir}`,
      `sujetsexercices:${idExo}`,
      `devoirs:${idDevoir}`,
      `users:${idUser}`,
      `unfinished:${idUser}_${idExoDevoir}`
    ]);
    $.when(fetching).done((data) => {
      const exoDevoir = data[`exodevoirs:${idExoDevoir}`];
      const devoir = data[`devoirs:${idDevoir}`];
      const sujet = data[`sujetsexercices:${idExo}`];
      const user = data[`users:${idUser}`];
      const trial = data[`unfinished:${idUser}_${idExoDevoir}`];
      if (!exoDevoir||!devoir||!sujet||!user
        || exoDevoir.get("idExo") != sujet.id
        || exoDevoir.get("idDevoir") != devoir.id
      ) {
        channel.trigger("not:found");
        return;
      }
      channel.trigger("ariane:push", { text: sujet.get("title"), link: `exodevoir:${idExoDevoir}/${idExo}/${idDevoir}/${idUser}/run` });
      const region = channel.request("region:main");
      require("./run/controller.js").controller.runExoDevoirForEleve(exoDevoir, sujet, devoir, user, trial, region);
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
    "exodevoir::id/:id/:id/:id/run": "exoDevoirRun"
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
  exoDevoirRun(idExoDevoir, idExo, idDevoir, idUser) {
    controller.exoDevoirRun(idExoDevoir, idExo, idDevoir, idUser);
  }
});

new Router();
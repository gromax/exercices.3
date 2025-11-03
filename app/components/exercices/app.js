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

  onExoDevoirRun(idExoDevoir) {
    Backbone.history.navigate(`exodevoir:${idExoDevoir}/run`, {});
    this.exoDevoirRun(idExoDevoir);
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

  exoDevoirRun(idExoDevoir) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (logged.isOff()) {
      channel.trigger("not:found");
      return;
    }
    channel.trigger("loading:up");
    const fetching = channel.request("custom:entities", [`exodevoirs:${idExoDevoir}`, "devoirs", "sujetsexercices"]);
    $.when(fetching).done((data) => {
      const {devoirs, sujetsexercices} = data;
      const exoDevoir = data[`exodevoirs:${idExoDevoir}`];
      if (!exoDevoir) {
        channel.trigger("not:found");
        return;
      }
      const sujetExo = sujetsexercices.get(exoDevoir.get("idExo"));
      if (!sujetExo) {
        channel.trigger("not:found");
        return;
      }
      const devoir = devoirs.get(exoDevoir.get("idDevoir"));
      if (!devoir) {
        channel.trigger("not:found");
        return;
      }
      if (logged.isEleve() && devoir.get("idClasse") !== logged.get("idClasse")) {
        channel.trigger("not:found");
        return;
      }
      const region = channel.request("region:get", "main");
      // existe pas encore
      require("./run/controller.js").controller.runExoDevoir(exoDevoir, sujetExo, devoir, region);
      // prof ne pourrait de toute façon pas voir un devoir dont il n'est pas l'auteur
      console.log(`Prêt à lancer l'exercice devoir ${exoDevoir.id} pour le devoir ${devoir.get("nom")} et l'exercice ${sujetExo.get("title")}`);
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
    "exodevoir::idExoDevoir/run": "exoDevoirRun"
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
  exoDevoirRun(idExoDevoir) {
    controller.exoDevoirRun(idExoDevoir);
  }
});

new Router();
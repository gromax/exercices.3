import Backbone from "backbone";
import {MnObject} from "backbone.marionette"

const Controller = MnObject.extend({
  channelName: "app",
  radioEvents: {
    "exercices:list": "onExercicesList",
    "sujet:exercice:show": "onSujetExerciceShow",
    "exercice:apercu": "onExerciceApercu"
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

  exercicesList(criterion) {
    const channel = this.getChannel();
    channel.trigger("ariane:reset", [
      { text:"Exercices", link:"exercices"}
    ]);
    channel.trigger("loading:up");
    const fetching = channel.request("custom:entities", ["sujetsexercices"]);
    $.when(fetching).done((sujetsExos) => {
      require("./list/controller.js").controller.list(sujetsExos, criterion);
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
      require("./show/controller.js").controller.show(id, sujetExo);
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
      require("./edit/controller.js").controller.edit(id, sujetExo);
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
    "sujet-exercice::id/edit": "sujetExerciceEdit"
  },

  exercicesList(criterion) {
    controller.exercicesList(criterion);
  },
  sujetExerciceShow(id) {
    controller.sujetExerciceShow(id);
  },
  sujetExerciceEdit(id) {
    controller.sujetExerciceEdit(id);
  }
});

new Router();
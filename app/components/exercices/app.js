import Backbone from "backbone";
import {MnObject} from "backbone.marionette"

const Controller = MnObject.extend({
  channelName: "app",
  radioEvents: {
    "exercices:list": "onExercicesList",
    "exercice:show": "onExerciceShow",
    "exercice:apercu": "onExerciceApercu"
  },

  onExercicesList() {
    Backbone.history.navigate(`exercices`, {});
    Backbone.trigger("exercices:list");
    this.exercicesList();
  },

  onExerciceShow(id) {
    Backbone.history.navigate(`exercice:${id}`, {});
    this.exerciceShow(id);
  },

  onExerciceApercu(exercice) {
    require("./run/controller.js").controller.showApercu(exercice);
  },

  exercicesList(criterion) {
    const channel = this.getChannel();
    channel.trigger("ariane:reset", [{ text:"Exercices", e:"exercices:list", data:criterion, link:"exercices"}]);
    channel.trigger("loading:up");
    const fetching = channel.request("custom:entities", ["exercices"]);
    $.when(fetching).done((exercices) => {
      require("./list/controller.js").controller.list(exercices, criterion);
    }).fail((response) => {
      channel.trigger("data:fetch:fail", response);
    }).always(() => {
      channel.trigger("loading:down");
    });
  },

  exerciceShow(id) {
    const channel = this.getChannel();
    channel.trigger("loading:up");
    const fetching = channel.request("exercice:entity", id);
    $.when(fetching).done((exercice) => {
      require("./show/controller.js").controller.show(id, exercice);
    }).fail((response) => {
      channel.trigger("data:fetch:fail", response);
    }).always(() => {
      channel.trigger("loading:down");
    });
  },
  exerciceEdit(id) {  
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isAdmin() && !logged.isProf()) {
      channel.trigger("not:found");
      return;
    }
    channel.trigger("loading:up");
    const fetching = channel.request("exercice:entity", id);
    $.when(fetching).done((exercice) => {
      require("./edit/controller.js").controller.edit(id, exercice);
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
    "exercice::id": "exerciceShow",
    "exercice::id/edit": "exerciceEdit"
  },

  exercicesList(criterion) {
    controller.exercicesList(criterion);
  },
  exerciceShow(id) {
    controller.exerciceShow(id);
  },
  exerciceEdit(id) {
    controller.exerciceEdit(id);
  }
});

new Router();
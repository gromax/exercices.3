import Backbone from "backbone";
import { MnObject } from "backbone.marionette"

const Controller = MnObject.extend ({
  channelName: "app",
  radioEvents: {
    "classes:list": "onClassesList",
    "classe:show": "onClasseShow",
    "classe:edit": "onClasseEdit",
    "classes:prof": "onClassesProf"
  },

  onClassesList() {
    Backbone.history.navigate("classes", {});
    this.classesList();
  },

  onClasseShow(id) {
    Backbone.history.navigate(`classe:${id}`, {});
    this.classeShow(id);
  },

  onClasseEdit(id) {
    Backbone.history.navigate(`classe:${id}/edit`, {});
    this.classeEdit(id);
  },

  onClassesProf(id) {
    Backbone.history.navigate(`classes/prof:${id}`, {});
    this.classeProf(id);
  },

  classesList() {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");

    const forProf = () => {
      channel.trigger("ariane:reset", [{ text: "Classes", e: "classes:list", link: "classes" }]);
      channel.trigger("loading:up");
      fetching = channel.request("custom:entities", ["classes"]);
      $.when(fetching).done( (classes) => {
        require("./list/controller.js").controller.list(classes, false);
      }).fail( (response) => {
        channel.trigger("data:fetch:fail", response);
      }).always( () => {
        channel.trigger("loading:down");
      });
    };

    const todo = logged.mapItem({
      "Admin": forProf,
      "Prof": forProf,
      "Eleve": () => channel.trigger("not:found"),
      "def": () => channel.trigger("home:login")
    });
    todo();
  },

  classeShow(id) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");

    const forProf = () => {
      channel.trigger("ariane:reset", [{ text:"Classes", e:"classes:list", link:"classes"}]);
      channel.trigger("loading:up");
      const fetching = channel.request("classe:entity", id);
      $.when(fetching).done( (classe) => {
        require("./show/controller.js").controller.show(id, classe);
      }).fail( (response) => {
        channel.trigger("data:fetch:fail", response);
      }).always( () => {
        channel.trigger("loading:down");
      });      
    };

    const todo = logged.mapItem({
      "Admin": forProf,
      "Prof": forProf,
      "Eleve": () => channel.trigger("not:found"),
      "def": () => channel.trigger("home:login")
    });
    todo();
  },

  classeEdit(id) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    
    const forProf = () => {
      channel.trigger("ariane:reset", [{ text:"Classes", e:"classes:list", link:"classes"}]);
      channel.trigger("loading:up");
      $.when(channel.request("classe:entity", id)).done( (classe) => {
        require("./edit/controller.js").controller.edit(id, classe);
      }).fail( (response) => {
        channel.trigger("data:fetch:fail", response);
      }).always( () => {
        channel.trigger("loading:down");
      });
      require("apps/classes/edit/edit_classe_controller.coffee").controller.edit(id);
    }

    const todo = logged.mapItem({
      "Admin": forProf,
      "Prof": forProf,
      "Eleve": () => channel.trigger("not:found"),
      "def": () => channel.trigger("home:login")
    });
    todo();
  },

  classesProf(id) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");

    const forAdmin = () => {
      channel.trigger("ariane:reset", [{ text: "Classes", e: "classes:list", link: "classes" }]);
      channel.trigger("loading:up");
      const fetching = channel.request("custom:entities", ["classes", "users"]);
      $.when(fetching).done((classes, users) => {
        const prof = users.get(id);
        if (!prof) {
          channel.trigger("not:found");
          return;
        }
        require("./list/controller.js").controller.list(classes, prof);
      }).fail((response) => {
        channel.trigger("data:fetch:fail", response);
      }).always(() => {
        channel.trigger("loading:down");
      });
    };

    const todo = logged.mapItem({
      "Admin": forAdmin,
      "Prof": () => channel.trigger("not:found"),
      "Eleve": () => channel.trigger("not:found"),
      "def": () => channel.trigger("home:login")
    });
    todo();
  },

});

const controller = new Controller();

const Router = Backbone.Router.extend({
  routes: {
    "classes/prof::id": "classesProf",
    "classes": "classesList",
    "classe::id": "classeShow",
    "classe::id/edit": "classeEdit"
  },

  classesProf(id) {
    controller.classesProf(id);
  },

  classesList() {
    controller.classesList();
  },

  classeShow(id) {
    controller.classeShow(id);
  },

  classeEdit(id) {
    controller.classeEdit(id);
  }
});

new Router();
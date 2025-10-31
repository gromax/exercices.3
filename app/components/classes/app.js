import Backbone from "backbone";
import { MnObject } from "backbone.marionette"

const Controller = MnObject.extend ({
  channelName: "app",
  radioEvents: {
    "classes:list": "onClassesList",
    "classe:show": "onClasseShow",
    "classes:prof": "onClassesProf",
    "classes:tojoin": "onClassesToJoinShow"
  },

  onClassesList() {
    Backbone.history.navigate("classes", {});
    this.classesList();
  },

  onClasseShow(id) {
    Backbone.history.navigate(`classe:${id}`, {});
    this.classeShow(id);
  },

  onClassesProf(id) {
    Backbone.history.navigate(`classes/prof:${id}`, {});
    this.classeProf(id);
  },

  onClassesToJoinShow() {
    Backbone.history.navigate("classes/tojoin", {});
    this.classesToJoinShow();
  },

  classesList() {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");

    if(logged.isEleve() || logged.isOff()) {
      channel.trigger("not:found");
      return;
    }
    channel.trigger("loading:up");
    const fetching = channel.request("custom:entities", ["classes"]);
    $.when(fetching).done( (data) => {
      const { classes } = data;
      if (logged.isProf()) {
        channel.trigger("ariane:push", { text: "Vos classes", link: "classes" });
      } else {
        channel.trigger("ariane:push", { text: "Classes", link: "classes" });
      }
      require("./list/controller.js").controller.list(classes);
    }).fail( (response) => {
      channel.trigger("data:fetch:fail", response);
    }).always( () => {
      channel.trigger("loading:down");
    });

  },

  classeShow(id) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");

    if (logged.isEleve() || logged.isOff()) {
      channel.trigger("not:found");
      return;
    }

    channel.trigger("loading:up");
    const fetching = channel.request("data:getitem", "classes", id);
    $.when(fetching).done( (classe) => {
      if (classe === undefined) {
        channel.trigger("not:found");
        return;
      }
      channel.trigger("ariane:push", { text: classe.get("name"), link: `classe:${id}` });
      require("./show/controller.js").controller.show(classe);
    }).fail( (response) => {
      channel.trigger("data:fetch:fail", response);
    }).always( () => {
      channel.trigger("loading:down");
    });

  },

  classeEdit(id) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");

    if (!logged.isProf() && !logged.isAdmin()) {
      channel.trigger("not:found");
      return;
    }

    channel.trigger("loading:up");
    $.when(channel.request("data:getitem", "classes", id)).done( (classe) => {
      if (classe === undefined) {
        channel.trigger("not:found");
        return;
      }
      channel.trigger("ariane:push", { text: `Modification de ${classe.get("name")}`, link: `classe:${id}/edit` });
      require("./edit/controller.js").controller.edit(classe);
    }).fail( (response) => {
      channel.trigger("data:fetch:fail", response);
    }).always( () => {
      channel.trigger("loading:down");
    });
  },

  classesProf(id) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");

    if (!logged.isAdmin()) {
      channel.trigger("not:found");
      return;
    }

    channel.trigger("loading:up");
    const fetching = channel.request("custom:entities", ["classes", "users"]);
    $.when(fetching).done((data) => {
      const {classes, users} = data;
      const prof = users.get(id);
      if (!prof) {
        channel.trigger("not:found");
        return;
      }
      const filteredClasses = new classes.constructor(classes.filter((classe) => classe.get("idOwner") === prof.get("id")));
      channel.trigger("ariane:push", { text: `Classes de ${prof.get("name")}`, link: `classes/prof:${id}` });
      require("./list/controller.js").controller.list(filteredClasses, prof);
    }).fail((response) => {
      channel.trigger("data:fetch:fail", response);
    }).always(() => {
      channel.trigger("loading:down");
    });
  },

  classesToJoinShow() {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isOff()) {
      channel.trigger("not:found");
      return;
    }
    const fetchingClasses = channel.request("classes:tojoin:fetch");
    channel.trigger("loading:up");
    $.when(fetchingClasses).done( (data) => {
      const { classes } = data;
      channel.trigger("ariane:push", { text: "Classes ouvertes", link: "classes/signin" });
      require("./signin/controller.js").controller.showSigninClasses(classes);
    }).fail( (response) => {
      channel.trigger("data:fetch:fail", response);
    }).always( () => {
      channel.trigger("loading:down");
    });
  },

  classeNew() {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isProf()) {
      channel.trigger("not:found");
      return;
    }
    channel.trigger("ariane:push", { text: "Créer une classe", link: "classe/new" });
    require("./edit/controller.js").controller.newClasse(logged);
  }
});

const controller = new Controller();

const Router = Backbone.Router.extend({
  routes: {
    "classes/prof::id": "classesProf",
    "classes": "classesList",
    "classe::id": "classeShow",
    "classe::id/edit": "classeEdit",
    "classes/signin": "classesToJoinShow",
    "classe/new": "classeNew"
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
  },

  classesToJoinShow() {
    controller.classesToJoinShow();
  },

  classeNew() {
    controller.classeNew();
  }
});

new Router();
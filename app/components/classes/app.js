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
    this.classesList(id);
  },

  onClassesToJoinShow() {
    Backbone.history.navigate("classes/tojoin", {});
    this.classesToJoinShow();
  },

  classesList(idProf = null) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");

    if(logged.isEleve() || logged.isOff()) {
      channel.trigger("not:found");
      return;
    }
    channel.trigger("loading:up");
    const dataToLoad = idProf ? ["classes", "users"] : ["classes"];
    const fetching = channel.request("custom:entities", dataToLoad);
    $.when(fetching).done( (data) => {
      const user = idProf ? data.users.get(idProf) : null;
      if (idProf && !user) {
        channel.trigger("not:found");
        return;
      }
      const classes = idProf
        ? new data.classes.constructor(data.classes.filter((classe) => classe.get("idOwner") === idProf))
        : data.classes;
      if (idProf) {
        channel.trigger("ariane:push", { text: `Classes de ${user.get("name")}`, link: `classes/prof:${idProf}` });
      } else if (logged.isProf()) {
        channel.trigger("ariane:push", { text: "Vos classes", link: "classes" });
      } else {
        channel.trigger("ariane:push", { text: "Classes", link: "classes" });
      }
      require("./list/controller.js").controller.list(classes, user, channel.request("region:main"));
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
      channel.trigger("ariane:push", { text: classe.get("nom"), link: `classe:${id}` });
      require("./show/controller.js").controller.show(classe, channel.request("region:main"));
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
      require("./edit/controller.js").controller.edit(classe, channel.request("region:main"));
    }).fail( (response) => {
      channel.trigger("data:fetch:fail", response);
    }).always( () => {
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
      require("./signin/controller.js").controller.showSigninClasses(classes, channel.request("region:main"));
    }).fail( (response) => {
      channel.trigger("data:fetch:fail", response);
    }).always( () => {
      channel.trigger("loading:down");
    });
  },

  classeNew(idProf = null) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isProf() && (!logged.isAdmin() || idProf === null)) {
      channel.trigger("not:found");
      return;
    }
    if (logged.isProf()) {
      if (idProf !== null && idProf !== logged.id) {
        channel.trigger("not:found");
        return;
      }
      idProf = null;
    }
    const dataToLoad = idProf ? ["users"] : [];
    const fetching = channel.request("custom:entities", dataToLoad);
    channel.trigger("loading:up");
    $.when(fetching).done((data) => {
      const prof = idProf === null ? null : data.users.get(idProf);
      if (!prof && logged.isAdmin()) {
        channel.trigger("not:found");
        return;
      }
      if (logged.isAdmin()) {
        channel.trigger("ariane:push", { text: `Créer une classe pour ${prof.get("nomComplet")}`, link: `classe/new:${prof.id}`, fragile:true });
      } else {
        channel.trigger("ariane:push", { text: "Créer une nouvelle classe", link: "classe/new", fragile:true });
      }
      require("./edit/controller.js").controller.newClasse(prof || logged, channel.request("region:main"));
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
    "classes/prof::id": "classesProf",
    "classes": "classesList",
    "classe::id": "classeShow",
    "classe::id/edit": "classeEdit",
    "classes/signin": "classesToJoinShow",
    "classe/new": "classeNew",
    "classe/new::idProf": "classeNew"
  },

  classesProf(id) {
    controller.classesList(id);
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

  classeNew(idProf = null) {
    controller.classeNew(idProf);
  }
});

new Router();
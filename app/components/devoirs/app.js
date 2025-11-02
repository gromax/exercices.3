import Backbone from 'backbone'
import { MnObject } from 'backbone.marionette'

const Controller = MnObject.extend({
  channelName: 'app',

  radioEvents: {
    'devoir:dashboard': 'onShowDashboard',
  },

  onShowDashboard(id) {
    Backbone.history.navigate(`devoir:${id}/dashboard`, { trigger: true });
    this.devoirShowDashboard(id);
  },

  devoirShow(id) {
    const channel = this.getChannel();
    //const fetching = channel.request("custom:entities", ["devoirs", "exodevoirs"]);
    const fetching = channel.request("custom:entities", [`devoirs:${id}`, "exodevoirs"]);
    id = Number(id);
    $.when(fetching).done((data) => {
      // récupérer le bon devoir
      const { exodevoirs } = data;
      const devoir = data[`devoirs:${id}`];
      //const devoir = devoirs.find(d => d.id === id);
      if (!devoir) {
        channel.trigger("not:found");
        return;
      }
      const assocs = exodevoirs.filter(a => a.get('idDevoir') === id);
      const collecAssocs = new exodevoirs.constructor(assocs);

      channel.trigger("ariane:push", { text: devoir.get("nom"), link: `devoir:${id}` });
      channel.trigger("popup:alert", "Non encore implémenté.");
      //require("./editexos/controller.js").controller.show(id, devoir, collecAssocs);
    }).fail((response) => {
      channel.trigger("data:fetch:fail", response);
    }).always(() => {
      channel.trigger("loading:down");
    });
  },

  devoirsList() {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isProf() && !logged.isAdmin()) {
      channel.trigger("not:found");
      return;
    }
    const fetching = channel.request("custom:entities", ["devoirs"]);
    $.when(fetching).done((data) => {
      const {devoirs} = data;
      channel.trigger("ariane:push", { text: "Devoirs", link: "devoirs" });
      channel.trigger("loading:up");
      require("./list/controller.js").controller.list(devoirs);
    }).fail((response) => {
      channel.trigger("data:fetch:fail", response);
    }).always(() => {
      channel.trigger("loading:down");
    });
  },

  devoirShowDashboard(id) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isProf() && !logged.isAdmin()) {
      channel.trigger("not:found");
      return;
    }
    const fetching = channel.request("custom:entities", ["devoirs", "exodevoirs"]);
    id = Number(id);
    $.when(fetching).done((data) => {
      // récupérer le bon devoir
      const {devoirs, exodevoirs} = data;
      const devoir = devoirs.find(d => d.id === id);
      if (!devoir) {
        channel.trigger("not:found");
        return;
      }
      const assocs = exodevoirs.filter(a => a.get('idDevoir') === id);
      const collecAssocs = new exodevoirs.constructor(assocs);

      channel.trigger("ariane:push", { text: devoir.get("nom"), link: `devoir:${id}/dashboard` });
      
      require("./editexos/controller.js").controller.show(devoir, collecAssocs);
    }).fail((response) => {
      channel.trigger("data:fetch:fail", response);
    }).always(() => {
      channel.trigger("loading:down");
    });
  },

  devoirAddExo(id) {
    const channel = this.getChannel();
    id = Number(id);
    const logged = channel.request("logged:get");
    if (!logged.isProf() && !logged.isAdmin()) {
      channel.trigger("not:found");
      return;
    }
    const fetching = channel.request("custom:entities", ["devoirs", "exodevoirs", "sujetsexercices"]);

    $.when(fetching).done((data) => {
      const {devoirs, exodevoirs, sujetsexercices} = data;
      // récupérer le bon devoir
      const devoir = devoirs.find(d => d.id === id);
      if (!devoir) {
        channel.trigger("not:found");
        return;
      }
      const assocs = exodevoirs.filter(a => a.get('idDevoir') === id);
      const collecAssocs = new exodevoirs.constructor(assocs);

      channel.trigger("ariane:push", { text: "Ajouter des exercices", link: `devoir:${id}/addexo` });

      require("./editexos/controller.js").controller.showAddExo(devoir, collecAssocs, sujetsexercices, "");
    }).fail((response) => {
      channel.trigger("data:fetch:fail", response);
    }).always(() => {
      channel.trigger("loading:down");
    });

  },

  devoirNew() {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isProf()) {
      channel.trigger("not:found");
      return;
    }

    channel.trigger("loading:up");
      const fetching = channel.request("custom:entities", ["classes"]);
      $.when(fetching).done((data) => {
        const {classes} = data;
        if (classes.length === 0) {
          channel.trigger("popup:error", "Impossible de créer un devoir sans classe existante.");
          channel.trigger("not:found");
          return;
        }
        channel.trigger("ariane:push", { text: "Nouveau devoir", link: "devoirs/new", fragile:true });
        
        require("./edit/controller.js").controller.newDevoir(classes);
      }).fail((response) => {
        channel.trigger("data:fetch:fail", response);
      }).always(() => {
        channel.trigger("loading:down");
      });
  },

  devoirEdit(id) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isProf() && !logged.isAdmin()) {
      channel.trigger("not:found");
      return;
    }
    channel.trigger("loading:up");
    const fetching = channel.request("custom:entities", ["devoirs", "classes"]);
    $.when(fetching).done((data) => {
      const {devoirs, classes} = data;
      const devoir = devoirs.find(d => d.id === Number(id));
      if (!devoir) {
        channel.trigger("not:found");
        return;
      }
      channel.trigger("ariane:push", { text: "Modification", link: `devoir:${id}/edit` });

      require("./edit/controller.js").controller.edit(devoir, classes);
    }).fail((response) => {
      channel.trigger("data:fetch:fail", response);
    }).always(() => {
      channel.trigger("loading:down");
    });
  },

  devoirEditExo(idDevoir, idExoDevoir) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isProf() && !logged.isAdmin()) {
      channel.trigger("not:found");
      return;
    }
    const fetching = channel.request("custom:entities", ["devoirs", "exodevoirs", "sujetsexercices"]);
    idDevoir = Number(idDevoir);
    $.when(fetching).done((data) => {
      const {devoirs, exodevoirs, sujetsexercices} = data;
      // récupérer le bon devoir
      const devoir = devoirs.find(d => d.id === idDevoir);
      const assocs = exodevoirs.filter(a => a.get('idDevoir') === idDevoir);
      const collecAssocs = new exodevoirs.constructor(assocs);
      const exoDevoir = collecAssocs.find(a => a.get('id') === Number(idExoDevoir));
      const sujet = sujetsexercices.find(s => s.get('id') === exoDevoir.get('idExo'));
      if (!devoir || !exoDevoir || !sujet) {
        channel.trigger("not:found");
        return;
      }
      channel.trigger("ariane:push", { text: `Exercices ${idExoDevoir}`, link: `devoir:${idDevoir}/exo:${idExoDevoir}` });

      require("./editexos/controller.js").controller.showExo(devoir, collecAssocs, exoDevoir, sujet);
    }).fail((response) => {
      channel.trigger("data:fetch:fail", response);
    }).always(() => {
      channel.trigger("loading:down");
    });
  },

});

const controller = new Controller();

const Router = Backbone.Router.extend({
  routes: {
    "devoirs": "devoirsList",
    "devoir::id": "devoirShow",
    "devoir::id/dashboard": "devoirDashboard",
    "devoir::id/edit": "devoirEdit",
    "devoir::id/addexo": "devoirAddExo",
    "devoirs/nouveau": "devoirNew",
    "devoir::idDevoir/exo::id": "devoirEditExo",
  },
  devoirsList() {
    controller.devoirsList();
  },

  devoirShow(id) {
    controller.devoirShow(id);
  },

  devoirDashboard(id) {
    controller.devoirShowDashboard(id);
  },

  devoirEdit(id) {
    controller.devoirEdit(id);
  },

  devoirNew() {
    controller.devoirNew();
  },

  devoirAddExo(id) {
    controller.devoirAddExo(id);
  },

  devoirEditExo(idDevoir, id) {
    controller.devoirEditExo(idDevoir, id);
  }
});


new Router();
import { MnObject, Region } from 'backbone.marionette';
import { EditDevoirView } from './views.js';

const Controller = MnObject.extend({
  channelName: "app",
  edit(id, devoir, classes) {
    const channel = this.getChannel();
    if (devoir === undefined) {
      channel.trigger("ariane:reset", [
        { text: "Devoirs", link: "devoirs" },
        { text: "Devoir inconnu", link: `devoir:${id}/edit` }
      ]);
      channel.trigger("missing:item");
      return;
    }
    channel.trigger("ariane:reset", [
      { text: "Devoirs", link: "devoirs" },
      { text: devoir.get("nom"), link: `devoir:${id}` },
      { text: "Dashboard", link: `devoir:${id}/params` },
      { text: "Modification", link: `devoir:${id}/edit` },
    ]);

    const view = new EditDevoirView({
      model: devoir,
      classes: classes,
      errorCode: "001",
      title: `Modification du devoir ${devoir.get("nom")}`
    });

    view.on("success", (model, resp) => {
      channel.trigger("devoir:show", model.get("id"));
    });
    new Region({ el: '#main-region' }).show(view);
  },

  newDevoir(classes) {
    const channel = this.getChannel();
    const prof = channel.request("logged:get");
    if (!prof.isProf()) {
      channel.trigger("popup:error", "Impossible de créer un devoir sans professeur.");
      return;
    }
    const Devoir = require('../entity.js').Item;
    const newDevoir = new Devoir({
      idOwner: prof.get("id"),
      nomOwner: prof.get("nom"),
      idClasse: classes.at(0).get("id")
    });
    const view = new EditDevoirView({
      model: newDevoir,
      classes: classes,
      title: `Nouveau devoir pour ${prof.get("nomComplet")}`,
      errorCode: "002"
    });
    channel.trigger("ariane:reset", [
      { text: "devoirs", link: "devoirs" },
      { text: "Nouveau devoir", link: "devoirs/new" }
    ]);
    view.on("success", (model, resp) => {
      channel.trigger("devoir:show", model.get("id"));
    });
    new Region({ el: '#main-region' }).show(view);
  },
});

export const controller = new Controller();

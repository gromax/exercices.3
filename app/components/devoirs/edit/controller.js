import { MnObject, Region } from 'backbone.marionette';
import { EditDevoirView } from './views.js';

const Controller = MnObject.extend({
  channelName: "app",
  edit(devoir, classes) {
    const channel = this.getChannel();
    if (!devoir) {
      channel.trigger("popup:error", "Devoir indéfini.");
      return;
    }

    const view = new EditDevoirView({
      model: devoir,
      classes: classes,
      errorCode: "001",
      title: `Modification du devoir ${devoir.get("nom")}`
    });

    view.on("success", (model, resp) => {
      channel.trigger("devoir:dashboard", model.get("id"));
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
    view.on("success", (model, resp) => {
      channel.trigger("devoir:dashboard", model.get("id"));
    });
    new Region({ el: '#main-region' }).show(view);
  },
});

export const controller = new Controller();

import { MnObject, Region } from 'backbone.marionette';
import { EditClasseView } from './views.js';

const Controller = MnObject.extend({
  channelName: "app",
  edit(id, classe) {
    const channel = this.getChannel();
    if (classe === undefined) {
      channel.trigger("ariane:add", { text: "Classe inconnue", link: `classe:${id}/edit` });
      channel.trigger("missing:item");
      return;
    }
    channel.trigger("ariane:add", [
      { text: classe.get("nom"), link: `classe:${id}` },
      { text: "Modification", link: `classe:${id}/edit` },
    ]);

    const view = new EditClasseView({
      model: classe,
      errorCode: "001",
      title: `Modification de la classe ${classe.get("nom")}`
    });

    view.on("success", (model, resp) => {
      channel.trigger("classe:show", model.get("id"));
    });
    new Region({ el: '#main-region' }).show(view);
  },

  newClasse(prof) {
    const channel = this.getChannel();
    if (!prof) {
      channel.trigger("popup:error", "Impossible de créer une classe sans professeur.");
      return;
    }
    const Classe = require('../entity.js').Item;

    const newClasse = new Classe({
      idOwner: prof.get("id"),
      nomOwner: prof.get("nom"),
    });
    const view = new EditClasseView({
      model: newClasse,
      title: `Nouvelle classe pour ${prof.get("nomComplet")}`,
      errorCode: "002"
    });
    channel.trigger("ariane:reset", [
      { text: "classes", link: "classes" },
      { text: "Nouvelle classe", link: "classes/new" }
    ]);
    view.on("success", (model, resp) => {
      channel.trigger("classe:show", model.get("id"));
    });
    new Region({ el: '#main-region' }).show(view);
  },
});

export const controller = new Controller();

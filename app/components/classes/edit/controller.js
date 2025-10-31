import { MnObject, Region } from 'backbone.marionette';
import { EditClasseView } from './views.js';

const Controller = MnObject.extend({
  channelName: "app",
  edit(classe) {
    const channel = this.getChannel();
    
    if (!classe) {
      channel.trigger("popup:error", "Classe indéfinie.");
      return;
    }
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
    const logged = channel.request("logged:get");
    if (!prof) {
      channel.trigger("popup:error", "Impossible de créer une classe sans professeur.");
      return;
    }
    const Classe = require('../entity.js').Item;

    const newClasse = new Classe({
      idOwner: prof.id,
      nomOwner: prof.get("nom"),
    });
    const view = new EditClasseView({
      model: newClasse,
      title: logged.id === prof.id ? "Nouvelle classe" : `Nouvelle classe pour ${prof.get("nomComplet")}`,
    });
    view.on("success", (model, resp) => {
      channel.trigger("data:collection:additem", "classes", model);
      channel.trigger("classe:show", model.get("id"));
    });
    new Region({ el: '#main-region' }).show(view);
  },
});

export const controller = new Controller();

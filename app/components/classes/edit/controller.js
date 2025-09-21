import { MnObject, Region } from 'backbone.marionette';
import { EditClasseView, NewClasseView } from './views.js';

const Controller = MnObject.extend({
  channelName: "app",
  edit(id, classe) {
    const channel = this.getChannel();
    if (classe === undefined) {
      channel.trigger("ariane:add", { text: "Classe inconnue", e: "classe:edit", data: id, link: `classe:${id}/edit` });
      channel.trigger("missing:item");
      return;
    }
    channel.trigger("ariane:add", [
      { text: classe.get("nom"), e: "classe:show", data: id, link: `classe:${id}` },
      { text: "Modification", e: "classe:edit", data: id, link: `classe:${id}/edit` },
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

  newClasseView(model) {
    const newClasseView = new NewClasseView({
      model: model,
      errorCode: "002"
    });
    new Region({ el: '#modal' }).show(newClasseView);
    return newClasseView;
  }
});

export const controller = new Controller();

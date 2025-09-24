import { MnObject, Region } from 'backbone.marionette';
import { ShowClasseView } from './views.js';

const Controller = MnObject.extend({
  channelName: 'app',
  show(id, classe) {
    const channel = this.getChannel();
    if (classe === undefined) {
      channel.trigger("ariane:add", { text: "Classe inconnue", e: "classe:show", data: id, link: `classe:${id}` });
      channel.trigger("missing:item");
      return;
    }
    channel.trigger("ariane:add", { text: classe.get("nom"), e: "classe:show", data: id, link: `classe:${id}` });
    const view = new ShowClasseView({
      model: classe
    });
    view.on("classe:edit", (item) => {
      channel.trigger("classe:edit", item.get("id"));
    });
    new Region({ el: '#main-region' }).show(view);
  }
});

export const controller = new Controller();

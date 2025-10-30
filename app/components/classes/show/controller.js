import { MnObject, Region } from 'backbone.marionette';
import { ShowClasseView } from './views.js';

const Controller = MnObject.extend({
  channelName: 'app',

  show(id, classe) {
    const channel = this.getChannel();

    if (!classe) {
      channel.trigger("popup:error", "Classe indéfinie.");
      return;
    }

    channel.trigger("ariane:reset", [
      { text: "Classes", link: "classes" },
      { text: classe.get("nom"), link: `classe:${id}` }
    ]);
    const view = new ShowClasseView({
      model: classe
    });
    new Region({ el: '#main-region' }).show(view);
  }
});

export const controller = new Controller();

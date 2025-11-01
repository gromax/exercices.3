import { MnObject, Region } from 'backbone.marionette';
import { ShowClasseView } from './views.js';

const Controller = MnObject.extend({
  channelName: 'app',

  show(classe, region) {
    const channel = this.getChannel();

    if (!classe) {
      channel.trigger("popup:error", "Classe indéfinie.");
      return;
    }

    const view = new ShowClasseView({
      model: classe
    });
    region.show(view);
  }
});

export const controller = new Controller();

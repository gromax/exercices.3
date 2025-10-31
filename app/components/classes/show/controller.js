import { MnObject, Region } from 'backbone.marionette';
import { ShowClasseView } from './views.js';

const Controller = MnObject.extend({
  channelName: 'app',

  show(classe) {
    const channel = this.getChannel();

    if (!classe) {
      channel.trigger("popup:error", "Classe indéfinie.");
      return;
    }

    const view = new ShowClasseView({
      model: classe
    });
    new Region({ el: '#main-region' }).show(view);
  }
});

export const controller = new Controller();
